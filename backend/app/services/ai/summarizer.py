from openai import AsyncOpenAI
from typing import Optional, Dict, List
from ...core.config import settings
import logging

logger = logging.getLogger(__name__)


class AISummarizer:
    def __init__(self):
        if settings.openai_api_key and settings.openai_api_base:
            self.client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_api_base,
                default_headers={"api-version": settings.openai_api_version}
            )
        else:
            self.client = None
            logger.warning("OpenAI API not configured")
    
    async def generate_summary(self, title: str, description: str, source_type: str = "github") -> Optional[str]:
        """
        生成中文摘要
        """
        if not self.client:
            return None
        
        try:
            prompt = self._build_summary_prompt(title, description, source_type)
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个技术内容摘要专家，专门为技术人员生成简洁、准确的中文摘要。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return None
    
    async def generate_trial_suggestion(self, title: str, description: str, tags: List[str] = None) -> Optional[str]:
        """
        生成试用建议
        """
        if not self.client:
            return None
        
        try:
            prompt = self._build_trial_prompt(title, description, tags or [])
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个技术项目试用专家，专门为开发者提供项目试用和学习建议。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.5
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating trial suggestion: {e}")
            return None
    
    async def extract_tags(self, title: str, description: str, source_type: str = "github") -> List[str]:
        """
        提取中文标签
        """
        if not self.client:
            return []
        
        try:
            prompt = self._build_tags_prompt(title, description, source_type)
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "你是一个技术内容标签提取专家，专门提取技术项目的关键标签。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.2
            )
            
            tags_text = response.choices[0].message.content.strip()
            tags = [tag.strip() for tag in tags_text.split(',') if tag.strip()]
            
            return tags[:10]
            
        except Exception as e:
            logger.error(f"Error extracting tags: {e}")
            return []
    
    def _build_summary_prompt(self, title: str, description: str, source_type: str) -> str:
        """
        构建摘要生成提示词
        """
        source_context = {
            "github": "这是一个GitHub开源项目",
            "arxiv": "这是一篇arXiv学术论文", 
            "huggingface": "这是一个HuggingFace模型或数据集"
        }.get(source_type, "这是一个技术项目")
        
        return f"""
{source_context}，请为以下内容生成一个简洁的中文摘要（不超过100字）：

标题：{title}
描述：{description}

要求：
1. 用简洁的中文描述项目的核心功能和价值
2. 突出技术特点和应用场景
3. 避免重复标题内容
4. 语言要专业但易懂
"""
    
    def _build_trial_prompt(self, title: str, description: str, tags: List[str]) -> str:
        """
        构建试用建议提示词
        """
        tags_text = "、".join(tags) if tags else "无"
        
        return f"""
针对以下技术项目，请生成具体的试用建议：

标题：{title}
描述：{description}
标签：{tags_text}

请提供：
1. 快速上手步骤（2-3步）
2. 核心功能试用方法
3. 学习建议和注意事项
4. 适合的使用场景

要求：用中文回答，内容实用具体，适合技术人员参考。
"""
    
    def _build_tags_prompt(self, title: str, description: str, source_type: str) -> str:
        """
        构建标签提取提示词
        """
        return f"""
请为以下{source_type}项目提取5-8个中文技术标签：

标题：{title}
描述：{description}

要求：
1. 标签要准确反映技术领域和应用场景
2. 使用中文，简洁明确
3. 包含技术栈、应用领域、功能特性等维度
4. 用逗号分隔，不要编号

示例格式：机器学习,自然语言处理,Python,开源工具,文本分析
"""