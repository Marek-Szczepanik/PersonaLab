"""Sestavení indexu podkladů person; spouští se z kořene projektu příkazem python -m api.rag."""

import sys

import httpx
import ollama
from langchain_core.documents import Document
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

from api.rag.index import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DOCUMENTS_DIR,
    INDEX_PATH,
    PROJECT_DIR,
    create_embeddings,
    embed_model_name,
    persona_source_files,
    read_source,
    save_index,
)
from api.rag.rag_error import RagError
from api.repositories.persona_repository import load_personas

BATCH_SIZE = 32


def collect_chunks() -> tuple[list[str], dict[str, dict[str, dict]], list[Document]]:
    """Načte dokumenty existujících person a rozdělí je na úryvky s identifikačními metadaty."""
    splitter = RecursiveCharacterTextSplitter(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
    try:
        persona_ids = [persona.id for persona in load_personas()]
    except OSError as error:
        raise RagError("Konfigurace person se nepodařilo načíst.") from error

    if DOCUMENTS_DIR.is_dir():
        for folder in sorted(DOCUMENTS_DIR.iterdir()):
            if folder.is_dir() and folder.name not in persona_ids:
                print(f"Varování: složka data/documents/{folder.name} neodpovídá žádné personě, přeskakuji ji.")

    sources: dict[str, dict[str, dict]] = {}
    chunks: list[Document] = []
    for persona_id in persona_ids:
        for path in persona_source_files(persona_id):
            label = f"data/documents/{persona_id}/{path.name}"
            try:
                text, digest = read_source(path)
            except UnicodeDecodeError as error:
                raise RagError(f"Soubor {label} není v kódování UTF-8. Uložte ho jako UTF-8 a indexaci zopakujte.") from error
            except OSError as error:
                raise RagError(f"Soubor {label} nelze přečíst.") from error
            parts = splitter.split_text(text)
            sources.setdefault(persona_id, {})[path.name] = {"sha256": digest, "chunks": len(parts)}
            for number, part in enumerate(parts):
                chunk_id = f"{persona_id}/{path.name}#{number}"
                chunks.append(Document(
                    id=chunk_id,
                    page_content=part,
                    metadata={"persona_id": persona_id, "source": path.name, "chunk_id": chunk_id},
                ))
    return persona_ids, sources, chunks


def main() -> int:
    """Vždy sestaví celý index znovu, takže změny i odstranění dokumentů se projeví bez duplicit."""
    model = embed_model_name()
    try:
        persona_ids, sources, chunks = collect_chunks()
        print(f"Vytvářím embeddings modelem {model} pro {len(chunks)} úryvků…", flush=True)
        store = InMemoryVectorStore(embedding=create_embeddings(model))
        for start in range(0, len(chunks), BATCH_SIZE):
            batch = chunks[start:start + BATCH_SIZE]
            store.add_documents(batch, ids=[chunk.id for chunk in batch])
        save_index(model, sources, store)
    except RagError as error:
        print(f"Chyba: {error}", file=sys.stderr)
        return 1
    except (ConnectionError, httpx.ConnectError):
        print("Chyba: Ollama není dostupná. Spusťte ji a indexaci zopakujte.", file=sys.stderr)
        return 1
    except ollama.ResponseError as error:
        if error.status_code == 404:
            print(f"Chyba: Embedding model {model} není v Ollamě. Stáhněte ho příkazem: ollama pull {model}", file=sys.stderr)
        else:
            print(f"Chyba Ollamy: {error.error}", file=sys.stderr)
        return 1
    except OSError:
        print(f"Chyba: Index se nepodařilo uložit do {INDEX_PATH.parent.relative_to(PROJECT_DIR).as_posix()}/. Zkontrolujte oprávnění složky.", file=sys.stderr)
        return 1

    print(f"Index uložen do {INDEX_PATH.relative_to(PROJECT_DIR).as_posix()}. Předchozí obsah indexu byl nahrazen.")
    for persona_id in persona_ids:
        files = sources.get(persona_id, {})
        if files:
            count = sum(info["chunks"] for info in files.values())
            print(f"  {persona_id}: souborů {len(files)}, úryvků {count}")
        else:
            print(f"  {persona_id}: bez podkladů")
    return 0


if __name__ == "__main__":
    sys.exit(main())
