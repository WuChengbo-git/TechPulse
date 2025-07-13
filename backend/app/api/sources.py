from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..services.data_collector import DataCollector
from ..models.config import DataSource
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sources", tags=["sources"])


@router.post("/collect")
async def trigger_data_collection(background_tasks: BackgroundTasks):
    """
    触发数据收集任务
    """
    collector = DataCollector()
    
    background_tasks.add_task(collector.collect_all_sources)
    
    return {"message": "Data collection started in background"}


@router.get("/collect/sync")
async def sync_data_collection():
    """
    同步数据收集（用于测试）
    """
    collector = DataCollector()
    results = await collector.collect_all_sources()
    
    return {
        "message": "Data collection completed",
        "results": results
    }


@router.get("/")
async def get_data_sources(db: Session = Depends(get_db)):
    """
    获取所有数据源状态
    """
    sources = db.query(DataSource).all()
    return sources


@router.put("/{source_id}/toggle")
async def toggle_data_source(source_id: int, db: Session = Depends(get_db)):
    """
    切换数据源开关状态
    """
    source = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not source:
        return {"error": "Data source not found"}
    
    source.is_enabled = not source.is_enabled
    db.commit()
    
    return {"message": f"Data source {source.name} {'enabled' if source.is_enabled else 'disabled'}"}