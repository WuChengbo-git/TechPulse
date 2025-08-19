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


@router.get("/github/daily-trending")
async def get_daily_trending_preview():
    """
    预览每日trending GitHub项目（不保存到数据库）
    """
    try:
        from ..services.scrapers import GitHubScraper
        
        scraper = GitHubScraper()
        
        # 获取Python项目的每日trending
        python_trending = await scraper.get_daily_trending_repos(language="python", limit=15)
        # 获取所有语言的trending
        general_trending = await scraper.get_daily_trending_repos(limit=10)
        
        return {
            "message": "Daily trending repos fetched successfully",
            "python_trending": python_trending,
            "general_trending": general_trending,
            "total_count": len(python_trending) + len(general_trending)
        }
    except Exception as e:
        logger.error(f"Error fetching daily trending: {e}")
        return {"error": str(e)}


@router.post("/collect/github")
async def collect_github_only(background_tasks: BackgroundTasks):
    """
    只收集GitHub数据
    """
    collector = DataCollector()
    background_tasks.add_task(single_source_collection_task, collector.collect_github_data)
    return {"message": "GitHub data collection started", "source": "github"}


@router.post("/collect/arxiv")
async def collect_arxiv_only(background_tasks: BackgroundTasks):
    """
    只收集arXiv数据
    """
    collector = DataCollector()
    background_tasks.add_task(single_source_collection_task, collector.collect_arxiv_data)
    return {"message": "arXiv data collection started", "source": "arxiv"}


@router.post("/collect/huggingface")
async def collect_huggingface_only(background_tasks: BackgroundTasks):
    """
    只收集HuggingFace数据
    """
    collector = DataCollector()
    background_tasks.add_task(single_source_collection_task, collector.collect_huggingface_data)
    return {"message": "HuggingFace data collection started", "source": "huggingface"}


@router.post("/collect/zenn")
async def collect_zenn_only(background_tasks: BackgroundTasks):
    """
    只收集Zenn数据
    """
    collector = DataCollector()
    background_tasks.add_task(single_source_collection_task, collector.collect_zenn_data)
    return {"message": "Zenn data collection started", "source": "zenn"}


async def single_source_collection_task(collection_func):
    """
    单个数据源收集任务
    """
    try:
        count = await collection_func()
        logger.info(f"Single source collection completed: {count} items")
        return {"count": count}
    except Exception as e:
        logger.error(f"Error in single source collection: {e}")
        return {"error": str(e)}


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