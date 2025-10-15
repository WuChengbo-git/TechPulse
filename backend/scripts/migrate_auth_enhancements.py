#!/usr/bin/env python3
"""
Database migration script for authentication enhancements
Adds columns for OAuth, MFA, email verification, and password reset
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.core.database import engine, SessionLocal


def migrate():
    """执行数据库迁移"""
    db = SessionLocal()

    try:
        print("开始迁移数据库...")

        # 检查表是否存在
        result = db.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        ))
        if not result.fetchone():
            print("❌ users 表不存在，请先创建基础表")
            return False

        # 获取现有列
        result = db.execute(text("PRAGMA table_info(users)"))
        existing_columns = {row[1] for row in result.fetchall()}
        print(f"现有列: {existing_columns}")

        # 需要添加的新列
        new_columns = {
            'email_verified': 'BOOLEAN DEFAULT 0',
            'email_verification_token': 'VARCHAR(255)',
            'email_verification_sent_at': 'DATETIME',
            'password_reset_token': 'VARCHAR(255)',
            'password_reset_sent_at': 'DATETIME',
            'oauth_provider': 'VARCHAR(50)',
            'oauth_id': 'VARCHAR(255)',
            'mfa_enabled': 'BOOLEAN DEFAULT 0',
            'mfa_secret': 'VARCHAR(255)',
            'backup_codes': 'TEXT',  # JSON 类型在 SQLite 中是 TEXT
            'refresh_token': 'VARCHAR(500)',
            'refresh_token_expires_at': 'DATETIME',
            'password_changed_at': 'DATETIME',
        }

        # 添加缺失的列
        added_count = 0
        for column_name, column_type in new_columns.items():
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                    print(f"执行: {sql}")
                    db.execute(text(sql))
                    db.commit()
                    added_count += 1
                    print(f"✅ 添加列: {column_name}")
                except Exception as e:
                    print(f"❌ 添加列 {column_name} 失败: {e}")
                    db.rollback()
            else:
                print(f"⏭️  列已存在: {column_name}")

        # 修改 hashed_password 列为可空（OAuth 用户可能没有密码）
        # SQLite 不支持直接修改列，需要重建表
        if 'hashed_password' in existing_columns:
            print("\n检查 hashed_password 列约束...")
            # 获取表结构
            result = db.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"))
            create_sql = result.fetchone()[0]

            if 'hashed_password VARCHAR(255) NOT NULL' in create_sql or 'hashed_password VARCHAR NOT NULL' in create_sql:
                print("需要修改 hashed_password 为可空...")
                # 这是一个复杂操作，在生产环境应该使用 Alembic
                print("⚠️  警告：修改 hashed_password 需要手动操作或使用 Alembic")
                print("   建议使用: alembic revision --autogenerate -m 'add auth enhancements'")

        # 创建索引以提高查询性能
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id)",
            "CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)",
            "CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled)",
        ]

        for idx_sql in indexes:
            try:
                print(f"执行: {idx_sql}")
                db.execute(text(idx_sql))
                db.commit()
                print("✅ 索引创建成功")
            except Exception as e:
                print(f"❌ 创建索引失败: {e}")
                db.rollback()

        print(f"\n✅ 迁移完成！共添加 {added_count} 个新列")
        return True

    except Exception as e:
        print(f"❌ 迁移失败: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def verify_migration():
    """验证迁移结果"""
    db = SessionLocal()

    try:
        print("\n验证迁移结果...")
        result = db.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result.fetchall()]

        required_columns = [
            'id', 'username', 'email', 'hashed_password', 'display_name',
            'avatar_url', 'is_active', 'is_superuser', 'preferences',
            'email_verified', 'email_verification_token', 'email_verification_sent_at',
            'password_reset_token', 'password_reset_sent_at',
            'oauth_provider', 'oauth_id',
            'mfa_enabled', 'mfa_secret', 'backup_codes',
            'refresh_token', 'refresh_token_expires_at',
            'created_at', 'updated_at', 'last_login', 'password_changed_at'
        ]

        missing_columns = set(required_columns) - set(columns)
        if missing_columns:
            print(f"❌ 缺少列: {missing_columns}")
            return False

        print("✅ 所有必需的列都存在")
        print(f"总列数: {len(columns)}")
        return True

    except Exception as e:
        print(f"❌ 验证失败: {e}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("数据库迁移：认证功能增强")
    print("=" * 60)

    success = migrate()

    if success:
        verify_migration()
    else:
        print("\n迁移失败，请检查错误信息")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("迁移完成")
    print("=" * 60)
