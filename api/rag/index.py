"""Konfigurace RAG, načítání podkladů person a uložení či načtení lokálního indexu."""

import hashlib
import json
import os
from pathlib import Path
from typing import Any

from langchain_core.vectorstores import InMemoryVectorStore
from langchain_ollama import OllamaEmbeddings

from api.rag.rag_error import RagError
from api.rag.rag_index import RagIndex

PROJECT_DIR = Path(__file__).resolve().parents[2]
DOCUMENTS_DIR = PROJECT_DIR / "documents"
INDEX_PATH = PROJECT_DIR / "rag_index" / "index.json"
INDEX_FORMAT = 1
DEFAULT_EMBED_MODEL = "bge-m3"
CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def embed_model_name() -> str:
    """Vrátí embedding model pro novou indexaci; lze ho změnit proměnnou PERSONALAB_EMBED_MODEL."""
    return os.environ.get("PERSONALAB_EMBED_MODEL", "").strip() or DEFAULT_EMBED_MODEL


def create_embeddings(model: str) -> OllamaEmbeddings:
    """Vytvoří klienta embeddings v Ollamě pro zadaný model."""
    return OllamaEmbeddings(model=model)


def persona_source_files(persona_id: str) -> list[Path]:
    """Vrátí soubory .txt přímo ve složce persony; symlinky a cesty mimo documents/ přeskočí."""
    folder = DOCUMENTS_DIR / persona_id
    if folder.is_symlink() or not folder.is_dir() or folder.resolve().parent != DOCUMENTS_DIR.resolve():
        return []
    return sorted(
        (path for path in folder.iterdir() if path.suffix.lower() == ".txt" and not path.is_symlink() and path.is_file()),
        key=lambda path: path.name.casefold(),
    )


def read_source(path: Path) -> tuple[str, str]:
    """Načte text v UTF-8 (případně s BOM) a vrátí ho spolu s otiskem SHA-256 obsahu."""
    data = path.read_bytes()
    return data.decode("utf-8-sig"), hashlib.sha256(data).hexdigest()


def save_index(embedding_model: str, sources: dict[str, dict[str, dict[str, Any]]], store: InMemoryVectorStore) -> None:
    """Uloží index do jednoho souboru atomickou výměnou, takže nikdy nevznikne napůl zapsaný stav."""
    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = INDEX_PATH.with_name(f"{INDEX_PATH.name}.{os.getpid()}.tmp")
    data = {
        "format": INDEX_FORMAT,
        "embedding_model": embedding_model,
        "chunk_size": CHUNK_SIZE,
        "chunk_overlap": CHUNK_OVERLAP,
        "sources": sources,
        "store": store.store,
    }
    try:
        with temporary.open("w", encoding="utf-8") as output:
            json.dump(data, output, ensure_ascii=False)
        os.replace(temporary, INDEX_PATH)
    finally:
        temporary.unlink(missing_ok=True)


def load_index() -> RagIndex | None:
    """Načte uložený index; None znamená, že indexace ještě neproběhla."""
    try:
        with INDEX_PATH.open(encoding="utf-8") as source:
            data = json.load(source)
    except FileNotFoundError:
        return None
    except (OSError, ValueError) as error:
        raise RagError("Index podkladů nelze načíst. Spusťte indexaci znovu.") from error
    try:
        if data["format"] != INDEX_FORMAT:
            raise ValueError("Nepodporovaný formát indexu.")
        entries = data["store"]
        for chunk_id, entry in entries.items():
            # Úložiště obsahuje jen prostá data, proto stačí ověřit jejich tvar.
            if entry["id"] != chunk_id or not isinstance(entry["text"], str) or not isinstance(entry["vector"], list) \
                    or not isinstance(entry["metadata"]["persona_id"], str) or not isinstance(entry["metadata"]["source"], str):
                raise ValueError("Neplatný úryvek v indexu.")
        store = InMemoryVectorStore(embedding=create_embeddings(data["embedding_model"]))
        store.store = entries
        return RagIndex(data["embedding_model"], data["sources"], store)
    except (KeyError, TypeError, ValueError, AttributeError) as error:
        raise RagError("Index podkladů je poškozený nebo zastaralého formátu. Spusťte indexaci znovu.") from error
