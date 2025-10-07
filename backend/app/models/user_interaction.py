from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from ..core.database import Base


class UserInteraction(Base):
    """用户行为记录模型"""
    __tablename__ = "user_interactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, nullable=False)
    item_type = Column(String(20), nullable=False)
    action_type = Column(String(20), nullable=False)  # view/click/share/comment
    duration = Column(Integer)  # Duration in seconds
    metadata = Column(Text)  # Additional data as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_user_interactions_user', 'user_id'),
        Index('idx_user_interactions_action', 'action_type'),
        Index('idx_user_interactions_created', 'created_at'),
    )

    def __repr__(self):
        return f"<UserInteraction user_id={self.user_id} action={self.action_type}>"
