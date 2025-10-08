from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from datetime import datetime
from ..core.database import Base


class AuthLog(Base):
    """认证日志模型"""
    __tablename__ = "auth_logs"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # login, register, logout
    status = Column(String(50), nullable=False)  # success, failed
    ip_address = Column(String(50))
    user_agent = Column(Text)
    error_message = Column(Text)  # 失败时的错误信息
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<AuthLog(id={self.id}, username={self.username}, action={self.action}, status={self.status})>"
