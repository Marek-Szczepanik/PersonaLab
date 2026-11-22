"""Načtený index podkladů."""

from dataclasses import dataclass
from typing import Any

from langchain_core.vectorstores import InMemoryVectorStore


@dataclass
class RagIndex:
    """Načtený index včetně údajů o zaindexovaných souborech."""

    embedding_model: str
    sources: dict[str, dict[str, dict[str, Any]]]
    store: InMemoryVectorStore
