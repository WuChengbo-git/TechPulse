from typing import Optional, Dict, List
from ...core.config import settings
from .azure_openai import azure_openai_service
import logging
import json

logger = logging.getLogger(__name__)


class AISummarizer:
    def __init__(self):
        self.azure_service = azure_openai_service
        if not self.azure_service.is_available():
            logger.warning("Azure OpenAI service not available")
    
    async def generate_summary(self, title: str, description: str, source_type: str = "github") -> Optional[str]:
        """
        生成详细的智能摘要，包含分类和可用性判断
        """
        if not self.azure_service.is_available():
            return None
        
        try:
            prompt = self._build_enhanced_summary_prompt(title, description, source_type)
            
            response = self.azure_service.client.chat.completions.create(
                model=settings.azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": "你是一个技术项目评估专家，专门为技术人员提供项目的详细分析、分类和可用性评估。"},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
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
        if not self.azure_service.is_available():
            return None
        
        try:
            prompt = self._build_trial_prompt(title, description, tags or [])
            
            response = self.azure_service.client.chat.completions.create(
                model=settings.azure_openai_deployment_name,
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
        if not self.azure_service.is_available():
            return []
        
        try:
            prompt = self._build_tags_prompt(title, description, source_type)
            
            response = self.azure_service.client.chat.completions.create(
                model=settings.azure_openai_deployment_name,
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
    
    def _build_enhanced_summary_prompt(self, title: str, description: str, source_type: str) -> str:
        """
        构建增强版摘要生成提示词，包含分类和可用性判断
        """
        source_context = {
            "github": "GitHub开源项目",
            "arxiv": "arXiv学术论文", 
            "huggingface": "HuggingFace模型或数据集",
            "zenn": "Zenn技术文章"
        }.get(source_type, "技术项目")
        
        return f"""
请为以下{source_context}提供详细分析，帮助技术人员快速判断其价值和可用性：

标题：{title}
描述：{description}

请按以下格式分析：

📋 **项目分类**：[确定项目类型，如：机器学习框架/Web开发工具/数据分析库/移动应用/学术研究等]

🎯 **核心功能**：[简洁描述项目的主要功能和价值，50字以内]

⚙️ **技术成熟度**：[评估：生产就绪/开发中/概念验证/学术研究]

📦 **代码完整性**：[判断：完整可用/部分实现/仅示例代码/理论描述]

🚀 **上手难度**：[评级：简单/中等/复杂，并说明原因]

💡 **学习价值**：[高/中/低，适合什么水平的开发者学习]

🔧 **实用性评分**：[1-5星，5星为最实用]

⭐ **推荐理由**：[为什么值得关注，或者需要注意什么]

请确保分析准确、实用，帮助开发者快速做出学习或使用决策。
"""
    
    def _build_summary_prompt(self, title: str, description: str, source_type: str) -> str:
        """
        构建简版摘要生成提示词（保持向后兼容）
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