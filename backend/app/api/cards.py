from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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