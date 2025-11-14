from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, JSON, Float
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class SourceType(enum.Enum):
    GITHUB = "github"
    ARXIV = "arxiv"
    HUGGINGFACE = "huggingface"
    ZENN = "zenn"


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
    summary = Column(Text)  # 中等详细度摘要（1段落，用于快速阅览）
    content = Column(Text)  # 完整内容（Markdown格式，用于深度阅读）
    chinese_tags = Column(JSON)  # 中文标签
    ai_category = Column(JSON)   # AI分类标签：LLM、CV、NLP、Agent等
    tech_stack = Column(JSON)    # 技术栈：Python、PyTorch、FastAPI等
    license = Column(String(100))  # 开源协议
    stars = Column(Integer, default=0)  # GitHub Stars
    forks = Column(Integer, default=0)  # GitHub Forks
    issues = Column(Integer, default=0)  # Issue活跃度
    quality_score = Column(Float, default=5.0, index=True)  # 质量评分 (0-10)
    trial_suggestion = Column(Text)
    status = Column(Enum(TrialStatus), default=TrialStatus.NOT_TRIED, index=True)
    trial_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    notion_page_id = Column(String(100))

    raw_data = Column(JSON)
    short_summary = Column(Text)  # 简短介绍（1-2句话，用于卡片列表）