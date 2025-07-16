from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .api import cards, sources, ai, notion
from .api import settings as settings_api

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="TechPulse - 每日技术情报可视化仪表盘",
    version="0.1.0",
    debug=settings.debug
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(notion.router, prefix="/api/v1")
app.include_router(settings_api.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Welcome to TechPulse API", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}