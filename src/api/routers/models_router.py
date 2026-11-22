"""Seznam modelů dostupných v Ollamě."""

import asyncio

import ollama
from fastapi import APIRouter, HTTPException
from httpx import ConnectError

router = APIRouter(prefix="/api", tags=["models"])


def supports_chat(info: ollama.ShowResponse | BaseException) -> bool:
    """Ponechá modely, které umí generovat text; modely jen pro embeddings vynechá."""
    if isinstance(info, BaseException) or info.capabilities is None:
        # Bez údajů o schopnostech model raději nabídneme, případná chyba se zobrazí u odpovědi.
        return True
    return "completion" in info.capabilities


@router.get("/models")
async def get_models():
    """Vrátí lokálně dostupné modely Ollamy, které lze použít pro generování odpovědí."""
    client = ollama.AsyncClient()
    try:
        response = await client.list()
        names = [model.model for model in response.models if model.model]
        infos = await asyncio.gather(*(client.show(name) for name in names), return_exceptions=True)
    except (ConnectionError, ConnectError):
        raise HTTPException(
            status_code=503,
            detail="Ollama není dostupná."
        )
    finally:
        await client.close()
    return {"models": [name for name, info in zip(names, infos) if supports_chat(info)]}
