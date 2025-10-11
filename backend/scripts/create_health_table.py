#!/usr/bin/env python3
"""
创建数据源健康监控表的迁移脚本
"""
import sys
sys.path.insert(0, '/home/AI/TechPulse/backend')

from app.core.database import engine, Base
from app.models.config import DataSourceHealth, HealthStatus
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_health_table():
    """创建数据源健康监控表"""
    try:
        logger.info("Creating data_source_health table...")

        # 创建表
        Base.metadata.create_all(bind=engine, tables=[DataSourceHealth.__table__])

        logger.info("✅ data_source_health table created successfully!")
        logger.info(f"Table columns: {[c.name for c in DataSourceHealth.__table__.columns]}")

        return True

    except Exception as e:
        logger.error(f"❌ Error creating health table: {e}")
        return False


if __name__ == "__main__":
    success = create_health_table()
    sys.exit(0 if success else 1)
