from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.card import TechCard
from ..services.notion import NotionService
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/notion", tags=["notion"])


class NotionTestResponse(BaseModel):
    connected: bool
    error: Optional[str] = None
    database_title: Optional[str] = None
    database_id: Optional[str] = None
    user: Optional[str] = None


class NotionSyncResponse(BaseModel):
    message: str
    results: Optional[dict] = None


@router.get("/test", response_model=NotionTestResponse)
async def test_notion_connection():
    """
    测试Notion连接
    """
    notion_service = NotionService()
    result = await notion_service.test_connection()
    
    return NotionTestResponse(**result)


@router.post("/sync-card/{card_id}")
async def sync_card_to_notion(
    card_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    同步指定卡片到Notion
    """
    card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    background_tasks.add_task(sync_single_card_task, card_id)
    
    return {"message": f"Card {card_id} sync to Notion started in background"}


@router.post("/sync-all", response_model=NotionSyncResponse)
async def sync_all_cards_to_notion(
    background_tasks: BackgroundTasks,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    同步所有卡片到Notion
    """
    cards_count = db.query(TechCard).count()
    
    if cards_count == 0:
        return NotionSyncResponse(
            message="No cards found to sync",
            results={"total": 0, "success": 0, "failed": 0}
        )
    
    background_tasks.add_task(sync_all_cards_task, limit)
    
    return NotionSyncResponse(
        message=f"Syncing {min(cards_count, limit)} cards to Notion in background"
    )


@router.post("/sync-all/immediate", response_model=NotionSyncResponse)
async def sync_all_cards_immediate(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    立即同步卡片到Notion（用于测试，限制数量）
    """
    notion_service = NotionService()
    results = await notion_service.sync_all_cards(db, limit)
    
    if "error" in results:
        raise HTTPException(status_code=500, detail=results["error"])
    
    return NotionSyncResponse(
        message="Sync completed",
        results=results
    )


async def sync_single_card_task(card_id: int):
    """
    后台任务：同步单个卡片
    """
    try:
        from ..core.database import SessionLocal
        
        db = SessionLocal()
        card = db.query(TechCard).filter(TechCard.id == card_id).first()
        
        if not card:
            logger.error(f"Card {card_id} not found")
            return
        
        notion_service = NotionService()
        success = await notion_service.sync_card_to_notion(card, db)
        
        if success:
            logger.info(f"Successfully synced card {card_id} to Notion")
        else:
            logger.error(f"Failed to sync card {card_id} to Notion")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error in sync_single_card_task for card {card_id}: {e}")


async def sync_all_cards_task(limit: int):
    """
    后台任务：同步所有卡片
    """
    try:
        from ..core.database import SessionLocal
        
        db = SessionLocal()
        notion_service = NotionService()
        
        results = await notion_service.sync_all_cards(db, limit)
        
        logger.info(f"Notion sync completed: {results}")
        
        db.close()
        
    except Exception as e:
        logger.error(f"Error in sync_all_cards_task: {e}")


@router.get("/status")
async def get_notion_status(db: Session = Depends(get_db)):
    """
    获取Notion同步状态
    """
    notion_service = NotionService()
    connection_test = await notion_service.test_connection()
    
    synced_cards = db.query(TechCard).filter(
        TechCard.notion_page_id.isnot(None)
    ).count()
    
    total_cards = db.query(TechCard).count()
    
    return {
        "connection": connection_test,
        "synced_cards": synced_cards,
        "total_cards": total_cards,
        "sync_percentage": round((synced_cards / total_cards * 100) if total_cards > 0 else 0, 2)
    }