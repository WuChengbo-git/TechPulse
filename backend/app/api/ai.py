from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..models.card import TechCard
from ..services.ai.summarizer import AISummarizer
from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class GenerateSummaryRequest(BaseModel):
    title: str
    description: str
    source_type: Optional[str] = "github"


class GenerateSummaryResponse(BaseModel):
    summary: str
    tags: list[str]
    trial_suggestion: str


@router.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest):
    """
    生成AI摘要、标签和试用建议
    """
    summarizer = AISummarizer()
    
    try:
        summary = await summarizer.generate_summary(
            request.title, 
            request.description, 
            request.source_type
        )
        
        tags = await summarizer.extract_tags(
            request.title, 
            request.description, 
            request.source_type
        )
        
        trial_suggestion = await summarizer.generate_trial_suggestion(
            request.title, 
            request.description, 
            tags
        )
        
        return GenerateSummaryResponse(
            summary=summary or "无法生成摘要",
            tags=tags,
            trial_suggestion=trial_suggestion or "无法生成试用建议"
        )
        
    except Exception as e:
        logger.error(f"Error in generate_summary: {e}")
        raise HTTPException(status_code=500, detail="生成摘要时发生错误")


@router.post("/enhance-card/{card_id}")
async def enhance_card_with_ai(
    card_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    使用AI增强指定卡片的内容
    """
    card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    background_tasks.add_task(enhance_card_task, card_id)
    
    return {"message": "AI enhancement started in background"}


@router.post("/enhance-all")
async def enhance_all_cards(
    background_tasks: BackgroundTasks,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    使用AI增强所有未处理的卡片
    """
    cards = db.query(TechCard).filter(
        TechCard.summary.is_(None) | (TechCard.summary == "")
    ).limit(limit).all()
    
    for card in cards:
        background_tasks.add_task(enhance_card_task, card.id)
    
    return {
        "message": f"AI enhancement started for {len(cards)} cards",
        "card_count": len(cards)
    }


async def enhance_card_task(card_id: int):
    """
    后台任务：增强单个卡片
    """
    try:
        from ..core.database import SessionLocal
        
        db = SessionLocal()
        card = db.query(TechCard).filter(TechCard.id == card_id).first()
        
        if not card:
            logger.error(f"Card {card_id} not found")
            return
        
        summarizer = AISummarizer()
        
        description = ""
        if card.raw_data:
            if card.source.value == "github":
                description = card.raw_data.get("description", "")
            elif card.source.value == "arxiv":
                description = card.raw_data.get("summary", "")
            elif card.source.value == "huggingface":
                description = f"Downloads: {card.raw_data.get('downloads', 0)}"
        
        if not card.summary:
            summary = await summarizer.generate_summary(
                card.title,
                description,
                card.source.value
            )
            if summary:
                card.summary = summary
        
        if not card.chinese_tags:
            tags = await summarizer.extract_tags(
                card.title,
                description,
                card.source.value
            )
            if tags:
                card.chinese_tags = tags
        
        if not card.trial_suggestion:
            trial_suggestion = await summarizer.generate_trial_suggestion(
                card.title,
                description,
                card.chinese_tags or []
            )
            if trial_suggestion:
                card.trial_suggestion = trial_suggestion
        
        db.commit()
        db.close()
        
        logger.info(f"Enhanced card {card_id}")
        
    except Exception as e:
        logger.error(f"Error enhancing card {card_id}: {e}")