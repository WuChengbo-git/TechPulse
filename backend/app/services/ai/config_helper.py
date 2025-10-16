"""
AI 配置辅助函数
提供获取用户特定 AI 配置的工具函数
"""
from typing import Optional
from .azure_openai import AzureOpenAIService
import logging

logger = logging.getLogger(__name__)


def get_ai_service_for_user(user_id: Optional[int] = None) -> AzureOpenAIService:
    """
    获取针对特定用户的 AI 服务实例

    配置优先级：
    1. 用户个人配置（UserSettings）- 如果提供 user_id
    2. 全局 AI 配置（AIConfig）
    3. 环境变量配置（.env）

    Args:
        user_id: 用户ID，如果提供则使用该用户的个人配置

    Returns:
        AzureOpenAIService 实例
    """
    return AzureOpenAIService(user_id=user_id)


def check_user_ai_config(user_id: int) -> dict:
    """
    检查用户的 AI 配置状态

    Args:
        user_id: 用户ID

    Returns:
        配置状态字典
    """
    from ...core.database import SessionLocal
    from ...models.user_settings import UserSettings
    from ...models.config import AIConfig
    from ...core.config import settings

    status = {
        "user_config_exists": False,
        "global_config_exists": False,
        "env_config_exists": False,
        "active_source": None,
        "is_configured": False
    }

    try:
        db = SessionLocal()

        # 检查用户配置
        user_settings = db.query(UserSettings).filter(
            UserSettings.user_id == user_id
        ).first()

        if user_settings and user_settings.azure_api_key and user_settings.azure_endpoint:
            status["user_config_exists"] = True
            status["active_source"] = "user"
            status["is_configured"] = True
            db.close()
            return status

        # 检查全局配置
        global_config = db.query(AIConfig).filter(
            AIConfig.is_enabled == True
        ).first()

        if global_config and global_config.api_key and global_config.api_endpoint:
            status["global_config_exists"] = True
            if not status["active_source"]:
                status["active_source"] = "global"
                status["is_configured"] = True

        db.close()

        # 检查环境变量配置
        if settings.azure_openai_api_key and settings.azure_openai_endpoint:
            status["env_config_exists"] = True
            if not status["active_source"]:
                status["active_source"] = "environment"
                status["is_configured"] = True

    except Exception as e:
        logger.error(f"Error checking user AI config: {e}")

    return status


def get_active_ai_config(user_id: Optional[int] = None) -> Optional[dict]:
    """
    获取当前激活的 AI 配置信息（不包含敏感数据）

    Args:
        user_id: 用户ID

    Returns:
        配置信息字典或 None
    """
    from ...core.database import SessionLocal
    from ...models.user_settings import UserSettings
    from ...models.config import AIConfig
    from ...core.config import settings

    try:
        db = SessionLocal()

        # 1. 检查用户配置
        if user_id:
            user_settings = db.query(UserSettings).filter(
                UserSettings.user_id == user_id
            ).first()

            if user_settings and user_settings.azure_api_key and user_settings.azure_endpoint:
                db.close()
                return {
                    "source": "user",
                    "endpoint": user_settings.azure_endpoint,
                    "deployment": user_settings.azure_deployment,
                    "api_version": user_settings.azure_api_version,
                    "has_api_key": bool(user_settings.azure_api_key)
                }

        # 2. 检查全局配置
        global_config = db.query(AIConfig).filter(
            AIConfig.is_enabled == True,
            AIConfig.is_primary == True
        ).first()

        if not global_config:
            global_config = db.query(AIConfig).filter(
                AIConfig.is_enabled == True
            ).first()

        if global_config and global_config.api_key and global_config.api_endpoint:
            db.close()
            return {
                "source": "global",
                "endpoint": global_config.api_endpoint,
                "deployment": global_config.deployment_name,
                "api_version": global_config.api_version,
                "has_api_key": bool(global_config.api_key)
            }

        db.close()

        # 3. 检查环境变量配置
        if settings.azure_openai_api_key and settings.azure_openai_endpoint:
            return {
                "source": "environment",
                "endpoint": settings.azure_openai_endpoint,
                "deployment": settings.azure_openai_deployment_name,
                "api_version": settings.azure_openai_api_version,
                "has_api_key": bool(settings.azure_openai_api_key)
            }

    except Exception as e:
        logger.error(f"Error getting active AI config: {e}")

    return None
