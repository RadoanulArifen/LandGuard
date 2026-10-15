"""LandGuard API entry point:  uvicorn app.main:app --reload"""
import logging
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.routes import router
from app.config import CORS_ORIGINS
from app.database.db import Base, engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("landguard")

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Load the ML model + SHAP explainer in the background so the first investigation is fast."""
    def _warm():
        try:
            from app.services.explain import _load
            _load()
            log.info("Explainer ready")
        except Exception as e:      # the API still works without it
            log.warning("Explainer not ready: %s", e)
    threading.Thread(target=_warm, daemon=True).start()
    yield


app = FastAPI(lifespan=lifespan, title="ভূমি প্রহরী API", version="1.0.0",
              description="Explainable land transaction integrity engine. Decision-support only - never a legal finding.")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])
Base.metadata.create_all(engine)
app.include_router(router)


