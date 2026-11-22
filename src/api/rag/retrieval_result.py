"""Podklady vybrané pro jednu personu a otázku."""

from dataclasses import dataclass, field

from langchain_core.documents import Document


@dataclass
class RetrievalResult:
    """Úryvky předané modelu; prázdný seznam znamená personu bez podkladů."""

    chunks: list[Document] = field(default_factory=list)
    warning: str | None = None

    @property
    def sources(self) -> list[str]:
        """Názvy souborů v pořadí relevance, každý jen jednou."""
        return list(dict.fromkeys(chunk.metadata["source"] for chunk in self.chunks))

    def metadata(self) -> dict[str, object]:
        """Údaje pro frontend; pocházejí z vyhledávání, nikoli z textu modelu."""
        context: dict[str, object] = {"mode": "documents" if self.chunks else "none", "sources": self.sources}
        if self.warning:
            context["warning"] = self.warning
        return context
