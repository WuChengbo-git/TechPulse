#!/usr/bin/env python3
"""
创建 user_favorites 表

用于存储用户收藏的技术卡片
"""

import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy import create_engine, inspect
from app.core.database import Base, engine as db_engine
from app.core.config import settings
from app.models.user_favorite import UserFavorite
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_user_favorites_table():
    """创建 user_favorites 表"""
    try:
        engine = db_engine
        inspector = inspect(engine)

        # 检查表是否已存在
        if "user_favorites" in inspector.get_table_names():
            logger.info("✅ Table 'user_favorites' already exists")
            return True

        # 只创建 user_favorites 表
        UserFavorite.__table__.create(bind=engine)
        logger.info("✅ Successfully created 'user_favorites' table")

        # 验证表结构
        columns = inspector.get_columns("user_favorites")
        logger.info(f"Table structure:")
        for col in columns:
            logger.info(f"  - {col['name']}: {col['type']}")

        return True

    except Exception as e:
        logger.error(f"❌ Error creating user_favorites table: {e}")
        return False


if __name__ == "__main__":
    success = create_user_favorites_table()
    sys.exit(0 if success else 1)
