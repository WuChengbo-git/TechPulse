"""
收藏管理 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models.card import TechCard
from ..core.security import get_current_user
from ..models.user import User

router = APIRouter(prefix="/favorites", tags=["favorites"])


# 这里简化实现，实际应该有专门的 UserFavorite 表
# 为了快速上线，我们先用一个简单的方案


class FavoriteCreate(BaseModel):
    card_id: int


class FavoriteTagsUpdate(BaseModel):
    tags: List[str]


@router.get("/")
async def get_favorites(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tags: Optional[str] = None,
    sort_by: str = Query("latest", regex="^(latest|oldest|title|stars)$"),
    translate_to: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取用户收藏列表

    - tags: 标签筛选（逗号分隔）
    - sort_by: 排序方式
    - translate_to: 翻译目标语言
    """
    # TODO: 实际应该查询 UserFavorite 表
    # 这里暂时返回一些示例数据
    query = db.query(TechCard).filter(
        TechCard.quality_score >= 3.0
    )

    # 排序
    if sort_by == "latest":
        query = query.order_by(desc(TechCard.created_at))
    elif sort_by == "oldest":
        query = query.order_by(TechCard.created_at)
    elif sort_by == "title":
        query = query.order_by(TechCard.title)
    elif sort_by == "stars":
        query = query.order_by(desc(TechCard.quality_score))

    cards = query.offset(skip).limit(limit).all()

    # 转换为前端期望的格式
    results = []
    for card in cards:
        # 提取元数据
        metadata = {}

        # GitHub项目的stars和forks
        if card.stars is not None:
            metadata["stars"] = card.stars
        if card.forks is not None:
            metadata["forks"] = card.forks
        if card.issues is not None:
            metadata["issues"] = card.issues

        # 从raw_data中提取其他元数据
        if card.raw_data:
            if "author" in card.raw_data:
                metadata["author"] = card.raw_data.get("author")
            if "citations" in card.raw_data:
                metadata["citations"] = card.raw_data.get("citations")
            if "downloads" in card.raw_data:
                metadata["downloads"] = card.raw_data.get("downloads")
            if "likes" in card.raw_data:
                metadata["likes"] = card.raw_data.get("likes")
            if "language" in card.raw_data:
                metadata["language"] = card.raw_data.get("language")

        # 如果有tech_stack,也添加language
        if card.tech_stack and not metadata.get("language"):
            if isinstance(card.tech_stack, list) and len(card.tech_stack) > 0:
                metadata["language"] = card.tech_stack[0]
            elif isinstance(card.tech_stack, str):
                metadata["language"] = card.tech_stack

        result = {
            "id": card.id,
            "title": card.title,
            "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
            "url": card.original_url,
            "summary": card.summary or "",
            "tags": card.chinese_tags or [],
            "collection_tags": [],  # TODO: 从 UserFavorite 表获取
            "created_at": card.created_at.isoformat() if card.created_at else None,
            "favorited_at": card.created_at.isoformat() if card.created_at else None,  # TODO: 实际收藏时间
            "metadata": metadata
        }

        # 如果需要翻译
        if translate_to and translate_to == "zh-CN" and card.source.value == 'zenn':
            try:
                from ..services.translation_service import translate_zenn_content
                translated = await translate_zenn_content(card.title, card.summary)
                result["translated_title"] = translated["title"]
                result["translated_summary"] = translated["summary"]
            except Exception as e:
                import logging
                logging.error(f"Translation error for card {card.id}: {e}")

        results.append(result)

    return results


@router.post("/")
async def add_favorite(
    favorite: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """添加收藏"""
    # 检查卡片是否存在
    card = db.query(TechCard).filter(TechCard.id == favorite.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # TODO: 实际应该创建 UserFavorite 记录
    # 这里暂时返回成功

    return {
        "success": True,
        "message": "Added to favorites",
        "card_id": favorite.card_id
    }


@router.delete("/{card_id}")
async def remove_favorite(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消收藏"""
    # TODO: 实际应该删除 UserFavorite 记录

    return {
        "success": True,
        "message": "Removed from favorites",
        "card_id": card_id
    }


@router.put("/{card_id}/tags")
async def update_favorite_tags(
    card_id: int,
    tags_update: FavoriteTagsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新收藏的标签"""
    # TODO: 实际应该更新 UserFavorite 的 tags 字段

    return {
        "success": True,
        "message": "Tags updated",
        "card_id": card_id,
        "tags": tags_update.tags
    }


@router.get("/check/{card_id}")
async def check_favorite(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """检查是否已收藏"""
    # TODO: 实际应该查询 UserFavorite 表

    return {
        "is_favorited": False,
        "card_id": card_id
    }
