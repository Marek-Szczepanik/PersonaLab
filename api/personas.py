"""Načítání a bezpečné vytváření souborových konfigurací person."""

import json
import logging
import re
import unicodedata
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

PERSONAS_DIR = Path(__file__).resolve().parent.parent / "personas"
router = APIRouter(prefix="/api/personas", tags=["personas"])
logger = logging.getLogger(__name__)


class PersonaCreate(BaseModel):
    """Povinné údaje pro vytvoření nové osobnosti."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=500)
    system_prompt: str = Field(min_length=1, max_length=20000)


class Persona(PersonaCreate):
    """Úplná konfigurace s bezpečným identifikátorem souboru."""

    id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

    @field_validator("id")
    @classmethod
    def validate_id(cls, value: str) -> str:
        """Odmítne také vyhrazená jména zařízení systému Windows."""
        if value in {"con", "prn", "aux", "nul", "clock$"} or re.fullmatch(r"(?:com|lpt)[0-9]", value):
            raise ValueError("Tento identifikátor je vyhrazený systémem.")
        return value


def persona_id(name: str) -> str:
    """Odvodí přenositelný identifikátor bez diakritiky a částí cesty."""
    normalized = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    value = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")[:80].rstrip("-")
    if not value:
        raise HTTPException(422, "Název musí obsahovat alespoň jedno latinské písmeno nebo číslici.")
    return value


@router.get("", response_model=list[Persona])
def get_personas() -> list[Persona]:
    """Při každém požadavku načte validní konfigurace; vadné soubory přeskočí."""
    personas = []
    try:
        paths = sorted(PERSONAS_DIR.glob("*.json"))
        for path in paths:
            if path.is_symlink():
                continue
            try:
                persona = Persona.model_validate_json(path.read_text(encoding="utf-8"))
                if path.stem != persona.id:
                    raise ValueError("Identifikátor neodpovídá názvu souboru.")
                personas.append(persona)
            except (OSError, ValidationError, ValueError):
                logger.warning("Neplatná konfigurace persony: %s", path.name)
    except OSError as error:
        raise HTTPException(500, "Konfigurace person se nepodařilo načíst.") from error
    return sorted(personas, key=lambda persona: persona.name.casefold())


@router.post("", response_model=Persona, status_code=201)
def create_persona(data: PersonaCreate) -> Persona:
    """Vytvoří nový JSON výhradně v režimu bez přepsání existujícího souboru."""
    try:
        persona = Persona(id=persona_id(data.name), **data.model_dump())
    except ValidationError as error:
        raise HTTPException(422, "Z názvu nelze vytvořit bezpečné ID. Zvolte jiný název.") from error
    path = PERSONAS_DIR / f"{persona.id}.json"
    try:
        PERSONAS_DIR.mkdir(parents=True, exist_ok=True)
        with path.open("x", encoding="utf-8") as output:
            json.dump(persona.model_dump(), output, ensure_ascii=False, indent=2)
            output.write("\n")
    except FileExistsError as error:
        raise HTTPException(409, "Osobnost s tímto ID už existuje. Zvolte jiný název.") from error
    except OSError as error:
        logger.exception("Personu se nepodařilo uložit.")
        raise HTTPException(500, "Personu se nepodařilo uložit. Zkontrolujte oprávnění složky personas.") from error
    return persona
