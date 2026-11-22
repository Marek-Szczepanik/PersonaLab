"""Načítání a bezpečné ukládání souborových konfigurací person bez závislosti na HTTP."""

import json
import logging
import re
import unicodedata
from pathlib import Path

from pydantic import ValidationError

from api.schemas.persona import Persona
from api.schemas.persona_create import PersonaCreate

PERSONAS_DIR = Path(__file__).resolve().parents[3] / "data" / "personas"
logger = logging.getLogger(__name__)


def persona_id(name: str) -> str:
    """Odvodí přenositelný identifikátor bez diakritiky a částí cesty."""
    normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")[:80].rstrip("-")
    if not value:
        raise ValueError("Název musí obsahovat alespoň jedno latinské písmeno nebo číslici.")
    return value


def load_personas() -> list[Persona]:
    """Načte validní konfigurace; vadné soubory přeskočí. Nečitelná složka vyhodí OSError."""
    personas = []
    for path in sorted(PERSONAS_DIR.glob("*.json")):
        if path.is_symlink():
            continue
        try:
            persona = Persona.model_validate_json(path.read_text(encoding="utf-8"))
            if path.stem != persona.id:
                raise ValueError("Identifikátor neodpovídá názvu souboru.")
            personas.append(persona)
        except (OSError, ValidationError, ValueError):
            logger.warning("Neplatná konfigurace persony: %s", path.name)
    return sorted(personas, key=lambda persona: persona.name.casefold())


def save_persona(data: PersonaCreate) -> Persona:
    """Vytvoří nový JSON bez přepsání existujícího souboru.

    Nepoužitelný název vyhodí ValueError, existující ID FileExistsError a chyba zápisu OSError.
    """
    try:
        persona = Persona(id=persona_id(data.name), **data.model_dump())
    except ValidationError as error:
        raise ValueError("Z názvu nelze vytvořit bezpečné ID. Zvolte jiný název.") from error
    PERSONAS_DIR.mkdir(parents=True, exist_ok=True)
    with (PERSONAS_DIR / f"{persona.id}.json").open("x", encoding="utf-8") as output:
        json.dump(persona.model_dump(), output, ensure_ascii=False, indent=2)
        output.write("\n")
    return persona
