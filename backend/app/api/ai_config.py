from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from ..core.database import get_db
from ..models.config import AIConfig
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-config", tags=["ai-config"])


class AIConfigSchema(BaseModel):
    """AI配置请求/响应模型"""
    service_type: str = "azure_openai"
    api_key: Optional[str] = None
    api_endpoint: Optional[str] = None
    api_version: Optional[str] = "2024-02-15-preview"
    deployment_name: Optional[str] = None
    embedding_deployment_name: Optional[str] = None
    model_name: Optional[str] = None
    is_enabled: bool = True

    class Config:
        from_attributes = True


class AIConfigResponse(AIConfigSchema):
    """AI配置响应模型（包含ID和时间戳）"""
    id: int
    is_primary: bool
    created_at: str
    updated_at: str


@router.get("/", response_model=AIConfigResponse)
async def get_ai_config(db: Session = Depends(get_db)):
    """
    获取当前启用的AI配置
    """
    try:
        # 获取主配置或第一个启用的配置
        config = db.query(AIConfig).filter(
            AIConfig.is_enabled == True,
            AIConfig.is_primary == True
        ).first()

        if not config:
            # 如果没有主配置，获取任意一个启用的配置
            config = db.query(AIConfig).filter(
                AIConfig.is_enabled == True
            ).first()

        if not config:
            # 如果数据库中没有配置，返回空配置
            raise HTTPException(status_code=404, detail="No AI configuration found")

        return AIConfigResponse(
            id=config.id,
            service_type=config.service_type,
            api_key=config.api_key if config.api_key else None,
            api_endpoint=config.api_endpoint,
            api_version=config.api_version,
            deployment_name=config.deployment_name,
            embedding_deployment_name=config.embedding_deployment_name,
            model_name=config.model_name,
            is_enabled=config.is_enabled,
            is_primary=config.is_primary,
            created_at=config.created_at.isoformat() if config.created_at else "",
            updated_at=config.updated_at.isoformat() if config.updated_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting AI config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=AIConfigResponse)
async def save_ai_config(config_data: AIConfigSchema, db: Session = Depends(get_db)):
    """
    保存或更新AI配置
    """
    try:
        # 查找现有的主配置
        existing_config = db.query(AIConfig).filter(
            AIConfig.service_type == config_data.service_type,
            AIConfig.is_primary == True
        ).first()

        if existing_config:
            # 更新现有配置
            existing_config.api_key = config_data.api_key
            existing_config.api_endpoint = config_data.api_endpoint
            existing_config.api_version = config_data.api_version
            existing_config.deployment_name = config_data.deployment_name
            existing_config.embedding_deployment_name = config_data.embedding_deployment_name
            existing_config.model_name = config_data.model_name
            existing_config.is_enabled = config_data.is_enabled

            db.commit()
            db.refresh(existing_config)
            config = existing_config
        else:
            # 创建新配置
            # 如果是第一个配置，自动设为主配置
            is_first = db.query(AIConfig).count() == 0

            new_config = AIConfig(
                service_type=config_data.service_type,
                api_key=config_data.api_key,
                api_endpoint=config_data.api_endpoint,
                api_version=config_data.api_version,
                deployment_name=config_data.deployment_name,
                embedding_deployment_name=config_data.embedding_deployment_name,
                model_name=config_data.model_name,
                is_enabled=config_data.is_enabled,
                is_primary=is_first
            )

            db.add(new_config)
            db.commit()
            db.refresh(new_config)
            config = new_config

        logger.info(f"AI config saved: {config_data.service_type}")

        return AIConfigResponse(
            id=config.id,
            service_type=config.service_type,
            api_key=config.api_key if config.api_key else None,
            api_endpoint=config.api_endpoint,
            api_version=config.api_version,
            deployment_name=config.deployment_name,
            embedding_deployment_name=config.embedding_deployment_name,
            model_name=config.model_name,
            is_enabled=config.is_enabled,
            is_primary=config.is_primary,
            created_at=config.created_at.isoformat() if config.created_at else "",
            updated_at=config.updated_at.isoformat() if config.updated_at else ""
        )
    except Exception as e:
        logger.error(f"Error saving AI config: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test")
async def test_ai_config(config_data: AIConfigSchema):
    """
    测试AI配置是否可用
    """
    try:
        from ..services.ai.azure_openai import AzureOpenAIService

        # 创建临时服务实例进行测试
        test_service = AzureOpenAIService(
            api_key=config_data.api_key,
            endpoint=config_data.api_endpoint,
            api_version=config_data.api_version,
            deployment_name=config_data.deployment_name or "gpt-4o"
        )

        # 测试简单的API调用
        test_result = await test_service.summarize_content(
            "This is a test message to verify the API configuration.",
            source_type="test",
            target_language="zh"
        )

        if test_result:
            return {
                "success": True,
                "message": "AI配置测试成功！API连接正常。",
                "test_response": test_result[:100] + "..." if len(test_result) > 100 else test_result
            }
        else:
            return {
                "success": False,
                "message": "AI配置测试失败：无法获取响应"
            }
    except Exception as e:
        logger.error(f"AI config test failed: {e}")
        return {
            "success": False,
            "message": f"AI配置测试失败：{str(e)}"
        }


@router.delete("/{config_id}")
async def delete_ai_config(config_id: int, db: Session = Depends(get_db)):
    """
    删除AI配置
    """
    try:
        config = db.query(AIConfig).filter(AIConfig.id == config_id).first()

        if not config:
            raise HTTPException(status_code=404, detail="Configuration not found")

        # 不允许删除主配置（如果还有其他配置）
        if config.is_primary:
            other_configs = db.query(AIConfig).filter(AIConfig.id != config_id).count()
            if other_configs > 0:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete primary configuration. Set another config as primary first."
                )

        db.delete(config)
        db.commit()

        return {"message": "Configuration deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting AI config: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
