from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import recommendations, predictions

app = FastAPI(title="Khatwa AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router, prefix="/api/ai", tags=["recommendations"])
app.include_router(predictions.router, prefix="/api/ai", tags=["predictions"])


@app.get("/api/ai/health")
def health():
    return {"status": "ok", "service": "khatwa-ai"}
