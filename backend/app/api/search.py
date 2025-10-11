"""
智能搜索API
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel
from typing import List, Optional
import re

from ..core.database import get_db
from ..models.card import TechCard
from ..models.behavior import SearchHistory

router = APIRouter(tags=["search"])


# Pydantic模型
class SearchRequest(BaseModel):
    query: str
    mode: str = "keyword"  # keyword, ai
    user_id: Optional[int] = None
    limit: int = 20


class SearchResult(BaseModel):
    card: dict
    score: float  # 相关度分数 0-1
    highlights: List[str]  # 高亮的匹配词
    reason: str  # 匹配理由


class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    intent: Optional[str] = None  # query, analyze
    suggestions: List[str] = []  # 搜索建议


class IntentClassifier:
    """意图识别器"""

    QUERY_PATTERNS = [
        r'搜索|查找|找|有没有|寻找',
        r'关于.*的|.*方面的',
        r'.*资源|.*教程|.*项目|.*工具'
    ]

    ANALYZE_PATTERNS = [
        r'分析|比较|对比|区别',
        r'推荐|建议|适合|选择',
        r'如何|怎么|怎样|怎么办',
        r'为什么|为何|原因',
        r'优缺点|好处|坏处'
    ]

    @classmethod
    def classify(cls, query: str) -> str:
        """
        分类用户意图

        Returns:
            'query' - 查询意图（找东西）
            'analyze' - 分析意图（深入理解）
        """
        # 检查分析意图
        for pattern in cls.ANALYZE_PATTERNS:
            if re.search(pattern, query):
                return 'analyze'

        # 检查查询意图
        for pattern in cls.QUERY_PATTERNS:
            if re.search(pattern, query):
                return 'query'

        # 默认为查询意图
        return 'query'


class SearchEngine:
    """搜索引擎"""

    @staticmethod
    def calculate_relevance_score(card: TechCard, query: str) -> tuple[float, List[str]]:
        """
        计算相关度分数

        Returns:
            (score, highlights) - 分数和高亮词列表
        """
        score = 0.0
        highlights = []
        query_lower = query.lower()

        # 1. 标题匹配（权重50%）
        if card.title and query_lower in card.title.lower():
            score += 0.5
            highlights.append('标题')

        # 2. 摘要匹配（权重25%）
        if card.summary and query_lower in card.summary.lower():
            score += 0.25
            highlights.append('摘要')

        # 3. 标签匹配（权重15%）
        if card.chinese_tags:
            for tag in card.chinese_tags:
                if query_lower in tag.lower():
                    score += 0.15
                    highlights.append(f'标签:{tag}')
                    break

        # 4. 技术栈匹配（权重10%）
        if card.tech_stack:
            for tech in card.tech_stack:
                if query_lower in tech.lower():
                    score += 0.1
                    highlights.append(f'技术:{tech}')
                    break

        return score, highlights

    @staticmethod
    def generate_suggestions(query: str, db: Session) -> List[str]:
        """
        生成搜索建议

        基于：
        1. 热门搜索词
        2. 相关标签
        """
        suggestions = []

        # TODO: 基于查询生成智能建议
        # 这里先返回一些通用建议
        common_suggestions = [
            "深度学习",
            "Transformer",
            "FastAPI",
            "大语言模型",
            "推荐系统"
        ]

        # 返回与查询相关的建议
        for sug in common_suggestions:
            if query.lower() not in sug.lower():
                suggestions.append(sug)
                if len(suggestions) >= 3:
                    break

        return suggestions


@router.post("/search", response_model=SearchResponse)
async def smart_search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    智能搜索

    支持两种模式：
    1. keyword - 关键词搜索
    2. ai - AI问答搜索（需要OpenAI配置）
    """

    # 意图识别
    intent = IntentClassifier.classify(request.query)

    results = []

    if request.mode == "keyword":
        # 关键词搜索
        query_lower = request.query.lower()

        # 在标题、摘要、标签中搜索
        cards = db.query(TechCard).filter(
            or_(
                func.lower(TechCard.title).contains(query_lower),
                func.lower(TechCard.summary).contains(query_lower),
                # 注意：SQLite的JSON查询可能需要特殊处理
            )
        ).limit(request.limit * 2).all()  # 多获取一些，后续排序

        # 计算相关度并排序
        scored_cards = []
        for card in cards:
            score, highlights = SearchEngine.calculate_relevance_score(card, request.query)
            if score > 0:
                scored_cards.append((card, score, highlights))

        # 按分数排序
        scored_cards.sort(key=lambda x: x[1], reverse=True)

        # 构建结果
        for card, score, highlights in scored_cards[:request.limit]:
            reason = f"匹配: {', '.join(highlights)}" if highlights else "相关内容"

            results.append(SearchResult(
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
                score=score,
                highlights=highlights,
                reason=reason
            ))

    elif request.mode == "ai":
        # TODO: AI问答模式（需要集成OpenAI）
        pass

    # 生成搜索建议
    suggestions = SearchEngine.generate_suggestions(request.query, db)

    # 记录搜索历史
    if request.user_id:
        history = SearchHistory(
            user_id=request.user_id,
            query=request.query,
            mode=request.mode,
            results_count=len(results),
            intent=intent
        )
        db.add(history)
        db.commit()

    return SearchResponse(
        results=results,
        total=len(results),
        intent=intent,
        suggestions=suggestions
    )


@router.get("/search/autocomplete")
async def search_autocomplete(
    q: str = Query(..., min_length=1),
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    搜索自动补全

    返回匹配的标签和历史搜索
    """
    suggestions = []

    # 1. 从历史搜索中查找
    history = db.query(SearchHistory.query).filter(
        func.lower(SearchHistory.query).contains(q.lower())
    ).distinct().limit(limit).all()

    for (query,) in history:
        suggestions.append({
            "type": "history",
            "text": query,
            "icon": "🕐"
        })

    # 2. TODO: 从热门标签中查找

    return suggestions[:limit]
