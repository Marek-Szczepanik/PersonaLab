"""Seznam modelů dostupných v Ollamě."""

import ollama
from fastapi import APIRouter, HTTPException
from httpx import ConnectError

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
def get_models():
    """Vrátí seznam lokálně dostupných modelů Ollamy."""
    try:
        response = ollama.list()
        return {"models": [model.model for model in response.models]}
    except (ConnectionError, ConnectError):
        raise HTTPException(
            status_code=503,
            detail="Ollama není dostupná."
        )
