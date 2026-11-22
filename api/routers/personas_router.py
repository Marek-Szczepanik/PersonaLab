"""Endpointy pro načtení a vytvoření person."""

import logging

from fastapi import APIRouter, HTTPException

from api.repositories.persona_repository import load_personas, save_persona
from api.schemas.persona import Persona
from api.schemas.persona_create import PersonaCreate

router = APIRouter(prefix="/api/personas", tags=["personas"])
logger = logging.getLogger(__name__)


@router.get("", response_model=list[Persona])
def list_personas() -> list[Persona]:
    """Při každém požadavku vrátí aktuální validní konfigurace person."""
    try:
        return load_personas()
    except OSError as error:
        raise HTTPException(500, "Konfigurace person se nepodařilo načíst.") from error


@router.post("", response_model=Persona, status_code=201)
def create_persona(data: PersonaCreate) -> Persona:
    """Uloží novou personu a chyby úložiště převede na srozumitelné HTTP odpovědi."""
    try:
        return save_persona(data)
    except FileExistsError as error:
        raise HTTPException(409, "Osobnost s tímto ID už existuje. Zvolte jiný název.") from error
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    except OSError as error:
        logger.exception("Personu se nepodařilo uložit.")
        raise HTTPException(500, "Personu se nepodařilo uložit. Zkontrolujte oprávnění složky personas.") from error
