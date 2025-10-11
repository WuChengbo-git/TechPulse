"""
用户行为日志API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models.behavior import UserBehavior, SearchHistory, ActionType

router = APIRouter(tags=["behavior"])


# Pydantic模型
class BehaviorLog(BaseModel):
    user_id: int
    action: str  # click, favorite, search, view
    card_id: Optional[int] = None
    query: Optional[str] = None
    duration: Optional[int] = None  # 浏览时长（秒）
    search_mode: Optional[str] = None  # keyword, ai
    metadata: Optional[str] = None


class SearchHistoryCreate(BaseModel):
    user_id: int
    query: str
    mode: str = "keyword"
    results_count: int = 0
    intent: Optional[str] = None


class BehaviorStats(BaseModel):
    user_id: int
    total_clicks: int
    total_favorites: int
    total_searches: int
    favorite_tags: List[str]
    recent_activities: List[dict]


@router.post("/behavior/log")
async def log_user_behavior(
    behavior: BehaviorLog,
    db: Session = Depends(get_db)
):
    """
    记录用户行为

    支持的行为类型：
    - click: 点击卡片
    - favorite: 收藏
    - unfavorite: 取消收藏
    - search: 搜索
    - view: 浏览（停留超过3秒）
    - share: 分享
    """
    try:
        # 验证action类型
        if behavior.action not in [a.value for a in ActionType]:
            raise HTTPException(status_code=400, detail=f"Invalid action type: {behavior.action}")

        # 创建行为记录
        log_entry = UserBehavior(
            user_id=behavior.user_id,
            action=ActionType(behavior.action),
            card_id=behavior.card_id,
            query=behavior.query,
            duration=behavior.duration,
            search_mode=behavior.search_mode,
            metadata=behavior.metadata
        )

        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)

        return {
            "success": True,
            "id": log_entry.id,
            "message": f"Behavior logged: {behavior.action}"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/behavior/search-history")
async def create_search_history(
    search: SearchHistoryCreate,
    db: Session = Depends(get_db)
):
    """记录搜索历史"""
    try:
        history = SearchHistory(
            user_id=search.user_id,
            query=search.query,
            mode=search.mode,
            results_count=search.results_count,
            intent=search.intent
        )

        db.add(history)
        db.commit()
        db.refresh(history)

        return {
            "success": True,
            "id": history.id,
            "query": search.query
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/behavior/stats/{user_id}", response_model=BehaviorStats)
async def get_user_behavior_stats(
    user_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    获取用户行为统计

    Args:
        user_id: 用户ID
        days: 统计最近N天的数据
    """
    cutoff_date = datetime.now() - timedelta(days=days)

    # 统计各类行为次数
    total_clicks = db.query(func.count(UserBehavior.id)).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.action == ActionType.CLICK,
        UserBehavior.created_at >= cutoff_date
    ).scalar() or 0

    total_favorites = db.query(func.count(UserBehavior.id)).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.action == ActionType.FAVORITE,
        UserBehavior.created_at >= cutoff_date
    ).scalar() or 0

    total_searches = db.query(func.count(UserBehavior.id)).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.action == ActionType.SEARCH,
        UserBehavior.created_at >= cutoff_date
    ).scalar() or 0

    # 获取最近活动
    recent_activities = db.query(UserBehavior).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.created_at >= cutoff_date
    ).order_by(desc(UserBehavior.created_at)).limit(10).all()

    activities_list = [
        {
            "id": a.id,
            "action": a.action.value,
            "card_id": a.card_id,
            "query": a.query,
            "created_at": a.created_at.isoformat()
        }
        for a in recent_activities
    ]

    # TODO: 计算favorite_tags（需要关联tech_cards表）
    favorite_tags = []

    return BehaviorStats(
        user_id=user_id,
        total_clicks=total_clicks,
        total_favorites=total_favorites,
        total_searches=total_searches,
        favorite_tags=favorite_tags,
        recent_activities=activities_list
    )


@router.get("/behavior/search-history/{user_id}")
async def get_search_history(
    user_id: int,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """获取用户搜索历史"""
    history = db.query(SearchHistory).filter(
        SearchHistory.user_id == user_id
    ).order_by(desc(SearchHistory.created_at)).limit(limit).all()

    return [
        {
            "id": h.id,
            "query": h.query,
            "mode": h.mode,
            "results_count": h.results_count,
            "intent": h.intent,
            "created_at": h.created_at.isoformat()
        }
        for h in history
    ]


@router.delete("/behavior/search-history/{user_id}")
async def clear_search_history(
    user_id: int,
    db: Session = Depends(get_db)
):
    """清除用户搜索历史"""
    deleted = db.query(SearchHistory).filter(
        SearchHistory.user_id == user_id
    ).delete()

    db.commit()

    return {
        "success": True,
        "deleted_count": deleted,
        "message": f"Cleared {deleted} search history records"
    }


@router.get("/behavior/popular-searches")
async def get_popular_searches(
    limit: int = 10,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """获取热门搜索词"""
    cutoff_date = datetime.now() - timedelta(days=days)

    # 统计搜索词频率
    popular = db.query(
        SearchHistory.query,
        func.count(SearchHistory.id).label('count')
    ).filter(
        SearchHistory.created_at >= cutoff_date
    ).group_by(SearchHistory.query).order_by(
        desc('count')
    ).limit(limit).all()

    return [
        {"query": q, "count": c}
        for q, c in popular
    ]
