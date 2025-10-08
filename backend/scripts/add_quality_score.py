#!/usr/bin/env python3
"""
添加quality_score字段到tech_cards表

运行方式: python scripts/add_quality_score.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.services.quality_filter import quality_scorer
from app.models.card import TechCard
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_quality_score_column():
    """添加quality_score字段到tech_cards表"""
    with engine.connect() as conn:
        # 检查字段是否已存在 (SQLite语法)
        try:
            result = conn.execute(text("PRAGMA table_info(tech_cards)"))
            columns = [row[1] for row in result.fetchall()]

            if 'quality_score' in columns:
                logger.info("✅ quality_score字段已存在")
                return
        except Exception as e:
            logger.error(f"检查字段时出错: {e}")

        # 添加字段
        try:
            logger.info("正在添加quality_score字段...")
            conn.execute(text("""
                ALTER TABLE tech_cards
                ADD COLUMN quality_score REAL DEFAULT 5.0
            """))

            # 创建索引
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_quality_score
                ON tech_cards(quality_score)
            """))

            conn.commit()
            logger.info("✅ quality_score字段添加成功")
        except Exception as e:
            logger.error(f"添加字段时出错: {e}")
            raise


def calculate_existing_scores():
    """计算现有数据的质量评分"""
    db = SessionLocal()
    try:
        # 获取所有没有评分的记录
        items = db.query(TechCard).filter(
            (TechCard.quality_score == None) | (TechCard.quality_score == 5.0)
        ).all()

        logger.info(f"找到 {len(items)} 条待评分记录")

        updated_count = 0
        for item in items:
            try:
                # 准备数据
                data = {
                    'stars': item.stars or 0,
                    'description': item.summary or '',
                    'summary': item.summary or '',
                    'created_at': item.created_at,
                    'likes': 0,
                    'downloads': 0,
                    'authors': '',
                    'title': item.title or ''
                }

                # 从raw_data获取更多信息
                if item.raw_data:
                    if 'likes' in item.raw_data:
                        data['likes'] = item.raw_data.get('likes', 0)
                    if 'downloads' in item.raw_data:
                        data['downloads'] = item.raw_data.get('downloads', 0)
                    if 'author' in item.raw_data:
                        data['authors'] = item.raw_data.get('author', '')
                    if 'authors' in item.raw_data:
                        data['authors'] = item.raw_data.get('authors', '')
                    if 'comments' in item.raw_data:
                        data['comments'] = item.raw_data.get('comments', 0)
                    if 'is_premium' in item.raw_data:
                        data['is_premium'] = item.raw_data.get('is_premium', False)

                # 计算评分
                score = quality_scorer.score_item(data, item.source.value)
                item.quality_score = round(score, 2)

                updated_count += 1

                if updated_count % 100 == 0:
                    logger.info(f"已更新 {updated_count} 条记录...")
                    db.commit()

            except Exception as e:
                logger.error(f"评分失败 (ID: {item.id}): {e}")
                continue

        db.commit()
        logger.info(f"✅ 成功更新 {updated_count} 条记录的质量评分")

        # 显示统计信息
        high_quality = db.query(TechCard).filter(TechCard.quality_score >= 8.0).count()
        good_quality = db.query(TechCard).filter(
            TechCard.quality_score >= 6.0,
            TechCard.quality_score < 8.0
        ).count()
        medium_quality = db.query(TechCard).filter(
            TechCard.quality_score >= 4.0,
            TechCard.quality_score < 6.0
        ).count()
        low_quality = db.query(TechCard).filter(TechCard.quality_score < 4.0).count()

        logger.info("\n📊 质量评分统计:")
        logger.info(f"  优秀 (≥8.0): {high_quality} 条")
        logger.info(f"  良好 (6.0-8.0): {good_quality} 条")
        logger.info(f"  中等 (4.0-6.0): {medium_quality} 条")
        logger.info(f"  较低 (<4.0): {low_quality} 条")

    except Exception as e:
        logger.error(f"计算评分时出错: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("开始添加质量评分功能")
    logger.info("=" * 60)

    # 1. 添加字段
    add_quality_score_column()

    # 2. 计算现有数据的评分
    calculate_existing_scores()

    logger.info("\n" + "=" * 60)
    logger.info("质量评分功能添加完成！")
    logger.info("=" * 60)
