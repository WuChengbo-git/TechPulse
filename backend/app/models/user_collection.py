from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from ..core.database import Base


class UserCollection(Base):
    """用户收藏夹模型"""
    __tablename__ = "user_collections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    icon = Column(String(50))
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_user_collections_user', 'user_id'),
    )

    def __repr__(self):
        return f"<UserCollection id={self.id} name={self.name}>"


class CollectionItem(Base):
    """收藏夹项目关联模型"""
    __tablename__ = "collection_items"

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("user_collections.id", ondelete="CASCADE"), nullable=False)
    favorite_id = Column(Integer, ForeignKey("user_favorites.id", ondelete="CASCADE"), nullable=False)
    sort_order = Column(Integer, default=0)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint('collection_id', 'favorite_id', name='uq_collection_favorite'),
        Index('idx_collection_items_collection', 'collection_id'),
    )

    def __repr__(self):
        return f"<CollectionItem collection_id={self.collection_id} favorite_id={self.favorite_id}>"
