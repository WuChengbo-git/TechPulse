"""
元数据更新 API

提供手动和批量更新卡片元数据的接口
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import logging

from ..core.database import get_db
from ..models.card import TechCard, SourceType
from ..services.metadata_enricher import MetadataEnricher
from ..core.security import get_current_user
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/metadata", tags=["metadata"])


class MetadataUpdateRequest(BaseModel):
    """元数据更新请求"""
    card_ids: Optional[List[int]] = None
    source: Optional[SourceType] = None
    limit: Optional[int] = 100
    github_token: Optional[str] = None


class MetadataUpdateResponse(BaseModel):
    """元数据更新响应"""
    success: bool
    message: str
    updated_count: int
    failed_count: int
    details: Optional[List[Dict[str, Any]]] = None


@router.post("/update", response_model=MetadataUpdateResponse)
async def update_metadata(
    request: MetadataUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新卡片元数据（支持单个、批量、按数据源）

    - 如果指定 card_ids，只更新这些卡片
    - 如果指定 source，更新该数据源的所有卡片（最多 limit 个）
    - 如果都不指定，更新所有卡片（最多 limit 个）

    注意：
    - 需要登录才能使用
    - 建议提供 github_token 以避免 API 限流
    - 批量更新会在后台执行
    """
    try:
        # 获取要更新的卡片
        query = db.query(TechCard)

        if request.card_ids:
            query = query.filter(TechCard.id.in_(request.card_ids))
            cards = query.all()
        elif request.source:
            query = query.filter(TechCard.source == request.source)
            cards = query.limit(request.limit or 100).all()
        else:
            cards = query.limit(request.limit or 100).all()

        if not cards:
            return MetadataUpdateResponse(
                success=False,
                message="No cards found to update",
                updated_count=0,
                failed_count=0
            )

        # 创建 enricher
        enricher = MetadataEnricher(github_token=request.github_token)

        # 如果卡片数量少，直接同步更新；否则后台异步更新
        if len(cards) <= 10:
            # 同步更新
            results = await enricher.enrich_cards_batch(cards, batch_size=5)

            # 更新数据库
            updated_count = 0
            failed_count = 0
            details = []

            for card in cards:
                if card.id in results:
                    metadata = results[card.id]
                    try:
                        # 更新字段
                        if 'stars' in metadata:
                            card.stars = metadata['stars']
                        if 'forks' in metadata:
                            card.forks = metadata['forks']
                        if 'issues' in metadata:
                            card.issues = metadata['issues']
                        if 'license' in metadata:
                            card.license = metadata['license']
                        if 'tech_stack' in metadata:
                            card.tech_stack = metadata['tech_stack']
                        if 'raw_data' in metadata:
                            # 合并 raw_data
                            if card.raw_data:
                                card.raw_data.update(metadata['raw_data'])
                            else:
                                card.raw_data = metadata['raw_data']

                        db.commit()
                        updated_count += 1

                        details.append({
                            "card_id": card.id,
                            "title": card.title,
                            "status": "updated",
                            "metadata": metadata
                        })

                    except Exception as e:
                        logger.error(f"Failed to update card {card.id}: {e}")
                        db.rollback()
                        failed_count += 1
                        details.append({
                            "card_id": card.id,
                            "title": card.title,
                            "status": "failed",
                            "error": str(e)
                        })
                else:
                    failed_count += 1
                    details.append({
                        "card_id": card.id,
                        "title": card.title,
                        "status": "no_metadata"
                    })

            return MetadataUpdateResponse(
                success=True,
                message=f"Updated {updated_count}/{len(cards)} cards",
                updated_count=updated_count,
                failed_count=failed_count,
                details=details
            )

        else:
            # 后台异步更新
            background_tasks.add_task(
                _update_metadata_background,
                cards,
                enricher,
                db
            )

            return MetadataUpdateResponse(
                success=True,
                message=f"Background update started for {len(cards)} cards. Check /metadata/stats for progress.",
                updated_count=0,
                failed_count=0
            )

    except Exception as e:
        logger.error(f"Error in update_metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _update_metadata_background(cards: List[TechCard], enricher: MetadataEnricher, db: Session):
    """后台更新元数据任务"""
    try:
        logger.info(f"Starting background metadata update for {len(cards)} cards")

        results = await enricher.enrich_cards_batch(cards, batch_size=10, delay=2.0)

        updated_count = 0
        for card in cards:
            if card.id in results:
                metadata = results[card.id]
                try:
                    # 更新字段
                    if 'stars' in metadata:
                        card.stars = metadata['stars']
                    if 'forks' in metadata:
                        card.forks = metadata['forks']
                    if 'issues' in metadata:
                        card.issues = metadata['issues']
                    if 'license' in metadata:
                        card.license = metadata['license']
                    if 'tech_stack' in metadata:
                        card.tech_stack = metadata['tech_stack']
                    if 'raw_data' in metadata:
                        if card.raw_data:
                            card.raw_data.update(metadata['raw_data'])
                        else:
                            card.raw_data = metadata['raw_data']

                    db.commit()
                    updated_count += 1

                except Exception as e:
                    logger.error(f"Failed to update card {card.id} in background: {e}")
                    db.rollback()

        logger.info(f"Background metadata update completed: {updated_count}/{len(cards)} cards updated")

    except Exception as e:
        logger.error(f"Error in background metadata update: {e}")


@router.get("/stats")
async def get_metadata_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    获取元数据统计信息

    返回各数据源中有/无元数据的卡片数量
    """
    try:
        stats = {}

        for source in SourceType:
            total = db.query(TechCard).filter(TechCard.source == source).count()

            # GitHub 卡片有 stars 数据
            if source == SourceType.GITHUB:
                with_metadata = db.query(TechCard).filter(
                    TechCard.source == source,
                    TechCard.stars > 0
                ).count()
            # HuggingFace 卡片有 downloads 数据（存在 raw_data 中）
            elif source == SourceType.HUGGINGFACE:
                # 这里简化判断，假设有 raw_data 就有元数据
                with_metadata = db.query(TechCard).filter(
                    TechCard.source == source,
                    TechCard.raw_data.isnot(None)
                ).count()
            # arXiv 卡片有 citations（存在 raw_data 中）
            elif source == SourceType.ARXIV:
                with_metadata = db.query(TechCard).filter(
                    TechCard.source == source,
                    TechCard.raw_data.isnot(None)
                ).count()
            else:
                with_metadata = 0

            stats[source.value] = {
                "total": total,
                "with_metadata": with_metadata,
                "without_metadata": total - with_metadata,
                "coverage": round(with_metadata / total * 100, 2) if total > 0 else 0
            }

        return {
            "stats_by_source": stats,
            "total_cards": sum(s["total"] for s in stats.values()),
            "total_with_metadata": sum(s["with_metadata"] for s in stats.values())
        }

    except Exception as e:
        logger.error(f"Error getting metadata stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh-single/{card_id}")
async def refresh_single_card_metadata(
    card_id: int,
    github_token: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    刷新单个卡片的元数据

    用于前端"刷新"按钮
    """
    try:
        card = db.query(TechCard).filter(TechCard.id == card_id).first()

        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        enricher = MetadataEnricher(github_token=github_token)
        metadata = await enricher.enrich_card_metadata(card)

        if not metadata:
            return {
                "success": False,
                "message": "No metadata available for this card"
            }

        # 更新数据库
        if 'stars' in metadata:
            card.stars = metadata['stars']
        if 'forks' in metadata:
            card.forks = metadata['forks']
        if 'issues' in metadata:
            card.issues = metadata['issues']
        if 'license' in metadata:
            card.license = metadata['license']
        if 'tech_stack' in metadata:
            card.tech_stack = metadata['tech_stack']
        if 'raw_data' in metadata:
            if card.raw_data:
                card.raw_data.update(metadata['raw_data'])
            else:
                card.raw_data = metadata['raw_data']

        db.commit()
        db.refresh(card)

        return {
            "success": True,
            "message": "Metadata refreshed successfully",
            "metadata": metadata,
            "card": {
                "id": card.id,
                "stars": card.stars,
                "forks": card.forks,
                "issues": card.issues,
                "license": card.license
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing metadata for card {card_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
