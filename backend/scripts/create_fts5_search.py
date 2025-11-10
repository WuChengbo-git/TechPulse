"""
创建SQLite FTS5全文搜索表

Usage:
    python scripts/create_fts5_search.py
"""

import sqlite3
import os

def create_fts5_table():
    """创建FTS5全文搜索表"""

    db_path = os.path.join(os.path.dirname(__file__), '..', 'techpulse.db')

    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return False

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查FTS5表是否已存在
        cursor.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name='tech_cards_fts'
        """)

        if cursor.fetchone():
            print("⚠️  tech_cards_fts表已存在，先删除...")
            cursor.execute("DROP TABLE tech_cards_fts")

        # 创建FTS5虚拟表
        print("📝 创建FTS5全文搜索表...")
        cursor.execute("""
            CREATE VIRTUAL TABLE tech_cards_fts USING fts5(
                card_id UNINDEXED,
                title,
                summary,
                content,
                tags,
                tokenize='unicode61 remove_diacritics 2'
            )
        """)

        # 填充FTS5表（从现有数据）
        print("📊 填充FTS5表...")
        cursor.execute("""
            INSERT INTO tech_cards_fts(card_id, title, summary, content, tags)
            SELECT
                id,
                title,
                COALESCE(summary, ''),
                COALESCE(content, ''),
                COALESCE(json_extract(chinese_tags, '$'), '[]')
            FROM tech_cards
        """)

        rows_inserted = cursor.rowcount
        print(f"✅ 已插入 {rows_inserted} 条记录到FTS5表")

        # 创建触发器：自动同步插入
        print("🔧 创建INSERT触发器...")
        cursor.execute("""
            CREATE TRIGGER tech_cards_fts_insert
            AFTER INSERT ON tech_cards
            BEGIN
                INSERT INTO tech_cards_fts(card_id, title, summary, content, tags)
                VALUES (
                    NEW.id,
                    NEW.title,
                    COALESCE(NEW.summary, ''),
                    COALESCE(NEW.content, ''),
                    COALESCE(json_extract(NEW.chinese_tags, '$'), '[]')
                );
            END
        """)

        # 创建触发器：自动同步更新
        print("🔧 创建UPDATE触发器...")
        cursor.execute("""
            CREATE TRIGGER tech_cards_fts_update
            AFTER UPDATE ON tech_cards
            BEGIN
                UPDATE tech_cards_fts
                SET
                    title = NEW.title,
                    summary = COALESCE(NEW.summary, ''),
                    content = COALESCE(NEW.content, ''),
                    tags = COALESCE(json_extract(NEW.chinese_tags, '$'), '[]')
                WHERE card_id = NEW.id;
            END
        """)

        # 创建触发器：自动同步删除
        print("🔧 创建DELETE触发器...")
        cursor.execute("""
            CREATE TRIGGER tech_cards_fts_delete
            AFTER DELETE ON tech_cards
            BEGIN
                DELETE FROM tech_cards_fts WHERE card_id = OLD.id;
            END
        """)

        conn.commit()

        # 验证
        cursor.execute("SELECT COUNT(*) FROM tech_cards_fts")
        count = cursor.fetchone()[0]
        print(f"✅ FTS5表总记录数: {count}")

        # 测试搜索
        print("\n🔍 测试全文搜索...")
        cursor.execute("""
            SELECT card_id, title, snippet(tech_cards_fts, 1, '<b>', '</b>', '...', 50) as snippet
            FROM tech_cards_fts
            WHERE tech_cards_fts MATCH 'AI OR LLM OR GPT'
            LIMIT 3
        """)

        results = cursor.fetchall()
        if results:
            print("📋 搜索测试结果:")
            for row in results:
                print(f"  - ID: {row[0]}, 标题: {row[1][:50]}...")
        else:
            print("⚠️  未找到测试结果")

        conn.close()
        return True

    except Exception as e:
        print(f"❌ 创建失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("创建SQLite FTS5全文搜索表")
    print("=" * 60)
    success = create_fts5_table()
    print("=" * 60)
    if success:
        print("✅ FTS5全文搜索表创建成功！")
    else:
        print("❌ 创建失败！")
    print("=" * 60)
