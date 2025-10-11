"""
用户行为数据模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class ActionType(enum.Enum):
    """用户行为类型"""
    CLICK = "click"          # 点击卡片
    FAVORITE = "favorite"    # 收藏
    UNFAVORITE = "unfavorite"  # 取消收藏
    SEARCH = "search"        # 搜索
    VIEW = "view"            # 浏览（停留超过3秒）
    SHARE = "share"          # 分享


class UserBehavior(Base):
    """用户行为记录表"""
    __tablename__ = "user_behaviors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # 用户ID
    action = Column(Enum(ActionType), nullable=False, index=True)  # 行为类型
    card_id = Column(Integer, nullable=True, index=True)  # 卡片ID（搜索时可为空）
    query = Column(Text, nullable=True)  # 搜索关键词
    duration = Column(Integer, nullable=True)  # 浏览时长（秒）
    search_mode = Column(String(20), nullable=True)  # 搜索模式：keyword, ai
    extra_data = Column(Text, nullable=True)  # 额外信息（JSON格式）
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class SearchHistory(Base):
    """搜索历史表"""
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    query = Column(Text, nullable=False)
    mode = Column(String(20), default="keyword")  # keyword, ai
    results_count = Column(Integer, default=0)  # 搜索结果数量
    intent = Column(String(20), nullable=True)  # 意图识别结果：query, analyze
    clicked_results = Column(Text, nullable=True)  # 点击的结果ID（JSON数组）
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class UserRecommendation(Base):
    """推荐记录表（用于去重和分析）"""
    __tablename__ = "user_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    card_id = Column(Integer, nullable=False, index=True)
    score = Column(Integer, default=0)  # 推荐分数（0-100）
    reason = Column(Text, nullable=True)  # 推荐理由
    matched_tags = Column(Text, nullable=True)  # 匹配的标签（JSON数组）
    is_clicked = Column(Integer, default=0)  # 是否点击（0-否，1-是）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    clicked_at = Column(DateTime(timezone=True), nullable=True)  # 点击时间
