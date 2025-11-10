from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..core.database import get_db
from ..models.card import TechCard, SourceType, TrialStatus
from ..models.schemas import TechCard as TechCardSchema, TechCardCreate, TechCardUpdate
from ..services.translation_service import translate_zenn_content, get_translation_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cards", tags=["cards"])


@router.get("/")
async def get_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    source: Optional[SourceType] = None,
    status: Optional[TrialStatus] = None,
    search: Optional[str] = None,
    keyword: Optional[str] = None,
    field: Optional[str] = None,
    language: Optional[str] = None,
    min_stars: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    sort_by: Optional[str] = Query("latest", regex="^(latest|hot|stars|relevant)$"),
    translate_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    获取卡片列表，支持多种筛选和排序选项

    - skip: 跳过的记录数
    - limit: 返回的最大记录数
    - source: 数据源筛选 (github/arxiv/huggingface/zenn)
    - keyword: 关键词搜索（标题和摘要）
    - field: 领域筛选 (llm/cv/nlp/tools/ml)
    - language: 编程语言筛选
    - min_stars: 最小 star 数
    - start_date/end_date: 日期范围（YYYY-MM-DD）
    - sort_by: 排序方式 (latest/hot/stars/relevant)
    - translate_to: 翻译目标语言 (zh-CN/en-US/ja-JP)
    """
    query = db.query(TechCard)

    # 基础筛选
    if source:
        query = query.filter(TechCard.source == source)
    if status:
        query = query.filter(TechCard.status == status)

    # 关键词搜索
    if search:
        query = query.filter(TechCard.title.contains(search))
    if keyword:
        query = query.filter(
            (TechCard.title.contains(keyword)) |
            (TechCard.summary.contains(keyword))
        )

    # 领域筛选 (通过标签) - 需要在最后处理
    field_filter_enabled = field and field != "all"

    # 编程语言筛选 (通过 metadata)
    if language:
        # 需要 metadata 字段支持
        pass

    # 最小 star 数
    if min_stars is not None and min_stars > 0:
        # 需要从 metadata 中提取 stars
        pass

    # 日期范围
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(TechCard.created_at >= start_dt)
        except ValueError:
            pass

    if end_date:
        try:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            # 包含整个结束日期
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            query = query.filter(TechCard.created_at <= end_dt)
        except ValueError:
            pass

    # 排序
    if sort_by == "latest":
        query = query.order_by(TechCard.created_at.desc())
    elif sort_by == "hot":
        # 按质量分数排序
        query = query.order_by(TechCard.quality_score.desc())
    elif sort_by == "stars":
        # 需要 metadata 支持，暂时用质量分数
        query = query.order_by(TechCard.quality_score.desc())
    elif sort_by == "relevant":
        # 相关度排序，暂时用创建时间
        query = query.order_by(TechCard.created_at.desc())

    # 先获取卡片
    cards = query.offset(skip).limit(limit * 3 if field_filter_enabled else limit).all()

    # 应用领域筛选（在Python端处理）
    if field_filter_enabled:
        field_tags_map = {
            'llm': ['LLM', '大语言模型', '语言模型', 'GPT', 'transformers', 'text-generation', 'conversational', 'llama', 'chatbot', '对话'],
            'cv': ['计算机视觉', 'CV', 'cs.CV', 'image', 'vision', 'object-detection', 'segmentation', '图像', '视觉', 'YOLO'],
            'nlp': ['NLP', '自然语言处理', 'cs.CL', 'text', 'language', '文本', 'BERT', 'token-classification', 'question-answering'],
            'ml': ['机器学习', 'cs.LG', 'machine-learning', 'pytorch', 'tensorflow', 'scikit-learn', '深度学习', 'deep-learning'],
            'tools': ['工具', 'tools', 'Python', 'library', 'framework', 'API', 'dataset', '数据集']
        }

        if field in field_tags_map:
            field_keywords = field_tags_map[field]
            filtered_cards = []
            for card in cards:
                if card.chinese_tags:
                    card_tags_lower = [str(tag).lower() for tag in card.chinese_tags]
                    for keyword in field_keywords:
                        if keyword.lower() in card_tags_lower:
                            filtered_cards.append(card)
                            break
            cards = filtered_cards[:limit]

    # 如果需要翻译 Zenn 内容
    results = []
    for card in cards:
        # 转换为字典
        card_dict = {
            "id": card.id,
            "title": card.title,
            "summary": card.summary,
            "original_url": card.original_url,
            "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
            "created_at": card.created_at.isoformat() if card.created_at else None,
            "updated_at": card.updated_at.isoformat() if card.updated_at else None,
            "quality_score": card.quality_score,
            "chinese_tags": card.chinese_tags,
            "stars": card.stars if card.stars is not None else None,
            "forks": card.forks if card.forks is not None else None,
            "issues": card.issues if card.issues is not None else None,
            "license": card.license,
            "tech_stack": card.tech_stack,
            "raw_data": card.raw_data
        }

        # 翻译支持
        if translate_to:
            try:
                translation_service = get_translation_service()

                # 如果目标语言是中文且来源是日文（Zenn）
                if translate_to == "zh-CN" and card.source.value == 'zenn':
                    translated = await translate_zenn_content(card.title, card.summary)
                    card_dict["translated_title"] = translated["title"]
                    card_dict["translated_summary"] = translated["summary"]

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
                        card_dict["translated_title"] = translated_title
                        card_dict["translated_summary"] = translated_summary

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
                        card_dict["translated_title"] = translated_title
                        card_dict["translated_summary"] = translated_summary

            except Exception as e:
                logger.error(f"Translation error for card {card.id}: {e}")
                # 翻译失败时不添加翻译字段

        results.append(card_dict)

    return results


@router.get("/stats")
def get_cards_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取卡片统计信息（用于数据源管理页面）
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 基础统计
    total_cards = db.query(TechCard).count()
    today_cards = db.query(TechCard).filter(TechCard.created_at >= today).count()
    
    # 按数据源统计
    sources_stats = {}
    for source in SourceType:
        total_count = db.query(TechCard).filter(TechCard.source == source).count()
        today_count = db.query(TechCard).filter(
            TechCard.source == source, 
            TechCard.created_at >= today
        ).count()
        
        # 获取最后更新时间
        last_updated = db.query(TechCard).filter(TechCard.source == source).order_by(
            desc(TechCard.created_at)
        ).first()
        
        sources_stats[source.value] = {
            "total": total_count,
            "today": today_count,
            "last_update": last_updated.created_at.isoformat() if last_updated else None
        }
    
    return {
        "total_cards": total_cards,
        "today_cards": today_cards,
        "sources_stats": sources_stats
    }


@router.get("/overview-stats")
def get_overview_stats(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    获取概览页面统计信息
    """
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 基础统计
    total_cards = db.query(TechCard).count()
    today_cards = db.query(TechCard).filter(TechCard.created_at >= today).count()
    
    # 按数据源统计
    sources_stats = {}
    for source in SourceType:
        count = db.query(TechCard).filter(TechCard.source == source).count()
        sources_stats[source.value] = count
    
    # 热门标签统计 (从chinese_tags字段提取)
    trending_tags = []
    try:
        # 获取所有包含标签的卡片
        cards_with_tags = db.query(TechCard).filter(
            TechCard.chinese_tags.isnot(None)
        ).all()
        
        # 统计标签频次
        tag_counts = {}
        for card in cards_with_tags:
            if card.chinese_tags:
                for tag in card.chinese_tags:
                    if isinstance(tag, str) and len(tag.strip()) > 0:
                        clean_tag = tag.strip()
                        tag_counts[clean_tag] = tag_counts.get(clean_tag, 0) + 1
        
        # 按频次排序，取前20个
        trending_tags = [
            {"tag": tag, "count": count} 
            for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        ]
    except Exception as e:
        print(f"Error processing tags: {e}")
        trending_tags = []
    
    return {
        "total_cards": total_cards,
        "today_cards": today_cards, 
        "sources_stats": sources_stats,
        "trending_tags": trending_tags
    }


@router.get("/{card_id}")
async def get_card(
    card_id: int,
    translate_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    获取单个卡片详情

    - card_id: 卡片ID
    - translate_to: 翻译目标语言 (zh-CN/en-US/ja-JP)
    """
    card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # 转换为字典
    card_dict = {
        "id": card.id,
        "title": card.title,
        "summary": card.summary,
        "original_url": card.original_url,
        "source": card.source.value if hasattr(card.source, 'value') else str(card.source),
        "created_at": card.created_at.isoformat() if card.created_at else None,
        "updated_at": card.updated_at.isoformat() if card.updated_at else None,
        "quality_score": card.quality_score,
        "chinese_tags": card.chinese_tags,
        "stars": card.stars if card.stars is not None else None,
        "forks": card.forks if card.forks is not None else None,
        "issues": card.issues if card.issues is not None else None,
        "license": card.license,
        "tech_stack": card.tech_stack,
        "raw_data": card.raw_data
    }

    # 翻译 Zenn 内容 (日文 → 中文)
    if translate_to and translate_to == "zh-CN" and card.source.value == 'zenn':
        try:
            translated = await translate_zenn_content(card.title, card.summary)
            card_dict["translated_title"] = translated["title"]
            card_dict["translated_summary"] = translated["summary"]
        except Exception as e:
            logger.error(f"Translation error for card {card.id}: {e}")

    return card_dict


@router.post("/", response_model=TechCardSchema)
def create_card(card: TechCardCreate, db: Session = Depends(get_db)):
    db_card = TechCard(**card.dict())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card


@router.put("/{card_id}", response_model=TechCardSchema)
def update_card(card_id: int, card_update: TechCardUpdate, db: Session = Depends(get_db)):
    db_card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    for field, value in card_update.dict(exclude_unset=True).items():
        setattr(db_card, field, value)
    
    db.commit()
    db.refresh(db_card)
    return db_card


@router.delete("/{card_id}")
def delete_card(card_id: int, db: Session = Depends(get_db)):
    db_card = db.query(TechCard).filter(TechCard.id == card_id).first()
    if not db_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(db_card)
    db.commit()
    return {"message": "Card deleted successfully"}