"""
更新现有Zenn文章的摘要
"""
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

import asyncio
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.card import TechCard
from app.services.scrapers.zenn import ZennScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def update_zenn_summaries(limit: int = None):
    """
    更新现有Zenn文章的摘要

    Args:
        limit: 限制更新的数量，None表示更新所有
    """
    db: Session = SessionLocal()
    scraper = ZennScraper()

    try:
        # 查询所有Zenn文章，且summary字段较短（说明是旧的元数据格式）
        query = db.query(TechCard).filter(
            TechCard.source == 'ZENN'
        )

        # 优先更新summary较短的（可能是元数据）
        zenn_cards = query.all()

        # 筛选出需要更新的（summary为空或很短）
        cards_to_update = [
            card for card in zenn_cards
            if not card.summary or len(card.summary) < 50
        ]

        total = len(cards_to_update)
        logger.info(f"找到 {total} 篇Zenn文章需要更新摘要")

        if limit:
            cards_to_update = cards_to_update[:limit]
            logger.info(f"限制更新数量为 {limit} 篇")

        updated_count = 0
        failed_count = 0

        for i, card in enumerate(cards_to_update, 1):
            try:
                logger.info(f"[{i}/{len(cards_to_update)}] 正在更新: {card.title[:50]}...")

                # 获取文章摘要
                summary = scraper._get_article_summary(card.original_url)

                if summary:
                    card.summary = summary
                    db.commit()
                    updated_count += 1
                    logger.info(f"  ✓ 成功更新摘要 ({len(summary)} 字符)")
                else:
                    logger.warning(f"  ✗ 无法获取摘要")
                    failed_count += 1

                # 每10篇休息一下，避免请求过快
                if i % 10 == 0:
                    await asyncio.sleep(2)
                else:
                    await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"  ✗ 更新失败: {e}")
                failed_count += 1
                continue

        logger.info(f"\n更新完成!")
        logger.info(f"  成功: {updated_count}")
        logger.info(f"  失败: {failed_count}")
        logger.info(f"  总计: {len(cards_to_update)}")

    except Exception as e:
        logger.error(f"更新过程出错: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='更新Zenn文章摘要')
    parser.add_argument('--limit', type=int, default=None, help='限制更新数量（默认全部）')
    parser.add_argument('--test', action='store_true', help='测试模式，只更新5篇')

    args = parser.parse_args()

    limit = 5 if args.test else args.limit

    asyncio.run(update_zenn_summaries(limit=limit))
