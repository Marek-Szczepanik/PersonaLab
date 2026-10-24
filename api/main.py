import ollama
from fastapi import FastAPI, HTTPException
from httpx import ConnectError
from api.personas import router as personas_router

app = FastAPI(title="PersonaLab API")
app.include_router(personas_router)


@app.get("/api/health")
def health():
    """Ověří dostupnost API."""
    return {"status": "ok"}


@app.get("/api/models")
def get_models():
    """Vrátí seznam lokálně dostupných modelů Ollamy."""
    try:
        response = ollama.list()
        return {"models": [model.model for model in response.models]}
    except ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama není dostupná."
        )
