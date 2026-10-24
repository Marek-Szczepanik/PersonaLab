from fastapi import FastAPI

app = FastAPI(title="PersonaLab API")


@app.get("/api/health")
def health():
    return {"status": "ok"}