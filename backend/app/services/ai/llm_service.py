"""
统一的LLM服务
支持多种LLM提供商(Ollama, OpenAI, Azure OpenAI等)
"""
from typing import Optional, Dict, Any
import requests
import logging
from sqlalchemy.orm import Session
from ...core.database import get_db
from ...models.llm_provider import LLMProvider, LLMModel, ProviderCategory

logger = logging.getLogger(__name__)


class UnifiedLLMService:
    """统一的LLM服务,支持多种provider"""

    def __init__(self, user_id: Optional[int] = None, db: Optional[Session] = None):
        """
        初始化LLM服务

        Args:
            user_id: 用户ID,用于获取用户的默认provider和model
            db: 数据库会话
        """
        self.user_id = user_id
        self._db = db
        self._provider = None
        self._model = None

    @property
    def db(self) -> Session:
        """获取数据库会话"""
        if self._db is None:
            self._db = next(get_db())
        return self._db

    def get_default_provider(self) -> Optional[LLMProvider]:
        """获取用户的默认provider"""
        if self._provider is None and self.user_id:
            self._provider = self.db.query(LLMProvider).filter(
                LLMProvider.user_id == self.user_id,
                LLMProvider.is_enabled == True,
                LLMProvider.is_default == True
            ).first()
        return self._provider

    def get_default_model(self) -> Optional[LLMModel]:
        """获取用户的默认model"""
        if self._model is None:
            provider = self.get_default_provider()
            if provider:
                self._model = self.db.query(LLMModel).filter(
                    LLMModel.provider_id == provider.id,
                    LLMModel.is_enabled == True,
                    LLMModel.is_default == True
                ).first()
        return self._model

    def is_available(self) -> bool:
        """检查AI服务是否可用"""
        provider = self.get_default_provider()
        model = self.get_default_model()
        return provider is not None and model is not None

    def get_status(self) -> Dict[str, Any]:
        """获取服务状态"""
        provider = self.get_default_provider()
        model = self.get_default_model()

        return {
            "available": self.is_available(),
            "provider": {
                "name": provider.provider_name if provider else None,
                "category": provider.provider_category.value if provider else None,
                "type": provider.provider_type.value if provider else None
            } if provider else None,
            "model": {
                "name": model.model_name if model else None,
                "display_name": model.display_name if model else None
            } if model else None
        }

    def chat_completion(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> Optional[str]:
        """
        调用LLM进行对话补全

        Args:
            messages: 消息列表,格式为 [{"role": "user", "content": "..."}]
            temperature: 温度参数
            max_tokens: 最大token数
            **kwargs: 其他参数

        Returns:
            生成的文本,如果失败返回None
        """
        provider = self.get_default_provider()
        model = self.get_default_model()

        if not provider or not model:
            logger.error("No default provider or model configured")
            return None

        try:
            if provider.provider_category == ProviderCategory.OLLAMA:
                return self._call_ollama(provider, model, messages, temperature, max_tokens, **kwargs)
            elif provider.provider_category == ProviderCategory.OPENAI:
                return self._call_openai(provider, model, messages, temperature, max_tokens, **kwargs)
            elif provider.provider_category == ProviderCategory.AZURE_OPENAI:
                return self._call_azure_openai(provider, model, messages, temperature, max_tokens, **kwargs)
            else:
                logger.error(f"Unsupported provider category: {provider.provider_category}")
                return None
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            return None

    def _call_ollama(
        self,
        provider: LLMProvider,
        model: LLMModel,
        messages: list,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Optional[str]:
        """调用Ollama API"""
        base_url = provider.config.get("base_url", "http://localhost:11434")

        # Ollama API格式
        payload = {
            "model": model.model_name,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }

        # 禁用代理以直接连接本地服务
        proxies = {"http": None, "https": None}

        try:
            response = requests.post(
                f"{base_url}/api/chat",
                json=payload,
                timeout=60,
                proxies=proxies
            )
            response.raise_for_status()
            result = response.json()
            return result.get("message", {}).get("content")
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama API error: {e}")
            return None

    def _call_openai(
        self,
        provider: LLMProvider,
        model: LLMModel,
        messages: list,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Optional[str]:
        """调用OpenAI API"""
        import openai

        api_key = provider.config.get("api_key")
        base_url = provider.config.get("base_url", "https://api.openai.com/v1")

        if not api_key:
            logger.error("OpenAI API key not configured")
            return None

        try:
            client = openai.OpenAI(api_key=api_key, base_url=base_url)
            response = client.chat.completions.create(
                model=model.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None

    def _call_azure_openai(
        self,
        provider: LLMProvider,
        model: LLMModel,
        messages: list,
        temperature: float,
        max_tokens: int,
        **kwargs
    ) -> Optional[str]:
        """调用Azure OpenAI API"""
        import openai

        api_key = provider.config.get("api_key")
        endpoint = provider.config.get("endpoint")
        api_version = provider.config.get("api_version", "2024-02-15-preview")

        if not api_key or not endpoint:
            logger.error("Azure OpenAI credentials not configured")
            return None

        try:
            client = openai.AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=endpoint
            )
            response = client.chat.completions.create(
                model=model.model_name,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Azure OpenAI API error: {e}")
            return None

    def summarize(self, text: str, language: str = "ja") -> Optional[str]:
        """
        生成文本摘要

        Args:
            text: 要总结的文本
            language: 目标语言 (ja, en, zh)

        Returns:
            摘要文本
        """
        lang_names = {
            "ja": "Japanese",
            "en": "English",
            "zh": "Chinese"
        }

        lang_name = lang_names.get(language, "Japanese")

        messages = [
            {
                "role": "system",
                "content": f"You are a helpful assistant that summarizes technical content in {lang_name}."
            },
            {
                "role": "user",
                "content": f"Please summarize the following text in {lang_name}. Keep it concise (2-3 sentences):\n\n{text}"
            }
        ]

        return self.chat_completion(messages, temperature=0.3, max_tokens=500)

    def translate(self, text: str, target_language: str = "ja") -> Optional[str]:
        """
        翻译文本

        Args:
            text: 要翻译的文本
            target_language: 目标语言 (ja, en, zh)

        Returns:
            翻译后的文本
        """
        lang_names = {
            "ja": "Japanese",
            "en": "English",
            "zh": "Chinese"
        }

        lang_name = lang_names.get(target_language, "Japanese")

        messages = [
            {
                "role": "system",
                "content": f"You are a professional translator. Translate the given text to {lang_name}."
            },
            {
                "role": "user",
                "content": f"Translate to {lang_name}:\n\n{text}"
            }
        ]

        return self.chat_completion(messages, temperature=0.3, max_tokens=2000)
