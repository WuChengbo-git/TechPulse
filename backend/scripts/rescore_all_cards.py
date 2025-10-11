#!/usr/bin/env python3
"""
重新评分所有技术卡片的脚本

使用改进的质量评分算法重新计算所有现有卡片的质量分数
"""
import sys
sys.path.insert(0, '/home/AI/TechPulse/backend')

from app.core.database import SessionLocal
from app.models.card import TechCard, SourceType
from app.services.quality_filter import quality_scorer
from sqlalchemy import func
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def prepare_card_data(card: TechCard) -> dict:
    """从TechCard对象准备评分所需的数据字典"""
    # 从raw_data获取完整数据
    if card.raw_data and isinstance(card.raw_data, dict):
        data = card.raw_data.copy()
    else:
        data = {}

    # 确保基础字段存在
    data['title'] = data.get('title', card.title)
    data['summary'] = data.get('summary', card.summary or '')
    data['description'] = data.get('description', '')

    # GitHub特定字段
    if card.source == SourceType.GITHUB:
        data['stars'] = data.get('stars', card.stars or 0)
        data['forks'] = data.get('forks', card.forks or 0)
        data['commit_count_30d'] = data.get('commit_count_30d', 0)
        data['star_growth_rate'] = data.get('star_growth_rate', 0)

    # arXiv特定字段
    elif card.source == SourceType.ARXIV:
        data['authors'] = data.get('authors', '')
        data['created_at'] = data.get('created_at', card.created_at)

    # HuggingFace特定字段
    elif card.source == SourceType.HUGGINGFACE:
        data['downloads'] = data.get('downloads', 0)
        data['likes'] = data.get('likes', 0)
        data['download_growth_rate'] = data.get('download_growth_rate', 0)

    # Zenn特定字段
    elif card.source == SourceType.ZENN:
        data['likes'] = data.get('likes', 0)
        data['comments'] = data.get('comments', 0)
        data['is_premium'] = data.get('is_premium', False)

    return data


def rescore_all_cards():
    """重新评分所有卡片"""
    db = SessionLocal()

    try:
        # 获取所有卡片总数
        total_cards = db.query(func.count(TechCard.id)).scalar()
        logger.info(f"开始重新评分 {total_cards} 张卡片...")

        # 按数据源分别处理
        sources = [
            (SourceType.GITHUB, 'github'),
            (SourceType.ARXIV, 'arxiv'),
            (SourceType.HUGGINGFACE, 'huggingface'),
            (SourceType.ZENN, 'zenn')
        ]

        total_updated = 0

        for source_enum, source_name in sources:
            logger.info(f"\n处理 {source_name.upper()} 卡片...")

            # 分批处理，每批1000张
            batch_size = 1000
            offset = 0
            source_updated = 0

            while True:
                cards = db.query(TechCard).filter(
                    TechCard.source == source_enum
                ).offset(offset).limit(batch_size).all()

                if not cards:
                    break

                for card in cards:
                    try:
                        # 准备评分数据
                        data = prepare_card_data(card)

                        # 计算新分数
                        new_score = quality_scorer.score_item(data, source_name)

                        # 更新分数
                        old_score = card.quality_score or 0
                        card.quality_score = new_score

                        source_updated += 1

                        if source_updated % 100 == 0:
                            logger.info(f"  已处理 {source_updated} 张 {source_name} 卡片...")

                    except Exception as e:
                        logger.error(f"评分失败 {card.title[:50]}: {e}")
                        continue

                # 提交当前批次
                db.commit()
                offset += batch_size

            logger.info(f"完成 {source_name.upper()}: 更新了 {source_updated} 张卡片")
            total_updated += source_updated

        logger.info(f"\n重新评分完成！共更新 {total_updated} 张卡片")

        # 显示新的分数分布
        logger.info("\n新的质量分数分布：")
        logger.info("=" * 80)

        # 总体分布
        total = db.query(func.count(TechCard.id)).scalar()
        high_quality = db.query(func.count(TechCard.id)).filter(TechCard.quality_score >= 7.0).scalar()
        medium_quality = db.query(func.count(TechCard.id)).filter(
            TechCard.quality_score >= 5.0,
            TechCard.quality_score < 7.0
        ).scalar()
        low_quality = db.query(func.count(TechCard.id)).filter(TechCard.quality_score < 5.0).scalar()

        logger.info(f"总卡片数: {total}")
        logger.info(f"高质量 (≥7.0分): {high_quality} ({high_quality/total*100:.1f}%)")
        logger.info(f"中等质量 (5.0-7.0分): {medium_quality} ({medium_quality/total*100:.1f}%)")
        logger.info(f"低质量 (<5.0分): {low_quality} ({low_quality/total*100:.1f}%)")

        # 按数据源分布
        logger.info("\n按数据源分布：")
        for source_enum, source_name in sources:
            count = db.query(func.count(TechCard.id)).filter(TechCard.source == source_enum).scalar()
            avg_score = db.query(func.avg(TechCard.quality_score)).filter(TechCard.source == source_enum).scalar()
            high = db.query(func.count(TechCard.id)).filter(
                TechCard.source == source_enum,
                TechCard.quality_score >= 7.0
            ).scalar()

            if count > 0:
                logger.info(f"{source_name:12s}: {count:5d} 张, 平均分 {avg_score:.2f}, 高质量 {high} ({high/count*100:.1f}%)")

        logger.info("=" * 80)

    except Exception as e:
        logger.error(f"重新评分过程出错: {e}")
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    rescore_all_cards()
