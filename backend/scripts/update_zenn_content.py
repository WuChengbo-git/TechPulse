"""
更新现有Zenn文章的完整内容
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


async def update_zenn_content(limit: int = None):
    """
    更新现有Zenn文章的完整内容

    Args:
        limit: 限制更新的数量，None表示更新所有
    """
    db: Session = SessionLocal()
    scraper = ZennScraper()

    try:
        # 查询所有Zenn文章，且content字段为空
        zenn_cards = db.query(TechCard).filter(
            TechCard.source == 'ZENN',
            TechCard.content.is_(None)
        ).all()

        total = len(zenn_cards)
        logger.info(f"找到 {total} 篇Zenn文章需要更新内容")

        if limit:
            zenn_cards = zenn_cards[:limit]
            logger.info(f"限制更新数量为 {limit} 篇")

        updated_count = 0
        failed_count = 0

        for i, card in enumerate(zenn_cards, 1):
            try:
                logger.info(f"[{i}/{len(zenn_cards)}] 正在更新: {card.title[:50]}...")
                logger.info(f"  URL: {card.original_url}")

                # 获取文章完整内容并生成AI摘要
                short_summary, medium_summary, full_content = await scraper._get_article_with_ai_summary(card.original_url)

                if full_content:
                    card.content = full_content
                    card.summary = medium_summary or card.summary  # 200字AI摘要
                    card.short_summary = short_summary or (card.summary[:30] if card.summary else card.title[:30])  # 30字AI摘要

                    db.commit()
                    updated_count += 1
                    logger.info(f"  ✓ 成功更新")
                    logger.info(f"    - 内容: {len(full_content)} 字符")
                    logger.info(f"    - 短摘要: {card.short_summary[:40] if card.short_summary else 'N/A'}...")
                else:
                    logger.warning(f"  ✗ 无法获取内容")
                    failed_count += 1

                # 每5篇休息一下，避免请求过快和Ollama过载
                if i % 5 == 0:
                    logger.info(f"  暂停3秒...")
                    await asyncio.sleep(3)
                else:
                    await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"  ✗ 更新失败: {e}")
                failed_count += 1
                continue

        logger.info(f"\n更新完成!")
        logger.info(f"  成功: {updated_count}")
        logger.info(f"  失败: {failed_count}")
        logger.info(f"  总计: {len(zenn_cards)}")

    except Exception as e:
        logger.error(f"更新过程出错: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='更新Zenn文章完整内容')
    parser.add_argument('--limit', type=int, default=None, help='限制更新数量（默认全部）')
    parser.add_argument('--test', action='store_true', help='测试模式，只更新5篇')

    args = parser.parse_args()

    limit = 5 if args.test else args.limit

    asyncio.run(update_zenn_content(limit=limit))
