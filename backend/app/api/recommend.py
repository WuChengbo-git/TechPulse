"""
推荐系统API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import logging

from ..core.database import get_db
from ..models.card import TechCard
from ..models.behavior import UserBehavior, ActionType, UserRecommendation
from ..models.user_preference import UserPreference
from ..services.translation_service import translate_zenn_content, get_translation_service
from ..utils.tag_mapper import map_tags_to_display_names

router = APIRouter(tags=["recommendations"])
logger = logging.getLogger(__name__)


@router.get("/recommend/")
async def get_simple_recommendations(
    limit: int = Query(20, le=100),
    skip: int = Query(0, ge=0),
    field: Optional[str] = None,
    sort_by: str = Query("recommended", regex="^(recommended|latest|hot|stars)$"),
    translate_to: Optional[str] = None,
    lang: Optional[str] = Query(None, description="Language for tag display (zh/en/ja)"),
    db: Session = Depends(get_db)
):
    """
    简化的推荐端点（不需要用户ID，用于未登录或新用户）

    返回高质量的最新内容（今天和昨天）

    - limit: 返回数量
    - skip: 跳过的数量（用于分页）
    - field: 领域筛选 (llm/cv/nlp/ml/dl/rl/tools/robotics/data)
    - sort_by: 排序方式 (recommended/latest/hot/stars)
    - translate_to: 翻译目标语言
    """
    # 计算时间范围：今天和昨天
    now = datetime.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    query = db.query(TechCard).filter(
        TechCard.quality_score >= 3.0,
        TechCard.created_at >= yesterday_start  # 只显示昨天和今天的数据
    )

    # 领域筛选（通过标签匹配）
    if field and field != "all":
        # 领域到标签的映射
        field_tags_map = {
            'llm': ['LLM', '大语言模型', '语言模型', 'GPT', 'transformers', 'text-generation', 'conversational', 'llama', 'chatbot', '对话'],
            'cv': ['计算机视觉', 'CV', 'cs.CV', 'image', 'vision', 'object-detection', 'segmentation', '图像', '视觉', 'YOLO'],
            'nlp': ['NLP', '自然语言处理', 'cs.CL', 'text', 'language', '文本', 'BERT', 'token-classification', 'question-answering'],
            'ml': ['机器学习', 'cs.LG', 'machine-learning', 'pytorch', 'tensorflow', 'scikit-learn'],
            'dl': ['深度学习', 'deep-learning', 'neural-network', 'CNN', 'RNN', 'LSTM', 'GAN'],
            'rl': ['强化学习', 'reinforcement-learning', 'RL', 'Q-learning', 'DQN', 'policy-gradient'],
            'tools': ['工具', 'tools', 'Python', 'library', 'framework', 'API'],
            'robotics': ['机器人', 'robotics', 'robot', 'autonomous', 'navigation', 'manipulation'],
            'data': ['数据科学', 'data-science', 'dataset', '数据集', 'pandas', 'numpy', 'data-analysis']
        }

        if field in field_tags_map:
            field_keywords = field_tags_map[field]
            # 在 Python 端过滤（因为 SQLite 的 JSON 支持有限）
            # 先获取所有候选卡片
            all_cards = query.all()

            # 筛选包含目标标签的卡片
            filtered_cards = []
            for card in all_cards:
                if card.chinese_tags:
                    # 检查是否有任何标签匹配
                    card_tags_lower = [str(tag).lower() for tag in card.chinese_tags]
                    for keyword in field_keywords:
                        if keyword.lower() in card_tags_lower:
                            filtered_cards.append(card)
                            break

            # 应用分页：跳过skip个，取limit个
            cards = filtered_cards[skip:skip + limit]
            results = []
            for card in cards:
                # 从 card 和 raw_data 中提取元数据
                raw_data = card.raw_data or {}

                # 根据数据源构建元数据
                metadata = {}
                if card.source.value == 'github':
                    metadata = {
                        "author": card.title.split('/')[0] if '/' in card.title else None,
                        "language": card.tech_stack[0] if card.tech_stack and len(card.tech_stack) > 0 else None,
                        "stars": card.stars if card.stars is not None else None,
                        "forks": card.forks if card.forks is not None else None,
                        "watchers": raw_data.get('watchers'),
                        "issues": card.issues if card.issues is not None else None,
                        "citations": None,
                        "downloads": None,
                        "likes": None,
                    }
                elif card.source.value == 'arxiv':
                    metadata = {
                        "author": None,
                        "language": None,
                        "stars": None,
                        "forks": None,
                        "citations": raw_data.get('citations'),
                        "downloads": None,
                        "likes": None,
                    }
                elif card.source.value == 'huggingface':
                    metadata = {
                        "author": raw_data.get('author'),
                        "language": raw_data.get('library_name'),
                        "stars": None,
                        "forks": None,
                        "citations": None,
                        "downloads": raw_data.get('downloads'),
                        "likes": raw_data.get('likes'),
                    }
                else:  # zenn or others
                    metadata = {
                        "author": None,
                        "language": None,
                        "stars": None,
                        "forks": None,
                        "citations": None,
                        "downloads": None,
                        "likes": None,
                    }

                # 确定标签显示语言
                tag_lang = 'zh'  # 默认中文
                if lang:
                    if lang.startswith('ja'):
                        tag_lang = 'ja'
                    elif lang.startswith('en'):
                        tag_lang = 'en'

                result = {
                    "id": card.id,
                    "title": card.title,
                    "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
                    "url": card.original_url,
                    "short_summary": card.short_summary or "",  # 简短介绍（卡片列表用）
                    "summary": card.summary or "",  # 中等详细度摘要（快速阅览用）
                    "tags": card.chinese_tags or [],
                    "display_tags": map_tags_to_display_names(card.chinese_tags or [], max_tags=10, language=tag_lang),  # 友好显示名称
                    "created_at": card.created_at.isoformat() if card.created_at else None,
                    "metadata": metadata
                }

                # 翻译支持（字段过滤分支）
                if translate_to:
                    try:
                        translation_service = get_translation_service()

                        # 如果目标语言是中文且来源是日文（Zenn）
                        if translate_to == "zh-CN" and card.source.value == 'zenn':
                            translated = await translate_zenn_content(card.title, card.summary)
                            result["translated_title"] = translated["title"]
                            result["translated_summary"] = translated["summary"]

                        # 如果目标语言是日文且来源内容是中文
                        elif translate_to == "ja-JP" or translate_to == "ja":
                            # 大部分内容是中文的，需要翻译成日文
                            if card.source.value != 'zenn':  # Zenn 本身就是日文，不需要翻译
                                translated_title = await translation_service.translate(
                                    card.title,
                                    source_lang="zh-CN",
                                    target_lang="ja"
                                )
                                translated_summary = await translation_service.translate(
                                    card.summary or "",
                                    source_lang="zh-CN",
                                    target_lang="ja"
                                )
                                result["translated_title"] = translated_title
                                result["translated_summary"] = translated_summary

                        # 如果目标语言是英文且来源内容是中文
                        elif translate_to == "en-US" or translate_to == "en":
                            if card.source.value != 'github' and card.source.value != 'arxiv':  # GitHub 和 arXiv 通常是英文
                                translated_title = await translation_service.translate(
                                    card.title,
                                    source_lang="zh-CN",
                                    target_lang="en"
                                )
                                translated_summary = await translation_service.translate(
                                    card.summary or "",
                                    source_lang="zh-CN",
                                    target_lang="en"
                                )
                                result["translated_title"] = translated_title
                                result["translated_summary"] = translated_summary

                    except Exception as e:
                        logger.error(f"Translation error for card {card.id}: {e}")
                        # 翻译失败时不添加翻译字段

                results.append(result)

            return results

    # 排序
    if sort_by == "recommended" or sort_by == "hot":
        # 推荐度 = 质量分数 + 新鲜度
        query = query.order_by(
            TechCard.quality_score.desc(),
            TechCard.created_at.desc()
        )
    elif sort_by == "latest":
        query = query.order_by(TechCard.created_at.desc())
    elif sort_by == "stars":
        # 暂时用质量分数代替
        query = query.order_by(TechCard.quality_score.desc())

    # 应用分页
    cards = query.offset(skip).limit(limit).all()

    # 转换为前端期望的格式
    results = []
    for card in cards:
        # 从 card 和 raw_data 中提取元数据
        raw_data = card.raw_data or {}

        # 根据数据源构建元数据
        metadata = {}
        if card.source.value == 'github':
            metadata = {
                "author": card.title.split('/')[0] if '/' in card.title else None,
                "language": card.tech_stack[0] if card.tech_stack and len(card.tech_stack) > 0 else None,
                "stars": card.stars if card.stars is not None else None,
                "forks": card.forks if card.forks is not None else None,
                "watchers": raw_data.get('watchers'),
                "issues": card.issues if card.issues is not None else None,
                "citations": None,
                "downloads": None,
                "likes": None,
            }
        elif card.source.value == 'arxiv':
            metadata = {
                "author": None,
                "language": None,
                "stars": None,
                "forks": None,
                "citations": raw_data.get('citations'),
                "downloads": None,
                "likes": None,
            }
        elif card.source.value == 'huggingface':
            metadata = {
                "author": raw_data.get('author'),
                "language": raw_data.get('library_name'),
                "stars": None,
                "forks": None,
                "citations": None,
                "downloads": raw_data.get('downloads'),
                "likes": raw_data.get('likes'),
            }
        else:  # zenn or others
            metadata = {
                "author": None,
                "language": None,
                "stars": None,
                "forks": None,
                "citations": None,
                "downloads": None,
                "likes": None,
            }

        # 确定标签显示语言
        tag_lang = 'zh'  # 默认中文
        if lang:
            if lang.startswith('ja'):
                tag_lang = 'ja'
            elif lang.startswith('en'):
                tag_lang = 'en'

        result = {
            "id": card.id,
            "title": card.title,
            "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
            "url": card.original_url,
            "short_summary": card.short_summary or "",  # 简短介绍（卡片列表用）
            "summary": card.summary or "",  # 中等详细度摘要（快速阅览用）
            "tags": card.chinese_tags or [],
            "display_tags": map_tags_to_display_names(card.chinese_tags or [], max_tags=10, language=tag_lang),  # 友好显示名称
            "created_at": card.created_at.isoformat() if card.created_at else None,
            "metadata": metadata
        }

        # 翻译支持
        if translate_to:
            try:
                translation_service = get_translation_service()

                # 如果目标语言是中文且来源是日文（Zenn）
                if translate_to == "zh-CN" and card.source.value == 'zenn':
                    translated = await translate_zenn_content(card.title, card.summary)
                    result["translated_title"] = translated["title"]
                    result["translated_summary"] = translated["summary"]

                # 如果目标语言是日文且来源内容是中文
                elif translate_to == "ja-JP" or translate_to == "ja":
                    # 大部分内容是中文的，需要翻译成日文
                    if card.source.value != 'zenn':  # Zenn 本身就是日文，不需要翻译
                        translated_title = await translation_service.translate(
                            card.title,
                            source_lang="zh-CN",
                            target_lang="ja"
                        )
                        translated_summary = await translation_service.translate(
                            card.summary or "",
                            source_lang="zh-CN",
                            target_lang="ja"
                        )
                        result["translated_title"] = translated_title
                        result["translated_summary"] = translated_summary

                # 如果目标语言是英文且来源内容是中文
                elif translate_to == "en-US" or translate_to == "en":
                    if card.source.value != 'github' and card.source.value != 'arxiv':  # GitHub 和 arXiv 通常是英文
                        translated_title = await translation_service.translate(
                            card.title,
                            source_lang="zh-CN",
                            target_lang="en"
                        )
                        translated_summary = await translation_service.translate(
                            card.summary or "",
                            source_lang="zh-CN",
                            target_lang="en"
                        )
                        result["translated_title"] = translated_title
                        result["translated_summary"] = translated_summary

            except Exception as e:
                logger.error(f"Translation error for card {card.id}: {e}")
                # 翻译失败时不添加翻译字段

        results.append(result)

    return results


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
    user_prefs = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.preference_type == 'tag'
    ).all()

    # 提取标签列表
    interest_tags = [pref.preference_value for pref in user_prefs] if user_prefs else []

    if not interest_tags:
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
            interest_tags,
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
        "user_tags": interest_tags
    }


@router.post("/recommendations/refresh")
async def refresh_recommendations(
    user_id: int = Query(...),
    exclude_ids: List[int] = Query(default=[]),
    limit: int = Query(default=10),
    db: Session = Depends(get_db)
):
    """
    刷新推荐（换一批）

    排除已显示的卡片ID
    """
    # 获取用户偏好
    user_prefs = db.query(UserPreference).filter(
        UserPreference.user_id == user_id,
        UserPreference.preference_type == 'tag'
    ).all()

    interest_tags = [pref.preference_value for pref in user_prefs] if user_prefs else []

    if not interest_tags:
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
            interest_tags,
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
