"""
创建个性化推荐相关的数据表
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

# 创建数据库引擎
engine = create_engine(settings.database_url)

# SQL 语句
sql_statements = [
    # 1. 用户收藏表
    """
    CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        favorite_type VARCHAR(20) DEFAULT 'like',
        tags TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, item_id, item_type)
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_favorites_item ON user_favorites(item_id, item_type);",
    "CREATE INDEX IF NOT EXISTS idx_user_favorites_created ON user_favorites(created_at);",

    # 2. 用户行为记录表
    """
    CREATE TABLE IF NOT EXISTS user_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        action_type VARCHAR(20) NOT NULL,
        duration INTEGER,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_user_interactions_user ON user_interactions(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action_type);",
    "CREATE INDEX IF NOT EXISTS idx_user_interactions_created ON user_interactions(created_at);",

    # 3. 用户偏好标签表
    """
    CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        preference_type VARCHAR(50) NOT NULL,
        preference_value VARCHAR(100) NOT NULL,
        weight FLOAT DEFAULT 1.0,
        source VARCHAR(20) DEFAULT 'implicit',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, preference_type, preference_value)
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_preferences_type ON user_preferences(preference_type);",

    # 4. 推荐历史表
    """
    CREATE TABLE IF NOT EXISTS recommendation_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        item_type VARCHAR(20) NOT NULL,
        recommendation_score FLOAT,
        recommendation_reason TEXT,
        is_clicked BOOLEAN DEFAULT 0,
        is_liked BOOLEAN DEFAULT 0,
        shown_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        clicked_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_recommendation_user ON recommendation_history(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_recommendation_shown ON recommendation_history(shown_at);",

    # 5. 用户收藏夹表
    """
    CREATE TABLE IF NOT EXISTS user_collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        is_public BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_user_collections_user ON user_collections(user_id);",

    # 6. 收藏夹项目关联表
    """
    CREATE TABLE IF NOT EXISTS collection_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id INTEGER NOT NULL,
        favorite_id INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES user_collections(id) ON DELETE CASCADE,
        FOREIGN KEY (favorite_id) REFERENCES user_favorites(id) ON DELETE CASCADE,
        UNIQUE(collection_id, favorite_id)
    );
    """,

    # 索引
    "CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);",
]

# 修改现有表的 SQL
alter_table_statements = [
    # 给 tech_cards 表添加统计字段
    "ALTER TABLE tech_cards ADD COLUMN view_count INTEGER DEFAULT 0;",
    "ALTER TABLE tech_cards ADD COLUMN like_count INTEGER DEFAULT 0;",
    "ALTER TABLE tech_cards ADD COLUMN share_count INTEGER DEFAULT 0;",
    "ALTER TABLE tech_cards ADD COLUMN click_count INTEGER DEFAULT 0;",
    "ALTER TABLE tech_cards ADD COLUMN popularity_score FLOAT DEFAULT 0.0;",

    # 添加索引
    "CREATE INDEX IF NOT EXISTS idx_tech_cards_popularity ON tech_cards(popularity_score DESC);",
    "CREATE INDEX IF NOT EXISTS idx_tech_cards_created_desc ON tech_cards(created_at DESC);",
]


def create_tables():
    """创建个性化推荐相关的表"""
    with engine.connect() as conn:
        print("开始创建个性化推荐相关的表...")

        # 创建新表
        for sql in sql_statements:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"✓ 执行成功: {sql[:50]}...")
            except Exception as e:
                print(f"✗ 执行失败: {sql[:50]}...")
                print(f"  错误: {e}")

        print("\n开始修改现有表...")

        # 修改现有表
        for sql in alter_table_statements:
            try:
                conn.execute(text(sql))
                conn.commit()
                print(f"✓ 执行成功: {sql[:50]}...")
            except Exception as e:
                # SQLite不支持某些ALTER TABLE操作，但可以忽略已存在的列
                if "duplicate column name" in str(e).lower():
                    print(f"⚠ 列已存在，跳过: {sql[:50]}...")
                else:
                    print(f"✗ 执行失败: {sql[:50]}...")
                    print(f"  错误: {e}")

        print("\n✅ 所有表创建完成！")


if __name__ == "__main__":
    create_tables()
