"""Vyhledání podkladů persony v lokálním indexu před generováním odpovědi."""

import asyncio
from collections import OrderedDict

import httpx
import ollama
from langchain_core.documents import Document

from api.rag.index import INDEX_PATH, TOP_K, load_index, persona_source_files, read_source
from api.rag.rag_error import RagError
from api.rag.rag_index import RagIndex
from api.rag.retrieval.retrieval_result import RetrievalResult

REINDEX_HINT = "Spusťte indexaci příkazem python -m api.rag."
CACHE_SIZE = 64

# Načtený index s verzí podle času změny souboru; nová indexace se projeví bez restartu.
_index: tuple[int, RagIndex] | None = None
# Výsledky vyhledávání, aby všechny modely v řádku dostaly stejné podklady bez opakovaných embeddings.
_results: OrderedDict[tuple[int, str, str], list[Document]] = OrderedDict()


async def current_index() -> tuple[int, RagIndex] | None:
    """Vrátí index z paměti; z disku ho načte jen poprvé nebo po nové indexaci."""
    global _index
    try:
        version = INDEX_PATH.stat().st_mtime_ns
    except FileNotFoundError:
        return None
    if _index is None or _index[0] != version:
        index = await asyncio.to_thread(load_index)
        if index is None:
            return None
        _index = (version, index)
    return _index


def sources_changed(persona_id: str, indexed: dict[str, dict]) -> bool:
    """Porovná aktuální soubory persony s otisky uloženými při indexaci."""
    current = {}
    for path in persona_source_files(persona_id):
        try:
            current[path.name] = read_source(path)[1]
        except (OSError, UnicodeDecodeError):
            return True
    return current != {name: info["sha256"] for name, info in indexed.items()}


async def search(index: RagIndex, persona_id: str, question: str) -> list[Document]:
    """Vytvoří embedding otázky a vyhledá nejpodobnější úryvky výhradně dané persony."""
    try:
        vector = await index.store.embedding.aembed_query(question)
    except (ConnectionError, httpx.ConnectError) as error:
        raise RagError("Ollama není dostupná, podklady nelze vyhledat.") from error
    except httpx.TimeoutException as error:
        raise RagError("Embedding model neodpověděl v časovém limitu.") from error
    except ollama.ResponseError as error:
        if error.status_code == 404:
            raise RagError(f"Embedding model {index.embedding_model} není v Ollamě. "
                           f"Stáhněte ho příkazem ollama pull {index.embedding_model}.") from error
        raise RagError(f"Embedding model {index.embedding_model} selhal: {error.error}") from error
    chunks = index.store.similarity_search_by_vector(
        vector, k=TOP_K, filter=lambda document: document.metadata.get("persona_id") == persona_id,
    )
    # Pojistka proti chybě ve filtru: cizí podklady se modelu nikdy nepředají.
    if any(chunk.metadata.get("persona_id") != persona_id for chunk in chunks):
        raise RagError("Vyhledávání vrátilo podklady jiné persony.")
    return chunks


async def retrieve(persona_id: str, question: str) -> RetrievalResult:
    """Vrátí podklady persony; chybějící dokumenty nejsou chyba, nepřipravený index ano."""
    if not persona_source_files(persona_id):
        return RetrievalResult()
    loaded = await current_index()
    if loaded is None:
        raise RagError(f"Persona má podklady, ale index ještě neexistuje. {REINDEX_HINT}")
    version, index = loaded
    indexed = index.sources.get(persona_id)
    if not indexed:
        raise RagError(f"Podklady persony nejsou zaindexované. {REINDEX_HINT}")
    warning = f"Podklady se od poslední indexace změnily. {REINDEX_HINT}" if sources_changed(persona_id, indexed) else None
    if sum(info["chunks"] for info in indexed.values()) == 0:
        return RetrievalResult(warning=warning)

    key = (version, persona_id, question)
    chunks = _results.get(key)
    if chunks is None:
        chunks = await search(index, persona_id, question)
        _results[key] = chunks
        while len(_results) > CACHE_SIZE:
            _results.popitem(last=False)
    else:
        _results.move_to_end(key)
    return RetrievalResult(chunks, warning)
