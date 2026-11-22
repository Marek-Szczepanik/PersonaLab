"""Generování odpovědí pro jednotlivé kombinace person a modelů s podklady persony."""

import asyncio
import json
import logging
from collections.abc import AsyncGenerator, AsyncIterator, Awaitable
from typing import TypeVar

import httpx
import ollama
from anyio import CancelScope
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from api.rag.rag_error import RagError
from api.rag.retrieval.prompt import build_messages
from api.rag.retrieval.retriever import retrieve
from api.repositories.persona_repository import load_personas
from api.schemas.comparison_request import ComparisonRequest
from api.schemas.persona import Persona

router = APIRouter(prefix="/api", tags=["comparison"])
logger = logging.getLogger(__name__)
OperationResult = TypeVar("OperationResult")


def encode_event(persona_id: str, model: str, status: str, **details: object) -> str:
    """Zakóduje jednu stavovou událost jako samostatný řádek JSON."""
    return json.dumps({"persona_id": persona_id, "model": model, "status": status, **details}, ensure_ascii=False) + "\n"


async def wait_for_disconnect(request: Request) -> None:
    """Sleduje zavření spojení, aby šlo zrušit i dlouho běžící volání Ollamy."""
    while not await request.is_disconnected():
        await asyncio.sleep(0.1)


async def await_connected(operation: Awaitable[OperationResult], disconnected: asyncio.Task[None]) -> OperationResult | None:
    """Vyčká na operaci a při odpojení klienta ji zruší včetně spojení s Ollamou."""
    task = asyncio.ensure_future(operation)
    try:
        completed, _ = await asyncio.wait({task, disconnected}, return_when=asyncio.FIRST_COMPLETED)
        if disconnected in completed:
            return None
        return task.result()
    finally:
        with CancelScope(shield=True):
            task.cancel()
            await asyncio.gather(task, return_exceptions=True)


async def generate_comparison(data: ComparisonRequest, personas: dict[str, Persona], request: Request) -> AsyncIterator[str]:
    """Průběžně předává text odpovědi; podporované přemýšlení vypíná pro rychlé porovnání."""
    for model in data.models:
        for persona_id in data.persona_ids:
            yield encode_event(persona_id, model, "waiting")

    client = ollama.AsyncClient(timeout=httpx.Timeout(300, connect=10))
    disconnected = asyncio.create_task(wait_for_disconnect(request))
    stream = None
    try:
        # Stejný model obslouží všechny persony před přechodem na další model.
        for model in data.models:
            for persona_id in data.persona_ids:
                yield encode_event(persona_id, model, "generating")
                text = ""
                had_thinking = False
                completed_response = False
                done_reason = None
                try:
                    # Podklady se hledají před generováním; i tuto fázi lze přeskočit nebo zastavit.
                    retrieval = await await_connected(retrieve(persona_id, data.question), disconnected)
                    if retrieval is None:
                        return
                    yield encode_event(persona_id, model, "generating", context=retrieval.metadata())
                    info = await await_connected(client.show(model), disconnected)
                    if info is None:
                        return
                    stream = await await_connected(client.chat(
                        model=model,
                        messages=build_messages(personas[persona_id].system_prompt, data.question, retrieval),
                        think=False if "thinking" in (info.capabilities or []) else None,
                        stream=True,
                    ), disconnected)
                    if stream is None:
                        return
                    while True:
                        try:
                            part = await await_connected(anext(stream), disconnected)
                        except StopAsyncIteration:
                            break
                        if part is None:
                            return
                        had_thinking = had_thinking or bool(part.message.thinking)
                        if part.message.content:
                            text += part.message.content
                            yield encode_event(persona_id, model, "generating", text=text)
                        if part.done:
                            completed_response = True
                            done_reason = part.done_reason
                    if not completed_response:
                        yield encode_event(persona_id, model, "error", error="Spojení s Ollamou skončilo před dokončením odpovědi.")
                    elif done_reason == "length":
                        yield encode_event(persona_id, model, "error", error="Model dosáhl limitu délky před dokončením odpovědi.")
                    elif text.strip():
                        yield encode_event(persona_id, model, "done", text=text)
                    elif had_thinking:
                        yield encode_event(persona_id, model, "error", error="Model vygeneroval pouze interní přemýšlení bez výsledné odpovědi.")
                    else:
                        yield encode_event(persona_id, model, "error", error="Model vrátil prázdnou odpověď.")
                except RagError as error:
                    yield encode_event(persona_id, model, "error", error=f"Podklady nelze připravit: {error}")
                except (ConnectionError, httpx.ConnectError):
                    yield encode_event(persona_id, model, "error", error="Ollama není dostupná.")
                except httpx.TimeoutException:
                    yield encode_event(persona_id, model, "error", error="Model neodpověděl v časovém limitu.")
                except ollama.ResponseError as error:
                    yield encode_event(persona_id, model, "error", error=f"Ollama: {error.error}")
                except Exception:
                    logger.exception("Generování selhalo pro personu %s a model %s.", persona_id, model)
                    yield encode_event(persona_id, model, "error", error="Odpověď se nepodařilo vygenerovat.")
                finally:
                    if isinstance(stream, AsyncGenerator):
                        with CancelScope(shield=True):
                            await stream.aclose()
                        stream = None
    finally:
        # Uzavření spojení musí doběhnout i při zrušení celé streamovací odpovědi.
        with CancelScope(shield=True):
            disconnected.cancel()
            await asyncio.gather(disconnected, return_exceptions=True)
            await client.close()


@router.post("/compare")
async def compare(data: ComparisonRequest, request: Request) -> StreamingResponse:
    """Ověří persony a vrací průběžné stavy i odpovědi proudem NDJSON."""
    try:
        personas = {persona.id: persona for persona in load_personas()}
    except OSError as error:
        raise HTTPException(500, "Konfigurace person se nepodařilo načíst.") from error
    if any(persona_id not in personas for persona_id in data.persona_ids):
        raise HTTPException(422, "Některá vybraná persona už není dostupná. Obnovte seznam person.")
    return StreamingResponse(
        generate_comparison(data, personas, request),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
