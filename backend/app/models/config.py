from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, Float, Enum
from sqlalchemy.sql import func
from ..core.database import Base
import enum


class UserConfig(Base):
    __tablename__ = "user_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    is_enabled = Column(Boolean, default=True)
    last_sync = Column(DateTime(timezone=True))
    config = Column(Text)  # 保留用于额外配置的JSON字段
    # 筛选条件字段
    min_stars = Column(Integer, default=0)  # GitHub最少星数（默认100）
    min_likes = Column(Integer, default=0)  # Hugging Face和Zenn最少点赞数（默认20）
    min_citations = Column(Integer, default=0)  # arXiv最少引用数
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AIConfig(Base):
    """AI服务配置表 - 存储Azure OpenAI等AI服务的配置"""
    __tablename__ = "ai_configs"

    id = Column(Integer, primary_key=True, index=True)
    service_type = Column(String(50), nullable=False, default="azure_openai")  # azure_openai, openai, anthropic等
    api_key = Column(String(500))  # API密钥
    api_endpoint = Column(String(500))  # API端点
    api_version = Column(String(50))  # API版本
    deployment_name = Column(String(200))  # 部署名称（Azure特有）
    embedding_deployment_name = Column(String(200))  # Embedding模型部署名称
    model_name = Column(String(200))  # 模型名称
    is_enabled = Column(Boolean, default=True)  # 是否启用
    is_primary = Column(Boolean, default=False)  # 是否为主配置
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HealthStatus(enum.Enum):
    """数据源健康状态"""
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"
    PARTIAL = "partial"


class DataSourceHealth(Base):
    """数据源健康检查记录表"""
    __tablename__ = "data_source_health"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), nullable=False, index=True)  # github, arxiv, huggingface, zenn
    check_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    status = Column(Enum(HealthStatus), nullable=False)  # 健康状态
    items_collected = Column(Integer, default=0)  # 采集到的条目数
    items_expected = Column(Integer, default=0)  # 预期采集数
    error_message = Column(Text)  # 错误信息
    duration_seconds = Column(Float)  # 执行耗时（秒）
    extra_info = Column(Text)  # 额外信息（JSON格式）