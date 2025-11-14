#!/usr/bin/env python3
"""
初始化数据源记录
Initialize data sources in database
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime

# 添加backend目录到路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

def init_data_sources():
    """初始化数据源记录"""
    db_path = backend_dir / "techpulse.db"

    if not db_path.exists():
        print(f"❌ 数据库文件不存在: {db_path}")
        return False

    print(f"📂 连接到数据库: {db_path}")
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    try:
        # 检查是否已有记录
        cursor.execute("SELECT COUNT(*) FROM data_sources")
        count = cursor.fetchone()[0]

        if count > 0:
            print(f"⚠️  数据源已存在 ({count} 条记录)")
            print("\n是否要重新初始化？这将删除现有配置。")
            response = input("输入 'yes' 继续: ")
            if response.lower() != 'yes':
                print("❌ 取消操作")
                return False

            cursor.execute("DELETE FROM data_sources")
            print("🗑️  已删除现有记录")

        # 插入数据源记录
        now = datetime.now().isoformat()
        data_sources = [
            ("github", 1, 100, 0, 0),      # GitHub: min 100 stars
            ("arxiv", 1, 0, 0, 0),         # arXiv: no filtering yet
            ("huggingface", 1, 0, 20, 0),  # HuggingFace: min 20 likes
            ("zenn", 1, 0, 20, 0),         # Zenn: min 20 likes
        ]

        cursor.executemany("""
            INSERT INTO data_sources
            (name, is_enabled, min_stars, min_likes, min_citations, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [(name, enabled, stars, likes, citations, now, now)
              for name, enabled, stars, likes, citations in data_sources])

        conn.commit()
        print("\n✅ 数据源初始化完成!\n")

        # 显示初始化结果
        cursor.execute("""
            SELECT id, name, is_enabled, min_stars, min_likes, min_citations
            FROM data_sources
            ORDER BY name
        """)

        print("📊 初始化的数据源:")
        print("-" * 80)
        print(f"{'ID':<5} {'Name':<15} {'Enabled':<10} {'Min Stars':<12} {'Min Likes':<12} {'Min Citations':<15}")
        print("-" * 80)

        for row in cursor.fetchall():
            id, name, enabled, stars, likes, citations = row
            status = "✓" if enabled else "✗"
            print(f"{id:<5} {name:<15} {status:<10} {stars:<12} {likes:<12} {citations:<15}")

        print("-" * 80)
        print()

        return True

    except Exception as e:
        print(f"\n❌ 初始化失败: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
        return False

    finally:
        conn.close()


if __name__ == "__main__":
    print("=" * 80)
    print("数据源初始化脚本")
    print("Data Sources Initialization Script")
    print("=" * 80)
    print()

    success = init_data_sources()
    sys.exit(0 if success else 1)
