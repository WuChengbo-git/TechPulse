"""
创建用户设置相关数据表

运行方式:
cd backend
python -m scripts.create_settings_tables
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.database import Base
from app.models.user_settings import UserSettings, DataSourceConfig
from app.core.config import settings


def create_tables():
    """创建用户设置表"""
    engine = create_engine(settings.database_url)

    print("开始创建用户设置相关数据表...")

    try:
        # 创建表
        UserSettings.__table__.create(bind=engine, checkfirst=True)
        print("✓ user_settings 表创建成功")

        DataSourceConfig.__table__.create(bind=engine, checkfirst=True)
        print("✓ data_source_configs 表创建成功")

        # 验证表是否创建成功
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_settings', 'data_source_configs')"
            ))
            tables = [row[0] for row in result]

            if 'user_settings' in tables and 'data_source_configs' in tables:
                print("\n✓ 所有表创建成功！")
                print("\n创建的表：")
                print("  - user_settings: 用户系统设置")
                print("  - data_source_configs: 数据源配置")
            else:
                print("\n✗ 部分表创建失败")
                print(f"已创建的表: {tables}")

    except Exception as e:
        print(f"\n✗ 创建表时出错: {e}")
        raise

    print("\n数据库迁移完成！")


if __name__ == "__main__":
    create_tables()
