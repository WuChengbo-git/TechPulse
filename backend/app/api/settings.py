from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from ..services.ai.azure_openai import azure_openai_service
from ..services.ai.config_helper import get_ai_service_for_user, check_user_ai_config
from ..core.config import settings
from ..models.card import TechCard
from ..models.user import User
from ..core.database import SessionLocal
from ..api.auth import get_current_user, get_current_user_optional
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class LanguageRequest(BaseModel):
    language: str  # zh, ja, en


class TranslationRequest(BaseModel):
    card_id: int
    target_language: str


class BatchTranslationRequest(BaseModel):
    card_ids: List[int]
    target_language: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/language/switch")
async def switch_language(request: LanguageRequest):
    """
    切换系统默认语言
    """
    if request.language not in ["zh", "ja", "en"]:
        raise HTTPException(status_code=400, detail="Unsupported language")
    
    # 这里可以实现系统级的语言切换逻辑
    # 由于settings是只读的，这里只返回确认信息
    return {
        "message": f"Language switched to {request.language}",
        "language": request.language,
        "supported_languages": {
            "zh": "中文",
            "ja": "日本語", 
            "en": "English"
        }
    }


@router.post("/translate/card")
async def translate_card(
    request: TranslationRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    翻译单个卡片的内容
    """
    # 获取AI服务 (优先使用用户的LLM Provider配置)
    user_id = current_user.id if current_user else None
    ai_service = get_ai_service_for_user(user_id)

    if not ai_service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Translation service not available"
        )

    if request.target_language not in ["zh", "ja", "en"]:
        raise HTTPException(status_code=400, detail="Unsupported target language")

    # 获取卡片
    card = db.query(TechCard).filter(TechCard.id == request.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    try:
        # 翻译摘要
        translated_summary = None
        if card.summary:
            # 使用新的UnifiedLLMService
            from ..services.ai.llm_service import UnifiedLLMService
            if isinstance(ai_service, UnifiedLLMService):
                translated_summary = ai_service.translate(
                    card.summary, request.target_language
                )
            else:
                # 降级到旧的azure服务
                translated_summary = await ai_service.translate_content(
                    card.summary, request.target_language
                )

        # 翻译试用建议
        translated_trial_suggestion = None
        if card.trial_suggestion:
            from ..services.ai.llm_service import UnifiedLLMService
            if isinstance(ai_service, UnifiedLLMService):
                translated_trial_suggestion = ai_service.translate(
                    card.trial_suggestion, request.target_language
                )
            else:
                translated_trial_suggestion = await ai_service.translate_content(
                    card.trial_suggestion, request.target_language
                )

        # 翻译标签
        translated_tags = []
        if card.chinese_tags:
            from ..services.ai.llm_service import UnifiedLLMService
            for tag in card.chinese_tags:
                if isinstance(ai_service, UnifiedLLMService):
                    translated_tag = ai_service.translate(
                        tag, request.target_language
                    )
                else:
                    translated_tag = await ai_service.translate_content(
                        tag, request.target_language
                    )
                if translated_tag:
                    translated_tags.append(translated_tag)
        
        return {
            "card_id": card.id,
            "title": card.title,
            "original_summary": card.summary,
            "translated_summary": translated_summary,
            "original_trial_suggestion": card.trial_suggestion,
            "translated_trial_suggestion": translated_trial_suggestion,
            "original_tags": card.chinese_tags,
            "translated_tags": translated_tags,
            "target_language": request.target_language
        }
        
    except Exception as e:
        logger.error(f"Translation failed for card {request.card_id}: {e}")
        raise HTTPException(status_code=500, detail="Translation failed")


@router.post("/translate/batch")
async def translate_batch(request: BatchTranslationRequest, db: Session = Depends(get_db)):
    """
    批量翻译多个卡片
    """
    if not azure_openai_service.is_available():
        raise HTTPException(status_code=503, detail="Translation service not available")
    
    if request.target_language not in ["zh", "ja", "en"]:
        raise HTTPException(status_code=400, detail="Unsupported target language")
    
    if len(request.card_ids) > 20:
        raise HTTPException(status_code=400, detail="Too many cards, maximum 20 allowed")
    
    # 获取卡片
    cards = db.query(TechCard).filter(TechCard.id.in_(request.card_ids)).all()
    if not cards:
        raise HTTPException(status_code=404, detail="No cards found")
    
    results = []
    
    for card in cards:
        try:
            # 翻译摘要
            translated_summary = None
            if card.summary:
                translated_summary = await azure_openai_service.translate_content(
                    card.summary, request.target_language
                )
            
            # 翻译试用建议
            translated_trial_suggestion = None
            if card.trial_suggestion:
                translated_trial_suggestion = await azure_openai_service.translate_content(
                    card.trial_suggestion, request.target_language
                )
            
            results.append({
                "card_id": card.id,
                "title": card.title,
                "translated_summary": translated_summary,
                "translated_trial_suggestion": translated_trial_suggestion,
                "status": "success"
            })
            
        except Exception as e:
            logger.error(f"Translation failed for card {card.id}: {e}")
            results.append({
                "card_id": card.id,
                "title": card.title,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "target_language": request.target_language,
        "total_cards": len(request.card_ids),
        "results": results
    }


@router.get("/languages")
async def get_supported_languages():
    """
    获取支持的语言列表
    """
    return {
        "languages": {
            "zh": {
                "name": "中文",
                "code": "zh",
                "flag": "🇨🇳"
            },
            "ja": {
                "name": "日本語",
                "code": "ja", 
                "flag": "🇯🇵"
            },
            "en": {
                "name": "English",
                "code": "en",
                "flag": "🇺🇸"
            }
        },
        "current_language": settings.default_language,
        "ai_service_available": azure_openai_service.is_available()
    }


@router.get("/status")
async def get_service_status(
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    获取服务状态 - 检查当前用户的 AI 配置

    如果用户已登录，检查用户配置
    否则检查全局配置
    """
    import logging
    logger = logging.getLogger(__name__)

    ai_available = False
    config_source = "none"
    provider_info = None

    logger.info(f"Status API called, current_user: {current_user}")

    if current_user:
        # 检查用户的 AI 配置
        user_ai_service = get_ai_service_for_user(current_user.id)
        ai_available = user_ai_service.is_available()

        if ai_available:
            # 检查是否使用新的LLM Provider系统
            from ..services.ai.llm_service import UnifiedLLMService
            if isinstance(user_ai_service, UnifiedLLMService):
                config_source = "llm_provider"
                status = user_ai_service.get_status()
                if status.get('provider'):
                    provider_info = status['provider']
            else:
                # 旧的Azure OpenAI配置
                config_status = check_user_ai_config(current_user.id)
                config_source = config_status.get("active_source", "none")
    else:
        # 未登录，使用全局配置
        ai_available = azure_openai_service.is_available()
        if ai_available:
            config_source = "global"

    response = {
        "ai_service_available": ai_available,
        "config_source": config_source,
        "translation_enabled": settings.enable_translation,
        "summarization_enabled": settings.enable_summarization,
        "default_language": settings.default_language,
        "env_configured": bool(settings.azure_openai_api_key and settings.azure_openai_endpoint)
    }

    # 如果使用LLM Provider系统,添加provider信息
    if provider_info:
        response["provider_info"] = provider_info

    return response