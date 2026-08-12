import os
import logging
from pathlib import Path
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.db import client
from app.api.upload_routes import router as upload_router
from app.api.search_routes import router as search_router
from app.api.chat_routes import router as chat_router

# Load env variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI(title="PDF Research Assistant API")

# Include modular API routers under the /api prefix
app.include_router(upload_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.get("/api")
async def root():
    return {"message": "PDF Research Assistant API", "status": "ok"}


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
