#!/usr/bin/env python3
"""
元数据增强脚本

用于批量更新数据库中所有卡片的元数据

使用方法:
    python scripts/enrich_metadata.py --source github --limit 50
    python scripts/enrich_metadata.py --all --github-token ghp_xxxx
    python scripts/enrich_metadata.py --card-ids 1,2,3,4,5
"""

import sys
import os
import asyncio
import argparse
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.card import TechCard, SourceType
from app.services.metadata_enricher import MetadataEnricher
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def enrich_metadata(
    source: str = None,
    limit: int = None,
    card_ids: list = None,
    github_token: str = None,
    batch_size: int = 10,
    delay: float = 1.0
):
    """
    批量增强元数据

    Args:
        source: 数据源过滤 (github/arxiv/huggingface/zenn)
        limit: 最大处理数量
        card_ids: 指定卡片ID列表
        github_token: GitHub Personal Access Token
        batch_size: 批处理大小
        delay: 批次间延迟(秒)
    """
    db: Session = SessionLocal()

    try:
        # 构建查询
        query = db.query(TechCard)

        if card_ids:
            query = query.filter(TechCard.id.in_(card_ids))
            cards = query.all()
            logger.info(f"Processing {len(cards)} specified cards")
        elif source:
            try:
                source_enum = SourceType[source.upper()]
                query = query.filter(TechCard.source == source_enum)
                if limit:
                    cards = query.limit(limit).all()
                else:
                    cards = query.all()
                logger.info(f"Processing {len(cards)} {source} cards")
            except KeyError:
                logger.error(f"Invalid source: {source}. Must be one of: github, arxiv, huggingface, zenn")
                return
        else:
            if limit:
                cards = query.limit(limit).all()
            else:
                cards = query.all()
            logger.info(f"Processing {len(cards)} cards (all sources)")

        if not cards:
            logger.warning("No cards found to process")
            return

        # 创建 enricher
        enricher = MetadataEnricher(github_token=github_token)

        # 批量增强
        logger.info(f"Starting metadata enrichment with batch_size={batch_size}, delay={delay}s")
        results = await enricher.enrich_cards_batch(cards, batch_size=batch_size, delay=delay)

        # 更新数据库
        updated_count = 0
        failed_count = 0

        for card in cards:
            if card.id in results:
                metadata = results[card.id]
                try:
                    # 更新字段
                    if 'stars' in metadata:
                        old_stars = card.stars
                        card.stars = metadata['stars']
                        logger.info(f"Card {card.id}: stars {old_stars} -> {card.stars}")

                    if 'forks' in metadata:
                        old_forks = card.forks
                        card.forks = metadata['forks']
                        logger.info(f"Card {card.id}: forks {old_forks} -> {card.forks}")

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

                        # 特别处理 citations (arXiv)
                        if 'citations' in metadata['raw_data']:
                            logger.info(f"Card {card.id} ({card.source.value}): citations = {metadata['raw_data']['citations']}")

                        # 特别处理 downloads/likes (HuggingFace)
                        if 'downloads' in metadata['raw_data']:
                            logger.info(f"Card {card.id} ({card.source.value}): downloads = {metadata['raw_data']['downloads']}, likes = {metadata['raw_data'].get('likes', 0)}")

                    db.commit()
                    updated_count += 1

                    logger.info(f"✅ Updated card {card.id}: {card.title[:50]}...")

                except Exception as e:
                    logger.error(f"❌ Failed to update card {card.id}: {e}")
                    db.rollback()
                    failed_count += 1
            else:
                logger.warning(f"⚠️ No metadata found for card {card.id}: {card.title[:50]}...")
                failed_count += 1

        logger.info(f"\n{'='*60}")
        logger.info(f"Metadata enrichment completed!")
        logger.info(f"Total cards processed: {len(cards)}")
        logger.info(f"Successfully updated: {updated_count}")
        logger.info(f"Failed or no data: {failed_count}")
        logger.info(f"Success rate: {updated_count/len(cards)*100:.1f}%")
        logger.info(f"{'='*60}\n")

    except Exception as e:
        logger.error(f"Error during metadata enrichment: {e}")
        db.rollback()

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Enrich TechCard metadata from APIs")

    parser.add_argument(
        '--source',
        type=str,
        choices=['github', 'arxiv', 'huggingface', 'zenn', 'all'],
        help='Filter by data source'
    )

    parser.add_argument(
        '--limit',
        type=int,
        help='Maximum number of cards to process'
    )

    parser.add_argument(
        '--card-ids',
        type=str,
        help='Comma-separated card IDs to process (e.g., "1,2,3,4")'
    )

    parser.add_argument(
        '--github-token',
        type=str,
        help='GitHub Personal Access Token (recommended to avoid rate limits)'
    )

    parser.add_argument(
        '--batch-size',
        type=int,
        default=10,
        help='Number of cards to process in each batch (default: 10)'
    )

    parser.add_argument(
        '--delay',
        type=float,
        default=1.0,
        help='Delay between batches in seconds (default: 1.0)'
    )

    parser.add_argument(
        '--all',
        action='store_true',
        help='Process all cards (use with caution)'
    )

    args = parser.parse_args()

    # 解析 card_ids
    card_ids = None
    if args.card_ids:
        try:
            card_ids = [int(id.strip()) for id in args.card_ids.split(',')]
        except ValueError:
            logger.error("Invalid card IDs format. Use comma-separated integers (e.g., '1,2,3')")
            sys.exit(1)

    # 确定 source
    source = args.source if args.source and args.source != 'all' else None

    # 运行异步任务
    asyncio.run(enrich_metadata(
        source=source,
        limit=args.limit,
        card_ids=card_ids,
        github_token=args.github_token or os.getenv('GITHUB_TOKEN'),
        batch_size=args.batch_size,
        delay=args.delay
    ))


if __name__ == "__main__":
    main()
