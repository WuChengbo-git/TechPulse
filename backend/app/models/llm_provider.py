"""
LLM Provider 模型配置
支持云端模型和本地模型的统一管理
"""
from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..core.database import Base


class ProviderType(str, enum.Enum):
    """提供商类型"""
    CLOUD = "cloud"      # 云端模型
    LOCAL = "local"      # 本地模型


class ProviderCategory(str, enum.Enum):
    """提供商类别"""
    # 云端提供商
    OPENAI = "openai"
    AZURE_OPENAI = "azure_openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    MISTRAL = "mistral"

    # 本地提供商
    OLLAMA = "ollama"
    LM_STUDIO = "lm_studio"
    LOCAL_AI = "local_ai"
    CUSTOM = "custom"


class LLMProvider(Base):
    """
    LLM提供商配置表
    统一管理云端和本地LLM提供商
    """
    __tablename__ = "llm_providers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)  # 用户ID

    # 基本信息
    provider_name = Column(String(100), nullable=False)  # 提供商名称（用户自定义）
    provider_type = Column(SQLEnum(ProviderType), nullable=False)  # 提供商类型：cloud/local
    provider_category = Column(SQLEnum(ProviderCategory), nullable=False)  # 提供商类别

    # 配置信息（JSON格式，根据不同提供商存储不同的配置）
    config = Column(JSON, nullable=False)  # 配置详情
    """
    config 字段结构示例：

    云端模型（OpenAI）:
    {
        "api_key": "sk-xxx",
        "base_url": "https://api.openai.com/v1",  # 可选
        "organization": "org-xxx"  # 可选
    }

    云端模型（Azure OpenAI）:
    {
        "api_key": "xxx",
        "endpoint": "https://xxx.openai.azure.com",
        "api_version": "2024-02-15-preview"
    }

    本地模型（Ollama）:
    {
        "base_url": "http://localhost:11434"
    }

    本地模型（自定义）:
    {
        "base_url": "http://localhost:8000/v1",
        "api_key": "xxx"  # 可选
    }
    """

    # 状态
    is_enabled = Column(Boolean, default=True)  # 是否启用
    is_default = Column(Boolean, default=False)  # 是否为默认提供商

    # 元数据
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 最后验证时间和状态
    last_validated_at = Column(DateTime, nullable=True)
    validation_status = Column(String(50), nullable=True)  # success, failed, not_tested


class LLMModel(Base):
    """
    LLM模型配置表
    存储每个提供商下的具体模型配置
    """
    __tablename__ = "llm_models"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, nullable=False, index=True)  # 关联的提供商ID
    user_id = Column(Integer, nullable=False, index=True)  # 用户ID

    # 模型信息
    model_name = Column(String(100), nullable=False)  # 模型名称，如 gpt-4, llama2
    display_name = Column(String(200), nullable=True)  # 显示名称（用户友好）
    model_type = Column(String(50), nullable=False)  # 模型类型：chat, completion, embedding

    # 模型参数
    max_tokens = Column(Integer, default=4096)  # 最大token数
    context_window = Column(Integer, default=4096)  # 上下文窗口大小

    # 默认参数（可选）
    default_temperature = Column(String(10), default="0.7")  # 默认温度
    default_top_p = Column(String(10), default="1.0")  # 默认top_p

    # 定价信息（可选，用于成本追踪）
    pricing = Column(JSON, nullable=True)
    """
    pricing 字段结构示例:
    {
        "input_price_per_1k": 0.03,  # 输入价格（每1K tokens）
        "output_price_per_1k": 0.06,  # 输出价格（每1K tokens）
        "currency": "USD"
    }
    """

    # 状态
    is_enabled = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)  # 是否为该提供商下的默认模型

    # 元数据
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
