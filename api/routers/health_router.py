"""Ověření dostupnosti backendu."""

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    """Ověří dostupnost API."""
    return {"status": "ok"}
