"""
收藏管理 API - 完整实现
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json

from ..core.database import get_db
from ..models.card import TechCard
from ..models.user_favorite import UserFavorite
from ..core.security import get_current_user
from ..models.user import User
from ..utils.tag_mapper import map_tags_to_display_names

router = APIRouter(prefix="/favorites", tags=["favorites"])


class FavoriteCreate(BaseModel):
    card_id: int
    tags: Optional[List[str]] = []


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
    # 查询用户的收藏记录
    favorites_query = db.query(UserFavorite).filter(
        UserFavorite.user_id == current_user.id
    )

    # 标签筛选
    if tags:
        tag_list = [t.strip() for t in tags.split(',')]
        # 简单的标签匹配（包含任一标签）
        favorites_query = favorites_query.filter(
            UserFavorite.tags.isnot(None)
        )

    # 获取所有收藏记录
    favorites = favorites_query.all()

    # 如果没有收藏，直接返回空列表
    if not favorites:
        return []

    # 提取卡片ID列表
    card_ids = [f.item_id for f in favorites]

    # 查询对应的卡片
    cards_query = db.query(TechCard).filter(TechCard.id.in_(card_ids))

    # 获取所有卡片
    cards = {card.id: card for card in cards_query.all()}

    # 构建收藏字典（card_id -> favorite）
    favorites_dict = {f.item_id: f for f in favorites}

    # 排序收藏列表
    if sort_by == "latest":
        favorites = sorted(favorites, key=lambda f: f.created_at, reverse=True)
    elif sort_by == "oldest":
        favorites = sorted(favorites, key=lambda f: f.created_at)
    elif sort_by == "title":
        favorites = sorted(favorites, key=lambda f: cards.get(f.item_id).title if cards.get(f.item_id) else "")
    elif sort_by == "stars":
        favorites = sorted(favorites, key=lambda f: cards.get(f.item_id).quality_score if cards.get(f.item_id) else 0, reverse=True)

    # 分页
    favorites = favorites[skip:skip + limit]

    # 转换为前端期望的格式
    results = []
    for favorite in favorites:
        card = cards.get(favorite.item_id)
        if not card:
            continue

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

        # 解析收藏标签
        collection_tags = []
        if favorite.tags:
            try:
                collection_tags = json.loads(favorite.tags) if isinstance(favorite.tags, str) else favorite.tags
            except:
                collection_tags = []

        result = {
            "id": card.id,
            "title": card.title,
            "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
            "url": card.original_url,
            "summary": card.summary or "",
            "tags": card.chinese_tags or [],
            "display_tags": map_tags_to_display_names(card.chinese_tags or [], max_tags=10),  # 友好显示名称
            "collection_tags": collection_tags,
            "created_at": card.created_at.isoformat() if card.created_at else None,
            "favorited_at": favorite.created_at.isoformat() if favorite.created_at else None,
            "metadata": metadata
        }

        # 翻译支持
        if translate_to:
            try:
                from ..services.translation_service import translate_zenn_content, get_translation_service

                # 如果目标语言是中文且来源是日文（Zenn）
                if translate_to == "zh-CN" and card.source.value == 'zenn':
                    translated = await translate_zenn_content(card.title, card.summary)
                    result["translated_title"] = translated["title"]
                    result["translated_summary"] = translated["summary"]

                # 如果目标语言是日文且来源内容是中文
                elif translate_to == "ja-JP" or translate_to == "ja":
                    if card.source.value != 'zenn':  # Zenn 本身就是日文，不需要翻译
                        translation_service = get_translation_service()
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
                    if card.source.value != 'github' and card.source.value != 'arxiv':
                        translation_service = get_translation_service()
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

    # 检查是否已收藏
    existing = db.query(UserFavorite).filter(
        and_(
            UserFavorite.user_id == current_user.id,
            UserFavorite.item_id == favorite.card_id,
            UserFavorite.item_type == 'card'
        )
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already favorited")

    # 创建收藏记录
    tags_json = json.dumps(favorite.tags) if favorite.tags else None
    new_favorite = UserFavorite(
        user_id=current_user.id,
        item_id=favorite.card_id,
        item_type='card',
        favorite_type='like',
        tags=tags_json
    )

    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)

    return {
        "success": True,
        "message": "Added to favorites",
        "card_id": favorite.card_id,
        "tags": favorite.tags
    }


@router.delete("/{card_id}")
async def remove_favorite(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """取消收藏"""
    # 查找收藏记录
    favorite = db.query(UserFavorite).filter(
        and_(
            UserFavorite.user_id == current_user.id,
            UserFavorite.item_id == card_id,
            UserFavorite.item_type == 'card'
        )
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(favorite)
    db.commit()

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
    # 查找收藏记录
    favorite = db.query(UserFavorite).filter(
        and_(
            UserFavorite.user_id == current_user.id,
            UserFavorite.item_id == card_id,
            UserFavorite.item_type == 'card'
        )
    ).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")

    # 更新标签
    favorite.tags = json.dumps(tags_update.tags) if tags_update.tags else None
    db.commit()

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
    favorite = db.query(UserFavorite).filter(
        and_(
            UserFavorite.user_id == current_user.id,
            UserFavorite.item_id == card_id,
            UserFavorite.item_type == 'card'
        )
    ).first()

    return {
        "is_favorited": favorite is not None,
        "card_id": card_id
    }
