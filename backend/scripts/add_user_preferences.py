#!/usr/bin/env python3
"""
添加preferences字段到users表

运行方式: python scripts/add_user_preferences.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def add_preferences_column():
    """添加preferences字段到users表"""
    with engine.connect() as conn:
        # 检查字段是否已存在
        try:
            result = conn.execute(text("PRAGMA table_info(users)"))
            columns = [row[1] for row in result.fetchall()]

            if 'preferences' in columns:
                logger.info("✅ preferences字段已存在")
                return
        except Exception as e:
            logger.error(f"检查字段时出错: {e}")

        # 添加字段
        try:
            logger.info("正在添加preferences字段...")
            conn.execute(text("""
                ALTER TABLE users
                ADD COLUMN preferences JSON DEFAULT '{}'
            """))

            conn.commit()
            logger.info("✅ preferences字段添加成功")
        except Exception as e:
            logger.error(f"添加字段时出错: {e}")
            raise


if __name__ == "__main__":
    logger.info("=" * 60)
    logger.info("开始添加用户偏好设置字段")
    logger.info("=" * 60)

    add_preferences_column()

    logger.info("\n" + "=" * 60)
    logger.info("用户偏好设置字段添加完成！")
    logger.info("=" * 60)
