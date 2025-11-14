#!/usr/bin/env python3
"""
数据库迁移脚本：为data_sources表添加筛选条件字段
Migration script: Add filtering criteria fields to data_sources table
"""

import sqlite3
import sys
from pathlib import Path

# 添加backend目录到路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def migrate_database():
    """执行数据库迁移"""
    db_path = backend_dir / "techpulse.db"

    if not db_path.exists():
        print(f"❌ 数据库文件不存在: {db_path}")
        return False

    print(f"📂 连接到数据库: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # 检查列是否已存在
        cursor.execute("PRAGMA table_info(data_sources)")
        columns = [row[1] for row in cursor.fetchall()]

        print(f"📋 当前data_sources表的列: {columns}")

        # 添加新列（如果不存在）
        columns_to_add = [
            ("min_stars", "INTEGER DEFAULT 0"),
            ("min_likes", "INTEGER DEFAULT 0"),
            ("min_citations", "INTEGER DEFAULT 0"),
        ]

        for col_name, col_type in columns_to_add:
            if col_name not in columns:
                print(f"➕ 添加列: {col_name} {col_type}")
                cursor.execute(f"ALTER TABLE data_sources ADD COLUMN {col_name} {col_type}")
            else:
                print(f"✅ 列已存在: {col_name}")

        # 更新默认值：GitHub最少100星，Hugging Face和Zenn最少20赞
        print("\n🔧 设置默认筛选条件:")

        # GitHub默认100星
        cursor.execute("""
            UPDATE data_sources
            SET min_stars = 100
            WHERE name = 'github' AND (min_stars IS NULL OR min_stars = 0)
        """)
        print("  • GitHub: min_stars = 100")

        # Hugging Face默认20赞
        cursor.execute("""
            UPDATE data_sources
            SET min_likes = 20
            WHERE name = 'huggingface' AND (min_likes IS NULL OR min_likes = 0)
        """)
        print("  • Hugging Face: min_likes = 20")

        # Zenn默认20赞
        cursor.execute("""
            UPDATE data_sources
            SET min_likes = 20
            WHERE name = 'zenn' AND (min_likes IS NULL OR min_likes = 0)
        """)
        print("  • Zenn: min_likes = 20")

        # 提交更改
        conn.commit()
        print("\n✅ 数据库迁移完成!")

        # 显示当前配置
        print("\n📊 当前数据源配置:")
        cursor.execute("""
            SELECT name, is_enabled, min_stars, min_likes, min_citations
            FROM data_sources
            ORDER BY name
        """)
        for row in cursor.fetchall():
            name, enabled, stars, likes, citations = row
            status = "✓" if enabled else "✗"
            print(f"  {status} {name:15s} | stars≥{stars or 0:3d} | likes≥{likes or 0:3d} | citations≥{citations or 0:3d}")

        return True

    except Exception as e:
        print(f"\n❌ 迁移失败: {e}")
        conn.rollback()
        return False

    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 70)
    print("数据源筛选条件迁移脚本")
    print("Data Source Filtering Criteria Migration Script")
    print("=" * 70)
    print()

    success = migrate_database()
    sys.exit(0 if success else 1)
