from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.sql import func
from ..core.database import Base


class UserPreference(Base):
    """用户偏好标签模型"""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    preference_type = Column(String(50), nullable=False)  # tag/language/topic/category
    preference_value = Column(String(100), nullable=False)
    weight = Column(Float, default=1.0)  # Weight automatically adjusted based on behavior
    source = Column(String(20), default='implicit')  # explicit/implicit
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('user_id', 'preference_type', 'preference_value', name='uq_user_preference'),
        Index('idx_user_preferences_user', 'user_id'),
        Index('idx_user_preferences_type', 'preference_type'),
    )

    def __repr__(self):
        return f"<UserPreference user_id={self.user_id} {self.preference_type}={self.preference_value}>"
