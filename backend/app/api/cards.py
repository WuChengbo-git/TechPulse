from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..core.database import get_db
from ..models.card import TechCard, SourceType, TrialStatus
from ..models.schemas import TechCard as TechCardSchema, TechCardCreate, TechCardUpdate

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/", response_model=List[TechCardSchema])
def get_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    source: Optional[SourceType] = None,
    status: Optional[TrialStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(TechCard)
    
    if source:
        query = query.filter(TechCard.source == source)
    if status:
        query = query.filter(TechCard.status == status)
    if search:
        query = query.filter(TechCard.title.contains(search))
    
    cards = query.order_by(TechCard.created_at.desc()).offset(skip).limit(limit).all()
    return cards


@router.get("/stats")
def get_cards_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取卡片统计信息（用于数据源管理页面）
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 基础统计
    total_cards = db.query(TechCard).count()
    today_cards = db.query(TechCard).filter(TechCard.created_at >= today).count()
    
    # 按数据源统计
    sources_stats = {}
    for source in SourceType:
        total_count = db.query(TechCard).filter(TechCard.source == source).count()
        today_count = db.query(TechCard).filter(
            TechCard.source == source, 
            TechCard.created_at >= today
        ).count()
        
        # 获取最后更新时间
        last_updated = db.query(TechCard).filter(TechCard.source == source).order_by(
            desc(TechCard.created_at)
        ).first()
        
        sources_stats[source.value] = {
            "total": total_count,
            "today": today_count,
            "last_update": last_updated.created_at.isoformat() if last_updated else None
        }
    
    return {
        "total_cards": total_cards,
        "today_cards": today_cards,
        "sources_stats": sources_stats
    }


@router.get("/overview-stats")
def get_overview_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取概览页面统计信息
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 基础统计
    total_cards = db.query(TechCard).count()
    today_cards = db.query(TechCard).filter(TechCard.created_at >= today).count()
    
    # 按数据源统计
    sources_stats = {}
    for source in SourceType:
        count = db.query(TechCard).filter(TechCard.source == source).count()
        sources_stats[source.value] = count
    
    # 热门标签统计 (从chinese_tags字段提取)
    trending_tags = []
    try:
        # 获取所有包含标签的卡片
        cards_with_tags = db.query(TechCard).filter(
            TechCard.chinese_tags.isnot(None)
        ).all()
        
        # 统计标签频次
        tag_counts = {}
        for card in cards_with_tags:
            if card.chinese_tags:
                for tag in card.chinese_tags:
                    if isinstance(tag, str) and len(tag.strip()) > 0:
                        clean_tag = tag.strip()
                        tag_counts[clean_tag] = tag_counts.get(clean_tag, 0) + 1
        
        # 按频次排序，取前20个
        trending_tags = [
            {"tag": tag, "count": count} 
            for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        ]
    except Exception as e:
        print(f"Error processing tags: {e}")
        trending_tags = []
    
    return {
        "total_cards": total_cards,
        "today_cards": today_cards, 
        "sources_stats": sources_stats,
        "trending_tags": trending_tags
    }


@router.get("/{card_id}", response_model=TechCardSchema)
def get_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/", response_model=TechCardSchema)
def create_card(card: TechCardCreate, db: Session = Depends(get_db)):
    db_card = TechCard(**card.dict())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


@router.put("/{card_id}", response_model=TechCardSchema)
def update_card(card_id: int, card_update: TechCardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    for field, value in card_update.dict(exclude_unset=True).items():
        setattr(db_card, field, value)
    
    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(db_card)
    db.commit()
    return {"message": "Card deleted successfully"}