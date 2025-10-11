"""
推荐系统API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from ..core.database import get_db
from ..models.card import TechCard
from ..models.behavior import UserBehavior, ActionType, UserRecommendation
from ..models.user_settings import UserPreferences

router = APIRouter(tags=["recommendations"])


class RecommendationItem(BaseModel):
    card: dict
    score: float  # 推荐分数 0-1
    reason: str  # 推荐理由
    matched_tags: List[str]  # 匹配的标签


class RecommendationEngine:
    """推荐引擎"""

    @staticmethod
    def calculate_recommendation_score(
        card: TechCard,
        user_tags: List[str],
        user_behaviors: List[UserBehavior]
    ) -> tuple[float, List[str], str]:
        """
        计算推荐分数

        考虑因素：
        1. 标签匹配度 (40%)
        2. 质量分数 (30%)
        3. 新鲜度 (20%)
        4. 用户历史行为 (10%)

        Returns:
            (score, matched_tags, reason)
        """
        score = 0.0
        matched_tags = []

        # 1. 标签匹配度 (40%)
        card_tags = set(card.chinese_tags or [])
        user_tag_set = set(user_tags)
        matched = card_tags & user_tag_set

        if matched:
            matched_tags = list(matched)
            tag_match_ratio = len(matched) / max(len(user_tag_set), 1)
            score += tag_match_ratio * 0.4

        # 2. 质量分数 (30%)
        quality_normalized = (card.quality_score or 5.0) / 10.0
        score += quality_normalized * 0.3

        # 3. 新鲜度 (20%)
        days_old = (datetime.now() - card.created_at.replace(tzinfo=None)).days
        recency_score = max(0, 1 - days_old / 30)
        score += recency_score * 0.2

        # 4. 用户历史行为 (10%)
        # 如果用户已经点击过，降低推荐分数
        clicked_card_ids = {b.card_id for b in user_behaviors if b.action == ActionType.CLICK}
        if card.id in clicked_card_ids:
            behavior_score = 0.5  # 降权
        else:
            behavior_score = 1.0

        score += behavior_score * 0.1

        # 生成推荐理由
        if matched_tags:
            reason = f"基于你的兴趣：{', '.join(matched_tags[:3])}"
        elif quality_normalized > 0.7:
            reason = f"高质量内容 (⭐ {card.quality_score:.1f}分)"
        elif recency_score > 0.8:
            reason = "最新发布"
        else:
            reason = "为你推荐"

        return score, matched_tags, reason


@router.get("/recommendations")
async def get_recommendations(
    user_id: int = Query(..., description="用户ID"),
    limit: int = Query(10, le=50),
    min_score: float = Query(0.3, description="最低推荐分数"),
    db: Session = Depends(get_db)
):
    """
    获取个性化推荐

    基于：
    1. 用户兴趣标签（从UserPreferences获取）
    2. 用户历史行为
    3. 内容质量分数
    4. 发布时间
    """

    # 1. 获取用户偏好标签
    user_prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == user_id
    ).first()

    if not user_prefs or not user_prefs.interest_tags:
        # 如果用户没有设置偏好，返回高质量内容
        cards = db.query(TechCard).filter(
            TechCard.quality_score >= 7.0
        ).order_by(desc(TechCard.created_at)).limit(limit).all()

        results = [
            RecommendationItem(
                card={
                    "id": c.id,
                    "title": c.title,
                    "source": c.source.value,
                    "original_url": c.original_url,
                    "summary": c.summary,
                    "chinese_tags": c.chinese_tags,
                    "quality_score": c.quality_score,
                    "created_at": c.created_at.isoformat()
                },
                score=c.quality_score / 10.0,
                reason=f"高质量内容 (⭐ {c.quality_score:.1f}分)",
                matched_tags=[]
            )
            for c in cards
        ]

        return {
            "recommendations": results,
            "total": len(results),
            "message": "请先设置兴趣标签以获得个性化推荐"
        }

    # 2. 获取用户历史行为（最近30天）
    cutoff_date = datetime.now() - timedelta(days=30)
    user_behaviors = db.query(UserBehavior).filter(
        UserBehavior.user_id == user_id,
        UserBehavior.created_at >= cutoff_date
    ).all()

    # 3. 获取候选卡片（最近60天，质量分>=5.0）
    candidate_cards = db.query(TechCard).filter(
        TechCard.created_at >= datetime.now() - timedelta(days=60),
        TechCard.quality_score >= 5.0
    ).all()

    # 4. 计算推荐分数
    recommendations = []
    for card in candidate_cards:
        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card,
            user_prefs.interest_tags,
            user_behaviors
        )

        if score >= min_score:
            recommendations.append((card, score, matched_tags, reason))

    # 5. 按分数排序
    recommendations.sort(key=lambda x: x[1], reverse=True)

    # 6. 构建结果
    results = []
    for card, score, matched_tags, reason in recommendations[:limit]:
        results.append(RecommendationItem(
            card={
                "id": card.id,
                "title": card.title,
                "source": card.source.value,
                "original_url": card.original_url,
                "summary": card.summary,
                "chinese_tags": card.chinese_tags,
                "quality_score": card.quality_score,
                "created_at": card.created_at.isoformat()
            },
            score=round(score, 2),
            reason=reason,
            matched_tags=matched_tags
        ))

        # 7. 记录推荐（用于后续分析）
        rec_record = UserRecommendation(
            user_id=user_id,
            card_id=card.id,
            score=int(score * 100),
            reason=reason,
            matched_tags=",".join(matched_tags) if matched_tags else None
        )
        db.add(rec_record)

    db.commit()

    return {
        "recommendations": results,
        "total": len(results),
        "user_tags": user_prefs.interest_tags
    }


@router.post("/recommendations/refresh")
async def refresh_recommendations(
    user_id: int,
    exclude_ids: List[int] = [],
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    刷新推荐（换一批）

    排除已显示的卡片ID
    """
    # 获取用户偏好
    user_prefs = db.query(UserPreferences).filter(
        UserPreferences.user_id == user_id
    ).first()

    if not user_prefs:
        return {"recommendations": [], "message": "请先设置兴趣标签"}

    # 获取候选卡片（排除已显示的）
    query = db.query(TechCard).filter(
        TechCard.created_at >= datetime.now() - timedelta(days=60),
        TechCard.quality_score >= 5.0
    )

    if exclude_ids:
        query = query.filter(~TechCard.id.in_(exclude_ids))

    candidate_cards = query.limit(limit * 3).all()

    # 计算推荐分数
    user_behaviors = db.query(UserBehavior).filter(
        UserBehavior.user_id == user_id
    ).all()

    recommendations = []
    for card in candidate_cards:
        score, matched_tags, reason = RecommendationEngine.calculate_recommendation_score(
            card,
            user_prefs.interest_tags,
            user_behaviors
        )

        if score >= 0.3:
            recommendations.append((card, score, matched_tags, reason))

    # 排序并返回
    recommendations.sort(key=lambda x: x[1], reverse=True)

    results = []
    for card, score, matched_tags, reason in recommendations[:limit]:
        results.append(RecommendationItem(
            card={
                "id": card.id,
                "title": card.title,
                "source": card.source.value,
                "original_url": card.original_url,
                "summary": card.summary,
                "chinese_tags": card.chinese_tags,
                "quality_score": card.quality_score,
                "created_at": card.created_at.isoformat()
            },
            score=round(score, 2),
            reason=reason,
            matched_tags=matched_tags
        ))

    return {
        "recommendations": results,
        "total": len(results)
    }


@router.post("/recommendations/{recommendation_id}/click")
async def mark_recommendation_clicked(
    recommendation_id: int,
    db: Session = Depends(get_db)
):
    """标记推荐被点击"""
    rec = db.query(UserRecommendation).filter(
        UserRecommendation.id == recommendation_id
    ).first()

    if not rec:
        return {"success": False, "message": "Recommendation not found"}

    rec.is_clicked = 1
    rec.clicked_at = datetime.now()
    db.commit()

    return {"success": True, "message": "Recommendation marked as clicked"}


@router.get("/recommendations/stats")
async def get_recommendation_stats(
    user_id: Optional[int] = None,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    获取推荐系统统计

    包括：
    - 推荐总数
    - 点击率
    - 最受欢迎的推荐理由
    """
    cutoff_date = datetime.now() - timedelta(days=days)

    query = db.query(UserRecommendation).filter(
        UserRecommendation.created_at >= cutoff_date
    )

    if user_id:
        query = query.filter(UserRecommendation.user_id == user_id)

    recommendations = query.all()

    total_recs = len(recommendations)
    clicked_recs = sum(1 for r in recommendations if r.is_clicked)
    click_rate = (clicked_recs / total_recs * 100) if total_recs > 0 else 0

    return {
        "total_recommendations": total_recs,
        "clicked_recommendations": clicked_recs,
        "click_rate": round(click_rate, 2),
        "period_days": days
    }
