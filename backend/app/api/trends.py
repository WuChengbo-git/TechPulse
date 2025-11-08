"""
趋势分析 API
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract
from typing import Dict, Any, List
from datetime import datetime, timedelta
from collections import Counter

from ..core.database import get_db
from ..models.card import TechCard

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("/overview")
def get_trends_overview(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取技术趋势概览数据

    返回:
    - 数据源分布
    - 每日新增趋势
    - 热门领域
    - 热门技术标签
    """
    # 数据源分布
    source_distribution = (
        db.query(TechCard.source, func.count(TechCard.id).label('count'))
        .group_by(TechCard.source)
        .all()
    )

    source_stats = [
        {"source": source.value if hasattr(source, 'value') else str(source), "count": count}
        for source, count in source_distribution
    ]

    # 最近30天每日新增趋势
    thirty_days_ago = datetime.now() - timedelta(days=30)
    daily_stats = (
        db.query(
            func.date(TechCard.created_at).label('date'),
            func.count(TechCard.id).label('count')
        )
        .filter(TechCard.created_at >= thirty_days_ago)
        .group_by(func.date(TechCard.created_at))
        .order_by('date')
        .all()
    )

    daily_trend = [
        {"date": str(date), "count": count}
        for date, count in daily_stats
    ]

    # 热门领域（通过标签统计）
    all_cards = db.query(TechCard.chinese_tags).filter(TechCard.chinese_tags.isnot(None)).all()

    field_tags_map = {
        'LLM': ['LLM', '大语言模型', '语言模型', 'GPT', 'transformers', 'llama', 'chatbot'],
        '计算机视觉': ['计算机视觉', 'CV', 'cs.CV', 'image', 'vision', 'object-detection', 'YOLO'],
        'NLP': ['NLP', '自然语言处理', 'cs.CL', 'text', 'BERT', 'token-classification'],
        '机器学习': ['机器学习', 'cs.LG', 'machine-learning', 'pytorch', 'tensorflow', 'scikit-learn'],
        '深度学习': ['深度学习', 'deep-learning', 'neural-network', 'CNN', 'RNN'],
        '强化学习': ['强化学习', 'reinforcement-learning', 'RL', 'Q-learning'],
        '工具库': ['工具', 'tools', 'Python', 'library', 'framework'],
        '数据科学': ['数据科学', 'data-science', 'dataset', '数据集', 'pandas', 'numpy'],
    }

    field_counts = {field: 0 for field in field_tags_map.keys()}

    for (tags,) in all_cards:
        if tags:
            tags_lower = [str(tag).lower() for tag in tags]
            for field, keywords in field_tags_map.items():
                for keyword in keywords:
                    if keyword.lower() in tags_lower:
                        field_counts[field] += 1
                        break

    field_distribution = [
        {"field": field, "count": count}
        for field, count in sorted(field_counts.items(), key=lambda x: x[1], reverse=True)
        if count > 0
    ]

    # 热门技术标签 Top 20
    tag_counter = Counter()
    for (tags,) in all_cards:
        if tags:
            tag_counter.update([str(tag) for tag in tags])

    top_tags = [
        {"tag": tag, "count": count}
        for tag, count in tag_counter.most_common(20)
    ]

    # 总体统计
    total_cards = db.query(func.count(TechCard.id)).scalar()
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_cards = db.query(func.count(TechCard.id)).filter(TechCard.created_at >= today).scalar()

    return {
        "total_cards": total_cards,
        "today_cards": today_cards,
        "source_distribution": source_stats,
        "daily_trend": daily_trend,
        "field_distribution": field_distribution,
        "top_tags": top_tags,
    }


@router.get("/stars-distribution")
def get_stars_distribution(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取 GitHub Stars 分布
    """
    # Stars 分布区间
    ranges = [
        (0, 100),
        (100, 500),
        (500, 1000),
        (1000, 5000),
        (5000, 10000),
        (10000, float('inf'))
    ]

    distribution = []
    for min_stars, max_stars in ranges:
        if max_stars == float('inf'):
            count = (
                db.query(func.count(TechCard.id))
                .filter(TechCard.stars >= min_stars)
                .filter(TechCard.stars.isnot(None))
                .scalar()
            )
            label = f"{min_stars}+"
        else:
            count = (
                db.query(func.count(TechCard.id))
                .filter(TechCard.stars >= min_stars)
                .filter(TechCard.stars < max_stars)
                .filter(TechCard.stars.isnot(None))
                .scalar()
            )
            label = f"{min_stars}-{max_stars}"

        distribution.append({"range": label, "count": count})

    return {"stars_distribution": distribution}


@router.get("/quality-score-distribution")
def get_quality_score_distribution(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取质量分数分布
    """
    # 质量分数分布
    ranges = [(i, i+1) for i in range(0, 10)]

    distribution = []
    for min_score, max_score in ranges:
        count = (
            db.query(func.count(TechCard.id))
            .filter(TechCard.quality_score >= min_score)
            .filter(TechCard.quality_score < max_score)
            .scalar()
        )
        distribution.append({"range": f"{min_score}-{max_score}", "count": count})

    return {"quality_distribution": distribution}
