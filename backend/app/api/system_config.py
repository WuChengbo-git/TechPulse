"""
系统配置管理 API
支持配置文件的读取、更新、重载和恢复
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from ..api.auth import get_current_user
from ..models.user import User
from ..services.config_manager import config_manager
from ..core.config import settings
import logging
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/system-config", tags=["system-config"])


class ConfigUpdate(BaseModel):
    """配置更新模型"""
    config: Dict[str, Any] = Field(..., description="配置键值对")
    apply_immediately: bool = Field(default=True, description="是否立即应用配置")


class ConfigValidationResponse(BaseModel):
    """配置验证响应"""
    valid: bool
    errors: List[str]
    warnings: List[str]


class ConfigBackupInfo(BaseModel):
    """配置备份信息"""
    filename: str
    created_at: str
    size: int


def check_admin(current_user: User = Depends(get_current_user)) -> User:
    """检查是否为管理员用户"""
    # TODO: 实现真正的管理员角色检查
    # 目前简单检查用户是否存在
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("")
async def get_system_config(
    show_sensitive: bool = False,
    current_user: User = Depends(check_admin)
):
    """
    获取系统配置

    - **show_sensitive**: 是否显示敏感信息（默认遮蔽）
    """
    try:
        if show_sensitive:
            config = config_manager.get_all()
        else:
            config = config_manager.export_safe_config()

        return {
            "config": config,
            "env_file": str(config_manager.env_file),
            "total_items": len(config)
        }
    except Exception as e:
        logger.error(f"Error getting system config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system config: {str(e)}"
        )


@router.get("/keys")
async def get_config_keys(
    current_user: User = Depends(check_admin)
):
    """获取所有可用的配置键"""
    return {
        "keys": list(config_manager.get_all().keys()),
        "sensitive_keys": config_manager.get_sensitive_keys()
    }


@router.get("/item/{key}")
async def get_config_item(
    key: str,
    current_user: User = Depends(check_admin)
):
    """获取单个配置项"""
    value = config_manager.get(key)
    if value is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Config key not found: {key}"
        )

    # 遮蔽敏感信息
    safe_value = config_manager.mask_sensitive_value(key, value)

    return {
        "key": key,
        "value": safe_value,
        "is_sensitive": key in config_manager.get_sensitive_keys()
    }


@router.put("")
async def update_system_config(
    config_update: ConfigUpdate,
    current_user: User = Depends(check_admin)
):
    """
    更新系统配置

    - 更新配置缓存
    - 保存到 .env 文件
    - 可选择立即重载应用配置
    """
    try:
        # 验证配置
        invalid_keys = []
        for key in config_update.config.keys():
            if not key.replace('_', '').isalnum() or not key.isupper():
                invalid_keys.append(key)

        if invalid_keys:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid config keys: {', '.join(invalid_keys)}"
            )

        # 更新配置
        config_manager.update(config_update.config)

        # 保存到文件
        config_manager.save(backup=True)

        # 可选：重载应用配置
        if config_update.apply_immediately:
            config_manager.reload()
            # 重新加载 settings
            reload_app_settings()

        return {
            "message": "Configuration updated successfully",
            "updated_keys": list(config_update.config.keys()),
            "applied": config_update.apply_immediately
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating system config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update config: {str(e)}"
        )


@router.post("/reload")
async def reload_config(
    current_user: User = Depends(check_admin)
):
    """重新加载配置文件"""
    try:
        config_manager.reload()
        reload_app_settings()

        return {
            "message": "Configuration reloaded successfully",
            "total_items": len(config_manager.get_all())
        }
    except Exception as e:
        logger.error(f"Error reloading config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reload config: {str(e)}"
        )


@router.post("/validate")
async def validate_config(
    current_user: User = Depends(check_admin)
):
    """验证配置有效性"""
    try:
        validation_result = config_manager.validate()
        return validation_result
    except Exception as e:
        logger.error(f"Error validating config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate config: {str(e)}"
        )


@router.post("/restore/defaults")
async def restore_defaults(
    current_user: User = Depends(check_admin)
):
    """恢复默认配置（从 .env.example）"""
    try:
        config_manager.restore_defaults()
        reload_app_settings()

        return {
            "message": "Configuration restored to defaults",
            "total_items": len(config_manager.get_all())
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error restoring defaults: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore defaults: {str(e)}"
        )


@router.get("/backups")
async def list_backups(
    current_user: User = Depends(check_admin)
):
    """列出所有配置备份"""
    try:
        backup_dir = config_manager.backup_dir
        if not backup_dir.exists():
            return {"backups": []}

        backups = []
        for backup_file in sorted(backup_dir.glob(".env.backup.*"), reverse=True):
            stat = backup_file.stat()
            backups.append({
                "filename": backup_file.name,
                "path": str(backup_file),
                "created_at": stat.st_mtime,
                "size": stat.st_size
            })

        return {"backups": backups}
    except Exception as e:
        logger.error(f"Error listing backups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list backups: {str(e)}"
        )


@router.post("/restore/backup")
async def restore_from_backup(
    backup_filename: Optional[str] = None,
    current_user: User = Depends(check_admin)
):
    """从备份恢复配置"""
    try:
        config_manager.restore_from_backup(backup_filename)
        reload_app_settings()

        return {
            "message": "Configuration restored from backup",
            "total_items": len(config_manager.get_all())
        }
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error restoring from backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore from backup: {str(e)}"
        )


def reload_app_settings():
    """重新加载应用 settings 对象"""
    try:
        # 重新加载环境变量
        from dotenv import load_dotenv
        load_dotenv(override=True)

        # 重新创建 settings 实例
        from ..core import config as config_module
        config_module.settings = config_module.Settings()

        logger.info("App settings reloaded successfully")
    except Exception as e:
        logger.error(f"Error reloading app settings: {e}")
        # 不抛出异常，因为配置文件已经更新
