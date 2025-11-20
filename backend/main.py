import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_db_and_tables
from config import settings

# Configure logging
level = logging.getLevelNamesMapping().get(settings.LOG_LEVEL, logging.INFO)
logging.basicConfig(level=level)

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import sessions, game
app.include_router(sessions.router)
app.include_router(game.router)

@app.get("/")
def read_root():
    return {"message": "TavernWorker API is running"}
