from fastapi import FastAPI
import logging
import os

# Load .env early (non-fatal if missing)
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=False)
except Exception:
    pass

from server.routes.ws import router as ws_router
from server.routes.sse import router as sse_router
from server.routes.docs import router as docs_router
from server.routes.health import router as health_router
from server.routes.summarizer import router as summarizer_router
from server.routes.connections import router as connections_router

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 設定値は server/config.py の Settings から取得


app = FastAPI(title="ADK Video Analysis API", docs_url=None, redoc_url=None, openapi_url=None)
app.include_router(ws_router)
app.include_router(sse_router)
app.include_router(health_router)
app.include_router(docs_router)
app.include_router(summarizer_router)
app.include_router(connections_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
