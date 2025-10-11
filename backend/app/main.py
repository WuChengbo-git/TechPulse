from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import engine, Base
from .api import cards, sources, ai, notion, chat, auth, translate, user_settings, preferences, ai_config, health, behavior, search, recommend
from .api import settings as settings_api
from .services.scheduler import task_scheduler
import logging

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="TechPulse - 每日技术情报可视化仪表盘",
    version="0.1.4",
    debug=settings.debug
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")  # 认证路由
app.include_router(cards.router, prefix="/api/v1")
app.include_router(sources.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(ai_config.router, prefix="/api/v1")  # AI配置路由
app.include_router(notion.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(settings_api.router, prefix="/api/v1")
app.include_router(translate.router, prefix="/api/v1")  # 翻译路由
app.include_router(user_settings.router)  # 用户设置路由（已包含prefix）
app.include_router(preferences.router, prefix="/api/v1")  # 用户偏好路由
app.include_router(health.router, prefix="/api/v1")  # 健康检查路由
app.include_router(behavior.router, prefix="/api/v1")  # 用户行为路由
app.include_router(search.router, prefix="/api/v1")  # 智能搜索路由
app.include_router(recommend.router, prefix="/api/v1")  # 推荐系统路由


@app.on_event("startup")
async def startup_event():
    """
    应用启动事件
    """
    try:
        logger.info("Starting TechPulse application...")
        
        # 启动任务调度器
        task_scheduler.start_scheduler()
        
        logger.info("TechPulse application started successfully")
    except Exception as e:
        logger.error(f"Error during application startup: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """
    应用关闭事件
    """
    try:
        logger.info("Shutting down TechPulse application...")
        
        # 停止任务调度器
        task_scheduler.stop_scheduler()
        
        logger.info("TechPulse application shut down successfully")
    except Exception as e:
        logger.error(f"Error during application shutdown: {e}")


@app.get("/")
async def root():
    return {"message": "Welcome to TechPulse API", "version": "0.1.4"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/scheduler/status")
async def get_scheduler_status():
    """
    获取调度器状态
    """
    return task_scheduler.get_status()


@app.post("/api/v1/scheduler/trigger-collection")
async def trigger_manual_collection():
    """
    手动触发数据收集
    """
    try:
        import asyncio
        from .services.data_collector import DataCollector
        
        collector = DataCollector()
        results = await collector.collect_all_sources()
        
        return {
            "message": "Manual collection completed",
            "results": results
        }
    except Exception as e:
        logger.error(f"Error in manual collection: {e}")
        return {"message": "Collection failed", "error": str(e)}