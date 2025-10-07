from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from ..core.database import Base


class RecommendationHistory(Base):
    """推荐历史模型"""
    __tablename__ = "recommendation_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, nullable=False)
    item_type = Column(String(20), nullable=False)
    recommendation_score = Column(Float)
    recommendation_reason = Column(Text)  # JSON
    is_clicked = Column(Boolean, default=False)
    is_liked = Column(Boolean, default=False)
    shown_at = Column(DateTime(timezone=True), server_default=func.now())
    clicked_at = Column(DateTime(timezone=True))

    __table_args__ = (
        Index('idx_recommendation_user', 'user_id'),
        Index('idx_recommendation_shown', 'shown_at'),
    )

    def __repr__(self):
        return f"<RecommendationHistory user_id={self.user_id} item={self.item_type}:{self.item_id}>"
