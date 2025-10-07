from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from ..core.database import Base


class UserFavorite(Base):
    """用户收藏模型"""
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, nullable=False)
    item_type = Column(String(20), nullable=False)  # github/arxiv/huggingface/zenn
    favorite_type = Column(String(20), default='like')  # like/bookmark/archive
    tags = Column(Text)  # JSON array of user-defined tags
    notes = Column(Text)  # User notes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'item_id', 'item_type', name='uq_user_item'),
        Index('idx_user_favorites_user', 'user_id'),
        Index('idx_user_favorites_item', 'item_id', 'item_type'),
        Index('idx_user_favorites_created', 'created_at'),
    )

    def __repr__(self):
        return f"<UserFavorite user_id={self.user_id} item={self.item_type}:{self.item_id}>"
