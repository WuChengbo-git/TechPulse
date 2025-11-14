"""
批量生成Zenn文章的AI摘要
为现有的Zenn文章生成30字和200字的AI摘要
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def generate_ai_summaries(limit: int = None, skip_existing: bool = True):
    """
    为Zenn文章生成AI摘要

    Args:
        limit: 限制处理的数量，None表示处理所有
        skip_existing: 是否跳过已有AI摘要的文章
    """
    db: Session = SessionLocal()
    scraper = ZennScraper()

    try:
        # 查询Zenn文章
        query = db.query(TechCard).filter(
            TechCard.source == 'ZENN',
            TechCard.content.isnot(None)  # 只处理有完整内容的文章
        )

        if skip_existing:
            # 跳过已有short_summary的文章
            query = query.filter(
                (TechCard.short_summary.is_(None)) |
                (TechCard.short_summary == '')
            )

        zenn_cards = query.all()
        total = len(zenn_cards)

        logger.info(f"找到 {total} 篇Zenn文章需要生成AI摘要")

        if total == 0:
            logger.info("没有需要处理的文章")
            return

        if limit:
            zenn_cards = zenn_cards[:limit]
            logger.info(f"限制处理数量为 {limit} 篇")

        success_count = 0
        failed_count = 0
        skipped_count = 0

        for i, card in enumerate(zenn_cards, 1):
            try:
                logger.info(f"[{i}/{len(zenn_cards)}] 处理: {card.title[:50]}...")

                # 检查是否有完整内容
                if not card.content or len(card.content) < 50:
                    logger.warning(f"  ⊘ 内容太短，跳过")
                    skipped_count += 1
                    continue

                # 使用AI生成多长度摘要
                summaries = await scraper.summarization_service.generate_multi_length_summaries(
                    card.content,
                    language="zh"  # 生成中文摘要
                )

                # 更新数据库
                card.short_summary = summaries["short"]  # 30字摘要
                card.summary = summaries["medium"]  # 200字摘要
                # content保持不变（完整原文）

                db.commit()
                success_count += 1

                logger.info(f"  ✓ 成功生成摘要:")
                logger.info(f"    - 短摘要 ({len(summaries['short'])}字): {summaries['short']}")
                logger.info(f"    - 中摘要 ({len(summaries['medium'])}字): {summaries['medium'][:80]}...")

                # 每5篇休息一下，避免API限流
                if i % 5 == 0:
                    logger.info(f"  暂停2秒，避免API限流...")
                    await asyncio.sleep(2)
                else:
                    await asyncio.sleep(0.5)

            except Exception as e:
                logger.error(f"  ✗ 处理失败: {e}")
                failed_count += 1
                db.rollback()
                continue

        logger.info(f"\n" + "="*60)
        logger.info(f"处理完成!")
        logger.info(f"  成功: {success_count}")
        logger.info(f"  失败: {failed_count}")
        logger.info(f"  跳过: {skipped_count}")
        logger.info(f"  总计: {len(zenn_cards)}")
        logger.info(f"="*60)

    except Exception as e:
        logger.error(f"批处理出错: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='批量生成Zenn文章AI摘要')
    parser.add_argument('--limit', type=int, default=None, help='限制处理数量（默认全部）')
    parser.add_argument('--test', action='store_true', help='测试模式，只处理5篇')
    parser.add_argument('--force', action='store_true', help='强制重新生成（包括已有摘要的）')

    args = parser.parse_args()

    limit = 5 if args.test else args.limit
    skip_existing = not args.force

    # 检查环境变量
    if not os.getenv("OPENAI_API_KEY"):
        logger.warning("警告: 未设置 OPENAI_API_KEY 环境变量")
        logger.warning("摘要功能将降级为文本截断")
        response = input("是否继续? (y/N): ")
        if response.lower() != 'y':
            logger.info("已取消")
            sys.exit(0)

    logger.info(f"开始批量生成AI摘要...")
    logger.info(f"  处理模式: {'测试' if args.test else '生产'}")
    logger.info(f"  跳过已有: {skip_existing}")
    logger.info(f"  数量限制: {limit if limit else '无限制'}")
    logger.info("")

    asyncio.run(generate_ai_summaries(limit=limit, skip_existing=skip_existing))
