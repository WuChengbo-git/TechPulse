from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, JSON
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class SourceType(enum.Enum):
    GITHUB = "github"
    ARXIV = "arxiv"
    HUGGINGFACE = "huggingface"


class TrialStatus(enum.Enum):
    NOT_TRIED = "not_tried"
    TRIED = "tried"
    FAILED = "failed"
    SUCCESS = "success"


class TechCard(Base):
    __tablename__ = "tech_cards"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    source = Column(Enum(SourceType), nullable=False, index=True)
    original_url = Column(String(1000), nullable=False)
    summary = Column(Text)
    chinese_tags = Column(JSON)
    trial_suggestion = Column(Text)
    status = Column(Enum(TrialStatus), default=TrialStatus.NOT_TRIED, index=True)
    trial_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    notion_page_id = Column(String(100))
    
    raw_data = Column(JSON)