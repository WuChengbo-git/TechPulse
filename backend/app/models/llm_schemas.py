"""
LLM Provider 和 Model 的 Pydantic Schemas
用于API请求和响应
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum


class ProviderType(str, Enum):
    """提供商类型"""
    CLOUD = "cloud"
    LOCAL = "local"


class ProviderCategory(str, Enum):
    """提供商类别"""
    # 云端
    OPENAI = "openai"
    AZURE_OPENAI = "azure_openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    MISTRAL = "mistral"
    # 本地
    OLLAMA = "ollama"
    LM_STUDIO = "lm_studio"
    LOCAL_AI = "local_ai"
    CUSTOM = "custom"


class ModelType(str, Enum):
    """模型类型"""
    CHAT = "chat"
    COMPLETION = "completion"
    EMBEDDING = "embedding"


# ==================== Provider Schemas ====================

class ProviderConfigBase(BaseModel):
    """提供商配置基类"""
    pass


class OpenAIConfig(ProviderConfigBase):
    """OpenAI配置"""
    api_key: str = Field(..., description="OpenAI API Key")
    base_url: Optional[str] = Field(None, description="自定义API地址（可选）")
    organization: Optional[str] = Field(None, description="组织ID（可选）")


class AzureOpenAIConfig(ProviderConfigBase):
    """Azure OpenAI配置"""
    api_key: str = Field(..., description="Azure API Key")
    endpoint: str = Field(..., description="Azure端点地址")
    api_version: str = Field(default="2024-02-15-preview", description="API版本")


class AnthropicConfig(ProviderConfigBase):
    """Anthropic配置"""
    api_key: str = Field(..., description="Anthropic API Key")
    base_url: Optional[str] = Field(None, description="自定义API地址（可选）")


class OllamaConfig(ProviderConfigBase):
    """Ollama配置"""
    base_url: str = Field(default="http://localhost:11434", description="Ollama服务地址")


class CustomConfig(ProviderConfigBase):
    """自定义OpenAI兼容服务配置"""
    base_url: str = Field(..., description="服务地址")
    api_key: Optional[str] = Field(None, description="API Key（如果需要）")


class LLMProviderCreate(BaseModel):
    """创建LLM提供商"""
    provider_name: str = Field(..., description="提供商名称", max_length=100)
    provider_type: ProviderType = Field(..., description="提供商类型")
    provider_category: ProviderCategory = Field(..., description="提供商类别")
    config: Dict[str, Any] = Field(..., description="配置详情")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_default: bool = Field(default=False, description="是否为默认提供商")


class LLMProviderUpdate(BaseModel):
    """更新LLM提供商"""
    provider_name: Optional[str] = Field(None, max_length=100)
    config: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None


class LLMProviderResponse(BaseModel):
    """LLM提供商响应"""
    id: int
    user_id: int
    provider_name: str
    provider_type: ProviderType
    provider_category: ProviderCategory
    config: Dict[str, Any]  # API返回时会隐藏敏感信息
    is_enabled: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime
    last_validated_at: Optional[datetime]
    validation_status: Optional[str]

    class Config:
        from_attributes = True


# ==================== Model Schemas ====================

class PricingInfo(BaseModel):
    """定价信息"""
    input_price_per_1k: float = Field(..., description="输入价格（每1K tokens）")
    output_price_per_1k: float = Field(..., description="输出价格（每1K tokens）")
    currency: str = Field(default="USD", description="货币单位")


class LLMModelCreate(BaseModel):
    """创建LLM模型"""
    provider_id: int = Field(..., description="提供商ID")
    model_name: str = Field(..., description="模型名称", max_length=100)
    display_name: Optional[str] = Field(None, description="显示名称", max_length=200)
    model_type: ModelType = Field(default=ModelType.CHAT, description="模型类型")
    max_tokens: int = Field(default=4096, description="最大token数", ge=1)
    context_window: int = Field(default=4096, description="上下文窗口", ge=1)
    default_temperature: str = Field(default="0.7", description="默认温度")
    default_top_p: str = Field(default="1.0", description="默认top_p")
    pricing: Optional[PricingInfo] = Field(None, description="定价信息")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_default: bool = Field(default=False, description="是否为默认模型")


class LLMModelUpdate(BaseModel):
    """更新LLM模型"""
    model_name: Optional[str] = Field(None, max_length=100)
    display_name: Optional[str] = Field(None, max_length=200)
    model_type: Optional[ModelType] = None
    max_tokens: Optional[int] = Field(None, ge=1)
    context_window: Optional[int] = Field(None, ge=1)
    default_temperature: Optional[str] = None
    default_top_p: Optional[str] = None
    pricing: Optional[PricingInfo] = None
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None


class LLMModelResponse(BaseModel):
    """LLM模型响应"""
    id: int
    provider_id: int
    user_id: int
    model_name: str
    display_name: Optional[str]
    model_type: ModelType
    max_tokens: int
    context_window: int
    default_temperature: str
    default_top_p: str
    pricing: Optional[Dict[str, Any]]
    is_enabled: bool
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==================== 验证请求 ====================

class TestProviderRequest(BaseModel):
    """测试提供商连接请求"""
    provider_category: ProviderCategory = Field(..., description="提供商类别")
    config: Dict[str, Any] = Field(..., description="配置信息")
    test_model: Optional[str] = Field(None, description="用于测试的模型名称")


class TestProviderResponse(BaseModel):
    """测试提供商连接响应"""
    success: bool
    message: str
    message_code: Optional[str] = None  # 错误码用于前端国际化
    details: Optional[Dict[str, Any]] = None


# ==================== 预定义模板 ====================

class ProviderTemplate(BaseModel):
    """提供商模板"""
    category: ProviderCategory
    name: str
    type: ProviderType
    description: str
    config_fields: List[Dict[str, Any]]  # 需要配置的字段
    default_models: List[Dict[str, Any]]  # 默认支持的模型


class ProviderTemplatesResponse(BaseModel):
    """提供商模板列表响应"""
    cloud_providers: List[ProviderTemplate]
    local_providers: List[ProviderTemplate]
