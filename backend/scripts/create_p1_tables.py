#!/usr/bin/env python3
"""
创建P1功能相关表的迁移脚本

包括：
- user_behaviors - 用户行为记录
- search_history - 搜索历史
- user_recommendations - 推荐记录
"""
import sys
sys.path.insert(0, '/home/AI/TechPulse/backend')

from app.core.database import engine, Base
from app.models.behavior import UserBehavior, SearchHistory, UserRecommendation
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_p1_tables():
    """创建P1功能所需的表"""
    try:
        logger.info("Creating P1 feature tables...")

        # 创建表
        tables = [
            UserBehavior.__table__,
            SearchHistory.__table__,
            UserRecommendation.__table__
        ]

        Base.metadata.create_all(bind=engine, tables=tables)

        logger.info("✅ P1 tables created successfully!")
        logger.info(f"Created tables:")
        for table in tables:
            logger.info(f"  - {table.name}: {[c.name for c in table.columns]}")

        return True

    except Exception as e:
        logger.error(f"❌ Error creating P1 tables: {e}")
        return False


if __name__ == "__main__":
    success = create_p1_tables()
    sys.exit(0 if success else 1)
