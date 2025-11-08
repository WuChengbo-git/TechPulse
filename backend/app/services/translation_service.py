"""
翻译服务

支持多种翻译提供商和场景：
- OpenAI GPT (默认)
- Google Translate (可选)
- DeepL (可选)

使用场景：
- Zenn 日文文章标题/摘要翻译为中文
- 技术标签翻译
- 批量内容翻译
"""

import os
import logging
from typing import List, Optional, Dict
from enum import Enum
import httpx

logger = logging.getLogger(__name__)


class TranslationProvider(Enum):
    """翻译提供商"""
    OPENAI = "openai"
    GOOGLE = "google"
    DEEPL = "deepl"
    NONE = "none"  # 不翻译


class TranslationService:
    """统一的翻译服务"""

    def __init__(self, provider: TranslationProvider = TranslationProvider.OPENAI):
        """
        初始化翻译服务

        Args:
            provider: 翻译提供商
        """
        self.provider = provider
        self.cache: Dict[str, str] = {}  # 简单的内存缓存

        # 检查 API 密钥和配置
        if provider == TranslationProvider.OPENAI:
            # 优先使用 Azure OpenAI
            from ..core.config import settings
            self.api_key = settings.azure_openai_api_key or os.getenv("OPENAI_API_KEY")
            self.azure_endpoint = settings.azure_openai_endpoint
            self.azure_api_version = settings.azure_openai_api_version
            self.azure_deployment = settings.azure_openai_deployment_name
        elif provider == TranslationProvider.GOOGLE:
            self.api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
        elif provider == TranslationProvider.DEEPL:
            self.api_key = os.getenv("DEEPL_API_KEY")
        else:
            self.api_key = None

    async def translate(
        self,
        text: str,
        source_lang: str = "ja",
        target_lang: str = "zh-CN"
    ) -> str:
        """
        翻译单个文本

        Args:
            text: 要翻译的文本
            source_lang: 源语言 (ja/en/zh-CN)
            target_lang: 目标语言 (ja/en/zh-CN)

        Returns:
            翻译后的文本
        """
        if not text or not text.strip():
            return text

        # 检查缓存
        cache_key = f"{text}_{source_lang}_{target_lang}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        # 如果没有配置 API，返回原文
        if not self.api_key or self.provider == TranslationProvider.NONE:
            return text

        try:
            if self.provider == TranslationProvider.OPENAI:
                result = await self._translate_with_openai(text, source_lang, target_lang)
            elif self.provider == TranslationProvider.GOOGLE:
                result = await self._translate_with_google(text, source_lang, target_lang)
            elif self.provider == TranslationProvider.DEEPL:
                result = await self._translate_with_deepl(text, source_lang, target_lang)
            else:
                result = text

            # 缓存结果
            self.cache[cache_key] = result
            return result

        except Exception as e:
            logger.error(f"Translation error: {e}")
            return text  # 翻译失败时返回原文

    async def translate_batch(
        self,
        texts: List[str],
        source_lang: str = "ja",
        target_lang: str = "zh-CN"
    ) -> List[str]:
        """
        批量翻译文本

        Args:
            texts: 要翻译的文本列表
            source_lang: 源语言
            target_lang: 目标语言

        Returns:
            翻译后的文本列表
        """
        if not texts:
            return []

        # 批量翻译更高效
        results = []
        for text in texts:
            result = await self.translate(text, source_lang, target_lang)
            results.append(result)

        return results

    async def _translate_with_openai(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """使用 OpenAI API 翻译 (支持 Azure OpenAI)"""
        try:
            from openai import AsyncAzureOpenAI, AsyncOpenAI

            # 语言名称映射
            lang_names = {
                "ja": "Japanese",
                "en": "English",
                "zh-CN": "Simplified Chinese",
                "zh": "Chinese"
            }

            source_name = lang_names.get(source_lang, source_lang)
            target_name = lang_names.get(target_lang, target_lang)

            prompt = f"""Translate the following {source_name} text to {target_name}.
Keep the translation natural and preserve technical terms where appropriate.

{source_name} text:
{text}

{target_name} translation:"""

            # 使用 Azure OpenAI 或标准 OpenAI
            if hasattr(self, 'azure_endpoint') and self.azure_endpoint:
                client = AsyncAzureOpenAI(
                    api_key=self.api_key,
                    api_version=self.azure_api_version,
                    azure_endpoint=self.azure_endpoint
                )
                model = self.azure_deployment
            else:
                client = AsyncOpenAI(api_key=self.api_key)
                model = "gpt-3.5-turbo"

            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": f"You are a professional translator specializing in technical content. Translate {source_name} to {target_name}."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            translation = response.choices[0].message.content.strip()
            return translation

        except Exception as e:
            logger.error(f"OpenAI translation error: {e}")
            return text

    async def _translate_with_google(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """使用 Google Translate API 翻译"""
        try:
            # Google Translate API v2
            url = "https://translation.googleapis.com/language/translate/v2"

            params = {
                "q": text,
                "source": source_lang,
                "target": target_lang,
                "key": self.api_key,
                "format": "text"
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, params=params, timeout=10.0)
                response.raise_for_status()

                data = response.json()
                translation = data["data"]["translations"][0]["translatedText"]
                return translation

        except Exception as e:
            logger.error(f"Google Translate error: {e}")
            return text

    async def _translate_with_deepl(
        self,
        text: str,
        source_lang: str,
        target_lang: str
    ) -> str:
        """使用 DeepL API 翻译"""
        try:
            # DeepL API
            url = "https://api-free.deepl.com/v2/translate"

            # DeepL 语言代码映射
            lang_mapping = {
                "zh-CN": "ZH",
                "ja": "JA",
                "en": "EN"
            }

            data = {
                "text": [text],
                "source_lang": lang_mapping.get(source_lang, source_lang.upper()),
                "target_lang": lang_mapping.get(target_lang, target_lang.upper()),
            }

            headers = {
                "Authorization": f"DeepL-Auth-Key {self.api_key}",
                "Content-Type": "application/json"
            }

            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers, timeout=10.0)
                response.raise_for_status()

                result = response.json()
                translation = result["translations"][0]["text"]
                return translation

        except Exception as e:
            logger.error(f"DeepL translation error: {e}")
            return text

    async def translate_zenn_article(
        self,
        title: str,
        summary: Optional[str] = None
    ) -> Dict[str, str]:
        """
        翻译 Zenn 文章（日文 → 中文）

        Args:
            title: 文章标题
            summary: 文章摘要

        Returns:
            {"title": "中文标题", "summary": "中文摘要"}
        """
        result = {
            "title": await self.translate(title, "ja", "zh-CN"),
            "summary": await self.translate(summary, "ja", "zh-CN") if summary else None
        }

        return result

    def clear_cache(self):
        """清空翻译缓存"""
        self.cache.clear()
        logger.info("Translation cache cleared")


# 全局翻译服务实例
_translation_service: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    """获取全局翻译服务实例"""
    global _translation_service

    if _translation_service is None:
        # 根据环境变量选择翻译提供商
        provider_name = os.getenv("TRANSLATION_PROVIDER", "openai").lower()

        try:
            provider = TranslationProvider(provider_name)
        except ValueError:
            logger.warning(f"Unknown translation provider: {provider_name}, using OpenAI")
            provider = TranslationProvider.OPENAI

        _translation_service = TranslationService(provider=provider)
        logger.info(f"Translation service initialized with provider: {provider.value}")

    return _translation_service


# 便捷函数
async def translate_text(
    text: str,
    source_lang: str = "ja",
    target_lang: str = "zh-CN"
) -> str:
    """便捷的翻译函数"""
    service = get_translation_service()
    return await service.translate(text, source_lang, target_lang)


async def translate_zenn_content(title: str, summary: Optional[str] = None) -> Dict[str, str]:
    """便捷的 Zenn 内容翻译函数"""
    service = get_translation_service()
    return await service.translate_zenn_article(title, summary)
