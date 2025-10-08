"""
创建认证日志表
"""
import sys
import os

# 添加父目录到路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine, Base
from app.models.auth_log import AuthLog

def create_auth_logs_table():
    """创建认证日志表"""
    print("正在创建认证日志表...")

    # 创建表
    AuthLog.__table__.create(engine, checkfirst=True)

    print("✅ 认证日志表创建成功！")

if __name__ == "__main__":
    create_auth_logs_table()
