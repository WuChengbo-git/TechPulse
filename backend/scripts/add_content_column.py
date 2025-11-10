"""
数据库迁移脚本：为tech_cards表添加content字段

Usage:
    python scripts/add_content_column.py
"""

import sqlite3
import os

def add_content_column():
    """为tech_cards表添加content字段"""

    # 数据库文件路径
    db_path = os.path.join(os.path.dirname(__file__), '..', 'techpulse.db')

    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return False

    try:
        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查content列是否已存在
        cursor.execute("PRAGMA table_info(tech_cards)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'content' in columns:
            print("✅ content字段已存在，无需添加")
            conn.close()
            return True

        # 添加content列
        print("📝 正在添加content字段...")
        cursor.execute("""
            ALTER TABLE tech_cards
            ADD COLUMN content TEXT
        """)

        conn.commit()
        print("✅ content字段添加成功！")

        # 验证
        cursor.execute("PRAGMA table_info(tech_cards)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"📊 当前tech_cards表字段: {', '.join(columns)}")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ 迁移失败: {str(e)}")
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("数据库迁移：添加content字段")
    print("=" * 50)
    success = add_content_column()
    print("=" * 50)
    if success:
        print("✅ 迁移完成！")
    else:
        print("❌ 迁移失败！")
    print("=" * 50)
