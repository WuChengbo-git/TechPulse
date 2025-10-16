from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel
import json

from ..core.database import get_db
from ..models.user import User
from ..models.user_settings import UserSettings, DataSourceConfig
from ..api.auth import get_current_user
from ..services.ai.config_helper import check_user_ai_config, get_active_ai_config

router = APIRouter(prefix="/api/v1/user-settings", tags=["user-settings"])


# Pydantic 模型
class OpenAIConfig(BaseModel):
    api_key: Optional[str] = None
    model: str = 'gpt-3.5-turbo'
    base_url: Optional[str] = None
    organization: Optional[str] = None


class AzureOpenAIConfig(BaseModel):
    api_key: Optional[str] = None
    endpoint: Optional[str] = None
    deployment: Optional[str] = None
    api_version: str = '2024-02-01'


class OllamaConfig(BaseModel):
    server_url: str = 'http://localhost:11434'
    model: str = 'llama2'


class NotionConfig(BaseModel):
    api_token: Optional[str] = None
    database_id: Optional[str] = None
    sync_frequency: str = 'daily'


class PersonalizationConfig(BaseModel):
    enable_recommendation: bool = True
    recommendation_algorithm: str = 'hybrid'
    enable_behavior_tracking: bool = True
    show_recommendation_reason: bool = True
    anonymous_mode: bool = False


class UserPreferences(BaseModel):
    preferred_language: str = 'zh'
    theme_mode: str = 'light'
    items_per_page: int = 20


class UserSettingsUpdate(BaseModel):
    openai: Optional[OpenAIConfig] = None
    azure: Optional[AzureOpenAIConfig] = None
    ollama: Optional[OllamaConfig] = None
    notion: Optional[NotionConfig] = None
    personalization: Optional[PersonalizationConfig] = None
    preferences: Optional[UserPreferences] = None


class DataSourceConfigCreate(BaseModel):
    source_type: str
    enabled: bool = True
    config_data: Dict[str, Any]
    schedule_enabled: bool = False
    schedule_frequency: str = 'daily'
    schedule_time: str = '09:00'
    schedule_timezone: str = 'Asia/Tokyo'


class DataSourceConfigUpdate(BaseModel):
    enabled: Optional[bool] = None
    config_data: Optional[Dict[str, Any]] = None
    schedule_enabled: Optional[bool] = None
    schedule_frequency: Optional[str] = None
    schedule_time: Optional[str] = None
    schedule_timezone: Optional[str] = None


# 获取用户设置
@router.get("")
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有系统设置"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        # 如果用户没有设置记录，创建默认设置
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # 返回设置（隐藏敏感信息）
    return {
        "openai": {
            "api_key": "****" if settings.openai_api_key else None,
            "model": settings.openai_model,
            "base_url": settings.openai_base_url,
            "organization": settings.openai_organization
        },
        "azure": {
            "api_key": "****" if settings.azure_api_key else None,
            "endpoint": settings.azure_endpoint,
            "deployment": settings.azure_deployment,
            "api_version": settings.azure_api_version
        },
        "ollama": {
            "server_url": settings.ollama_server_url,
            "model": settings.ollama_model
        },
        "notion": {
            "api_token": "****" if settings.notion_api_token else None,
            "database_id": settings.notion_database_id,
            "sync_frequency": settings.notion_sync_frequency
        },
        "personalization": {
            "enable_recommendation": settings.enable_recommendation,
            "recommendation_algorithm": settings.recommendation_algorithm,
            "enable_behavior_tracking": settings.enable_behavior_tracking,
            "show_recommendation_reason": settings.show_recommendation_reason,
            "anonymous_mode": settings.anonymous_mode
        },
        "preferences": {
            "preferred_language": settings.preferred_language,
            "theme_mode": settings.theme_mode,
            "items_per_page": settings.items_per_page
        }
    }


# 更新用户设置
@router.put("")
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新当前用户的系统设置"""
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()

    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    # 更新OpenAI配置
    if settings_update.openai:
        if settings_update.openai.api_key and settings_update.openai.api_key != "****":
            settings.openai_api_key = settings_update.openai.api_key  # TODO: 加密存储
        settings.openai_model = settings_update.openai.model
        settings.openai_base_url = settings_update.openai.base_url
        settings.openai_organization = settings_update.openai.organization

    # 更新Azure配置
    if settings_update.azure:
        if settings_update.azure.api_key and settings_update.azure.api_key != "****":
            settings.azure_api_key = settings_update.azure.api_key  # TODO: 加密存储
        settings.azure_endpoint = settings_update.azure.endpoint
        settings.azure_deployment = settings_update.azure.deployment
        settings.azure_api_version = settings_update.azure.api_version

    # 更新Ollama配置
    if settings_update.ollama:
        settings.ollama_server_url = settings_update.ollama.server_url
        settings.ollama_model = settings_update.ollama.model

    # 更新Notion配置
    if settings_update.notion:
        if settings_update.notion.api_token and settings_update.notion.api_token != "****":
            settings.notion_api_token = settings_update.notion.api_token  # TODO: 加密存储
        settings.notion_database_id = settings_update.notion.database_id
        settings.notion_sync_frequency = settings_update.notion.sync_frequency

    # 更新个性化配置
    if settings_update.personalization:
        settings.enable_recommendation = settings_update.personalization.enable_recommendation
        settings.recommendation_algorithm = settings_update.personalization.recommendation_algorithm
        settings.enable_behavior_tracking = settings_update.personalization.enable_behavior_tracking
        settings.show_recommendation_reason = settings_update.personalization.show_recommendation_reason
        settings.anonymous_mode = settings_update.personalization.anonymous_mode

    # 更新用户偏好
    if settings_update.preferences:
        settings.preferred_language = settings_update.preferences.preferred_language
        settings.theme_mode = settings_update.preferences.theme_mode
        settings.items_per_page = settings_update.preferences.items_per_page

    db.commit()
    db.refresh(settings)

    return {"message": "Settings updated successfully"}


# 获取数据源配置
@router.get("/datasources")
async def get_datasource_configs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有数据源配置"""
    configs = db.query(DataSourceConfig).filter(
        DataSourceConfig.user_id == current_user.id
    ).all()

    result = {}
    for config in configs:
        result[config.source_type] = {
            "id": config.id,
            "enabled": config.enabled,
            "config": json.loads(config.config_data),
            "schedule": {
                "enabled": config.schedule_enabled,
                "frequency": config.schedule_frequency,
                "time": config.schedule_time,
                "timezone": config.schedule_timezone
            }
        }

    return result


# 创建或更新数据源配置
@router.post("/datasources")
async def create_or_update_datasource_config(
    config: DataSourceConfigCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建或更新数据源配置"""
    existing = db.query(DataSourceConfig).filter(
        DataSourceConfig.user_id == current_user.id,
        DataSourceConfig.source_type == config.source_type
    ).first()

    if existing:
        # 更新现有配置
        existing.enabled = config.enabled
        existing.config_data = json.dumps(config.config_data)
        existing.schedule_enabled = config.schedule_enabled
        existing.schedule_frequency = config.schedule_frequency
        existing.schedule_time = config.schedule_time
        existing.schedule_timezone = config.schedule_timezone
        db.commit()
        db.refresh(existing)
        return {"message": "Data source config updated", "id": existing.id}
    else:
        # 创建新配置
        new_config = DataSourceConfig(
            user_id=current_user.id,
            source_type=config.source_type,
            enabled=config.enabled,
            config_data=json.dumps(config.config_data),
            schedule_enabled=config.schedule_enabled,
            schedule_frequency=config.schedule_frequency,
            schedule_time=config.schedule_time,
            schedule_timezone=config.schedule_timezone
        )
        db.add(new_config)
        db.commit()
        db.refresh(new_config)
        return {"message": "Data source config created", "id": new_config.id}


# 更新特定数据源配置
@router.put("/datasources/{source_type}")
async def update_datasource_config(
    source_type: str,
    config_update: DataSourceConfigUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """更新特定数据源的配置"""
    config = db.query(DataSourceConfig).filter(
        DataSourceConfig.user_id == current_user.id,
        DataSourceConfig.source_type == source_type
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source config not found"
        )

    if config_update.enabled is not None:
        config.enabled = config_update.enabled
    if config_update.config_data is not None:
        config.config_data = json.dumps(config_update.config_data)
    if config_update.schedule_enabled is not None:
        config.schedule_enabled = config_update.schedule_enabled
    if config_update.schedule_frequency is not None:
        config.schedule_frequency = config_update.schedule_frequency
    if config_update.schedule_time is not None:
        config.schedule_time = config_update.schedule_time
    if config_update.schedule_timezone is not None:
        config.schedule_timezone = config_update.schedule_timezone

    db.commit()
    db.refresh(config)

    return {"message": "Data source config updated"}


# 删除数据源配置
@router.delete("/datasources/{source_type}")
async def delete_datasource_config(
    source_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """删除特定数据源的配置"""
    config = db.query(DataSourceConfig).filter(
        DataSourceConfig.user_id == current_user.id,
        DataSourceConfig.source_type == source_type
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source config not found"
        )

    db.delete(config)
    db.commit()

    return {"message": "Data source config deleted"}


# 检查AI配置状态
@router.get("/ai-config-status")
async def get_ai_config_status(
    current_user: User = Depends(get_current_user)
):
    """
    检查当前用户的 AI 配置状态

    返回配置来源优先级和激活的配置信息
    """
    status = check_user_ai_config(current_user.id)
    active_config = get_active_ai_config(current_user.id)

    return {
        "status": status,
        "active_config": active_config,
        "message": (
            "使用用户个人配置" if status["active_source"] == "user"
            else "使用全局AI配置" if status["active_source"] == "global"
            else "使用环境变量配置" if status["active_source"] == "environment"
            else "未配置AI模型"
        )
    }

