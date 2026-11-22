"""Úplná konfigurace persony načtená ze souboru."""

import re

from pydantic import Field, field_validator

from api.schemas.persona_create import PersonaCreate


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
