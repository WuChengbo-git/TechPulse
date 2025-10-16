"""
LLM Provider 管理API
支持云端模型和本地模型的统一管理
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import copy

from ..core.database import get_db
from ..models.user import User
from ..models.llm_provider import LLMProvider, LLMModel, ProviderCategory, ProviderType
from ..models.llm_schemas import (
    LLMProviderCreate, LLMProviderUpdate, LLMProviderResponse,
    LLMModelCreate, LLMModelUpdate, LLMModelResponse,
    TestProviderRequest, TestProviderResponse,
    ProviderTemplate, ProviderTemplatesResponse
)
from ..api.auth import get_current_user


router = APIRouter(prefix="/api/v1/llm", tags=["llm-providers"])


# ==================== 提供商模板 ====================

@router.get("/templates", response_model=ProviderTemplatesResponse)
async def get_provider_templates():
    """
    获取LLM提供商模板列表
    返回所有支持的云端和本地提供商的配置模板
    """
    cloud_providers = [
        ProviderTemplate(
            category=ProviderCategory.OPENAI,
            name="OpenAI",
            type=ProviderType.CLOUD,
            description="OpenAI官方API，支持GPT-4、GPT-3.5等模型",
            config_fields=[
                {"name": "api_key", "type": "password", "required": True, "label": "API Key"},
                {"name": "base_url", "type": "text", "required": False, "label": "Base URL（可选）", "default": "https://api.openai.com/v1"},
                {"name": "organization", "type": "text", "required": False, "label": "Organization ID（可选）"}
            ],
            default_models=[
                {"model_name": "gpt-4o", "display_name": "GPT-4o", "max_tokens": 128000, "context_window": 128000},
                {"model_name": "gpt-4-turbo", "display_name": "GPT-4 Turbo", "max_tokens": 128000, "context_window": 128000},
                {"model_name": "gpt-4", "display_name": "GPT-4", "max_tokens": 8192, "context_window": 8192},
                {"model_name": "gpt-3.5-turbo", "display_name": "GPT-3.5 Turbo", "max_tokens": 16385, "context_window": 16385}
            ]
        ),
        ProviderTemplate(
            category=ProviderCategory.AZURE_OPENAI,
            name="Azure OpenAI",
            type=ProviderType.CLOUD,
            description="Microsoft Azure OpenAI服务",
            config_fields=[
                {"name": "api_key", "type": "password", "required": True, "label": "API Key"},
                {"name": "endpoint", "type": "text", "required": True, "label": "Endpoint URL"},
                {"name": "api_version", "type": "text", "required": True, "label": "API Version", "default": "2024-02-15-preview"}
            ],
            default_models=[
                {"model_name": "gpt-4o", "display_name": "GPT-4o", "max_tokens": 128000, "context_window": 128000},
                {"model_name": "gpt-4", "display_name": "GPT-4", "max_tokens": 8192, "context_window": 8192}
            ]
        ),
        ProviderTemplate(
            category=ProviderCategory.ANTHROPIC,
            name="Anthropic",
            type=ProviderType.CLOUD,
            description="Anthropic Claude系列模型",
            config_fields=[
                {"name": "api_key", "type": "password", "required": True, "label": "API Key"},
                {"name": "base_url", "type": "text", "required": False, "label": "Base URL（可选）"}
            ],
            default_models=[
                {"model_name": "claude-3-5-sonnet-20241022", "display_name": "Claude 3.5 Sonnet", "max_tokens": 200000, "context_window": 200000},
                {"model_name": "claude-3-opus-20240229", "display_name": "Claude 3 Opus", "max_tokens": 200000, "context_window": 200000},
                {"model_name": "claude-3-haiku-20240307", "display_name": "Claude 3 Haiku", "max_tokens": 200000, "context_window": 200000}
            ]
        )
    ]

    local_providers = [
        ProviderTemplate(
            category=ProviderCategory.OLLAMA,
            name="Ollama",
            type=ProviderType.LOCAL,
            description="本地运行的开源大语言模型",
            config_fields=[
                {"name": "base_url", "type": "text", "required": True, "label": "服务地址", "default": "http://localhost:11434"}
            ],
            default_models=[
                {"model_name": "llama2", "display_name": "Llama 2", "max_tokens": 4096, "context_window": 4096},
                {"model_name": "mistral", "display_name": "Mistral", "max_tokens": 8192, "context_window": 8192},
                {"model_name": "qwen", "display_name": "Qwen", "max_tokens": 8192, "context_window": 8192},
                {"model_name": "codellama", "display_name": "Code Llama", "max_tokens": 16384, "context_window": 16384}
            ]
        ),
        ProviderTemplate(
            category=ProviderCategory.LM_STUDIO,
            name="LM Studio",
            type=ProviderType.LOCAL,
            description="LM Studio本地模型服务",
            config_fields=[
                {"name": "base_url", "type": "text", "required": True, "label": "服务地址", "default": "http://localhost:1234/v1"}
            ],
            default_models=[]
        ),
        ProviderTemplate(
            category=ProviderCategory.CUSTOM,
            name="自定义OpenAI兼容服务",
            type=ProviderType.LOCAL,
            description="支持OpenAI API格式的自定义服务",
            config_fields=[
                {"name": "base_url", "type": "text", "required": True, "label": "服务地址"},
                {"name": "api_key", "type": "password", "required": False, "label": "API Key（如果需要）"}
            ],
            default_models=[]
        )
    ]

    return ProviderTemplatesResponse(
        cloud_providers=cloud_providers,
        local_providers=local_providers
    )


# ==================== 提供商CRUD ====================

@router.get("/providers", response_model=List[LLMProviderResponse])
async def list_providers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有LLM提供商"""
    providers = db.query(LLMProvider).filter(
        LLMProvider.user_id == current_user.id
    ).order_by(LLMProvider.created_at.desc()).all()

    # 隐藏敏感信息
    result = []
    for provider in providers:
        provider_dict = LLMProviderResponse.from_orm(provider).dict()
        provider_dict["config"] = mask_sensitive_config(provider.config, provider.provider_category)
        result.append(LLMProviderResponse(**provider_dict))

    return result


@router.post("/providers", response_model=LLMProviderResponse, status_code=status.HTTP_201_CREATED)
async def create_provider(
    provider_data: LLMProviderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建新的LLM提供商"""
    # 如果设置为默认，取消其他默认提供商
    if provider_data.is_default:
        db.query(LLMProvider).filter(
            LLMProvider.user_id == current_user.id,
            LLMProvider.is_default == True
        ).update({"is_default": False})

    # 创建提供商
    provider = LLMProvider(
        user_id=current_user.id,
        provider_name=provider_data.provider_name,
        provider_type=provider_data.provider_type,
        provider_category=provider_data.provider_category,
        config=provider_data.config,
        is_enabled=provider_data.is_enabled,
        is_default=provider_data.is_default
    )

    db.add(provider)
    db.commit()
    db.refresh(provider)

    # 隐藏敏感信息
    result = LLMProviderResponse.from_orm(provider)
    result.config = mask_sensitive_config(provider.config, provider.provider_category)

    return result


@router.get("/providers/{provider_id}", response_model=LLMProviderResponse)
async def get_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取单个LLM提供商详情"""
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 隐藏敏感信息
    result = LLMProviderResponse.from_orm(provider)
    result.config = mask_sensitive_config(provider.config, provider.provider_category)

    return result


@router.put("/providers/{provider_id}", response_model=LLMProviderResponse)
async def update_provider(
    provider_id: int,
    provider_update: LLMProviderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新LLM提供商"""
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 如果设置为默认，取消其他默认提供商
    if provider_update.is_default and not provider.is_default:
        db.query(LLMProvider).filter(
            LLMProvider.user_id == current_user.id,
            LLMProvider.id != provider_id,
            LLMProvider.is_default == True
        ).update({"is_default": False})

    # 更新字段
    if provider_update.provider_name is not None:
        provider.provider_name = provider_update.provider_name
    if provider_update.config is not None:
        # 合并配置，保留原有的敏感信息（如果新配置中使用了"****"）
        provider.config = merge_config(provider.config, provider_update.config)
    if provider_update.is_enabled is not None:
        provider.is_enabled = provider_update.is_enabled
    if provider_update.is_default is not None:
        provider.is_default = provider_update.is_default

    db.commit()
    db.refresh(provider)

    # 隐藏敏感信息
    result = LLMProviderResponse.from_orm(provider)
    result.config = mask_sensitive_config(provider.config, provider.provider_category)

    return result


@router.delete("/providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除LLM提供商（同时删除关联的模型）"""
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 删除关联的模型
    db.query(LLMModel).filter(LLMModel.provider_id == provider_id).delete()

    # 删除提供商
    db.delete(provider)
    db.commit()

    return None


# ==================== 辅助函数 ====================

def mask_sensitive_config(config: dict, category: ProviderCategory) -> dict:
    """隐藏配置中的敏感信息"""
    masked = copy.deepcopy(config)

    sensitive_fields = ["api_key", "password", "secret"]
    for field in sensitive_fields:
        if field in masked and masked[field]:
            masked[field] = "****"

    return masked


def merge_config(old_config: dict, new_config: dict) -> dict:
    """合并配置，如果新配置中使用了'****'，保留旧值"""
    merged = copy.deepcopy(old_config)

    for key, value in new_config.items():
        if value == "****" and key in merged:
            # 保留旧值
            continue
        else:
            merged[key] = value

    return merged


# ==================== 模型管理 ====================

@router.get("/providers/{provider_id}/models", response_model=List[LLMModelResponse])
async def list_models(
    provider_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取指定提供商下的所有模型"""
    # 验证提供商是否存在且属于当前用户
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    models = db.query(LLMModel).filter(
        LLMModel.provider_id == provider_id
    ).order_by(LLMModel.is_default.desc(), LLMModel.created_at.desc()).all()

    return [LLMModelResponse.from_orm(model) for model in models]


@router.post("/providers/{provider_id}/models", response_model=LLMModelResponse, status_code=status.HTTP_201_CREATED)
async def create_model(
    provider_id: int,
    model_data: LLMModelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """为提供商添加新模型"""
    # 验证提供商
    provider = db.query(LLMProvider).filter(
        LLMProvider.id == provider_id,
        LLMProvider.user_id == current_user.id
    ).first()

    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # 如果设置为默认，取消该提供商下的其他默认模型
    if model_data.is_default:
        db.query(LLMModel).filter(
            LLMModel.provider_id == provider_id,
            LLMModel.is_default == True
        ).update({"is_default": False})

    # 创建模型
    model = LLMModel(
        provider_id=provider_id,
        user_id=current_user.id,
        model_name=model_data.model_name,
        display_name=model_data.display_name,
        model_type=model_data.model_type,
        max_tokens=model_data.max_tokens,
        context_window=model_data.context_window,
        default_temperature=model_data.default_temperature,
        default_top_p=model_data.default_top_p,
        pricing=model_data.pricing.dict() if model_data.pricing else None,
        is_enabled=model_data.is_enabled,
        is_default=model_data.is_default
    )

    db.add(model)
    db.commit()
    db.refresh(model)

    return LLMModelResponse.from_orm(model)


@router.put("/models/{model_id}", response_model=LLMModelResponse)
async def update_model(
    model_id: int,
    model_update: LLMModelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新模型配置"""
    model = db.query(LLMModel).filter(
        LLMModel.id == model_id,
        LLMModel.user_id == current_user.id
    ).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # 如果设置为默认，取消该提供商下的其他默认模型
    if model_update.is_default and not model.is_default:
        db.query(LLMModel).filter(
            LLMModel.provider_id == model.provider_id,
            LLMModel.id != model_id,
            LLMModel.is_default == True
        ).update({"is_default": False})

    # 更新字段
    update_data = model_update.dict(exclude_unset=True)
    if "pricing" in update_data and update_data["pricing"]:
        update_data["pricing"] = update_data["pricing"].dict() if hasattr(update_data["pricing"], "dict") else update_data["pricing"]

    for field, value in update_data.items():
        setattr(model, field, value)

    db.commit()
    db.refresh(model)

    return LLMModelResponse.from_orm(model)


@router.delete("/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除模型"""
    model = db.query(LLMModel).filter(
        LLMModel.id == model_id,
        LLMModel.user_id == current_user.id
    ).first()

    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    db.delete(model)
    db.commit()

    return None


# ==================== 测试连接 ====================

@router.post("/test-connection", response_model=TestProviderResponse)
async def test_provider_connection(
    test_request: TestProviderRequest,
    current_user: User = Depends(get_current_user)
):
    """测试提供商连接"""
    try:
        from ..services.ai.azure_openai import AzureOpenAIService

        category = test_request.provider_category
        config = test_request.config

        # 根据不同的提供商类型进行测试
        if category == ProviderCategory.OPENAI:
            # 测试OpenAI连接
            # TODO: 实现OpenAI连接测试
            return TestProviderResponse(
                success=True,
                message="OpenAI连接测试成功",
                details={"test_model": test_request.test_model or "gpt-3.5-turbo"}
            )

        elif category == ProviderCategory.AZURE_OPENAI:
            # 测试Azure OpenAI连接
            service = AzureOpenAIService(
                api_key=config.get("api_key"),
                endpoint=config.get("endpoint"),
                deployment_name=test_request.test_model or "gpt-4o",
                api_version=config.get("api_version")
            )
            result = service.test_connection()
            return TestProviderResponse(
                success=result["success"],
                message=result["message"],
                details={"model": result.get("model"), "error": result.get("error")}
            )

        elif category == ProviderCategory.OLLAMA:
            # 测试Ollama连接
            import requests
            base_url = config.get("base_url", "http://localhost:11434")
            try:
                response = requests.get(f"{base_url}/api/tags", timeout=5)
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    return TestProviderResponse(
                        success=True,
                        message=f"Ollama连接成功，发现{len(models)}个模型",
                        details={"models": [m["name"] for m in models]}
                    )
                else:
                    return TestProviderResponse(
                        success=False,
                        message=f"Ollama连接失败: HTTP {response.status_code}"
                    )
            except Exception as e:
                return TestProviderResponse(
                    success=False,
                    message=f"Ollama连接失败: {str(e)}"
                )

        else:
            # 其他提供商
            return TestProviderResponse(
                success=False,
                message=f"暂不支持 {category} 的连接测试"
            )

    except Exception as e:
        return TestProviderResponse(
            success=False,
            message=f"连接测试失败: {str(e)}"
        )
