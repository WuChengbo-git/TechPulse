"""
AI摘要生成服务
使用LLM生成不同长度的文章摘要
支持 OpenAI API 和 Ollama (本地LLM)
"""
import os
import logging
from typing import Optional, Dict
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class SummarizationService:
    def __init__(self):
        """初始化摘要服务"""
        # 从环境变量获取API配置
        self.api_key = os.getenv("OPENAI_API_KEY", "ollama")  # Ollama不需要真实key
        self.api_base = os.getenv("OPENAI_API_BASE", "http://127.0.0.1:11434/v1")  # 使用127.0.0.1而不是localhost避免IPv6问题
        self.model = os.getenv("SUMMARIZATION_MODEL", "swallow-8B-Instruct-v0.3-Q4_K_M")

        # 检测是否使用Ollama
        self.use_ollama = "11434" in self.api_base or "ollama" in self.api_base.lower()

        try:
            import httpx
            # 对于本地Ollama，禁用所有代理
            if self.use_ollama:
                # 创建自定义的httpx客户端，明确禁用代理
                http_client = httpx.AsyncClient(
                    timeout=60.0,
                    transport=httpx.AsyncHTTPTransport(
                        retries=0,
                        # 明确设置不使用代理
                        proxy=None
                    )
                )
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.api_base,
                    http_client=http_client
                )
                logger.info(f"使用本地Ollama模型: {self.model}")
            else:
                self.client = AsyncOpenAI(
                    api_key=self.api_key,
                    base_url=self.api_base
                )
                logger.info(f"使用OpenAI API: {self.model}")
        except Exception as e:
            self.client = None
            logger.warning(f"初始化LLM客户端失败: {e}，摘要功能将降级为文本截断")

    async def generate_summary(
        self,
        content: str,
        max_length: int = 200,
        language: str = "zh"
    ) -> Optional[str]:
        """
        生成指定长度的摘要

        Args:
            content: 原文内容
            max_length: 最大字符数（中文字符）
            language: 目标语言 (zh/ja/en)

        Returns:
            生成的摘要，如果失败则返回None
        """
        if not self.client or not content:
            # 降级方案：直接截断
            return content[:max_length] + "..." if len(content) > max_length else content

        # 如果使用Ollama，临时清除代理环境变量
        old_proxy_vars = {}
        if self.use_ollama:
            proxy_vars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'ALL_PROXY', 'all_proxy']
            for var in proxy_vars:
                if var in os.environ:
                    old_proxy_vars[var] = os.environ[var]
                    del os.environ[var]

        try:
            # 根据目标语言和长度调整提示词
            language_map = {
                "zh": "中文",
                "ja": "日语",
                "en": "英文"
            }
            target_lang = language_map.get(language, "中文")

            system_prompt = f"""你是一个专业的技术文章摘要助手。请用{target_lang}生成简洁、准确的摘要。
摘要要求：
1. 字数限制在{max_length}字以内
2. 提取核心观点和关键信息
3. 保持专业性和可读性
4. 不要添加"本文"、"文章"等开头
5. 直接陈述内容要点"""

            user_prompt = f"请为以下技术文章生成{max_length}字以内的摘要：\n\n{content[:2000]}"

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=max_length * 2  # 为tokens预留空间
            )

            summary = response.choices[0].message.content.strip()

            # 确保不超过长度限制
            if len(summary) > max_length:
                summary = summary[:max_length] + "..."

            logger.info(f"成功生成{len(summary)}字摘要（目标{max_length}字）")
            return summary

        except Exception as e:
            logger.error(f"生成摘要失败: {e}")
            # 降级方案：返回截断的原文
            return content[:max_length] + "..." if len(content) > max_length else content
        finally:
            # 恢复代理环境变量
            if self.use_ollama:
                for var, value in old_proxy_vars.items():
                    os.environ[var] = value

    async def generate_multi_length_summaries(
        self,
        content: str,
        language: str = "zh"
    ) -> Dict[str, str]:
        """
        生成多个长度的摘要

        Args:
            content: 原文内容
            language: 目标语言

        Returns:
            包含不同长度摘要的字典：
            {
                "short": "30字摘要",
                "medium": "200字摘要",
                "full": "完整内容"
            }
        """
        # 并发生成不同长度的摘要
        short_summary = await self.generate_summary(content, max_length=30, language=language)
        medium_summary = await self.generate_summary(content, max_length=200, language=language)

        return {
            "short": short_summary,
            "medium": medium_summary,
            "full": content
        }


# 全局实例
_summarization_service = None


def get_summarization_service() -> SummarizationService:
    """获取摘要服务单例"""
    global _summarization_service
    if _summarization_service is None:
        _summarization_service = SummarizationService()
    return _summarization_service
