"""Vstupní bod backendu: vytvoří aplikaci a zaregistruje routery."""

from fastapi import FastAPI

from api.routers.comparison_router import router as comparison_router
from api.routers.health_router import router as health_router
from api.routers.models_router import router as models_router
from api.routers.personas_router import router as personas_router

app = FastAPI(title="PersonaLab API")
app.include_router(health_router)
app.include_router(models_router)
app.include_router(personas_router)
app.include_router(comparison_router)
