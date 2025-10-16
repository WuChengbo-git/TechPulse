import json
import logging
from typing import Optional, Dict, Any, List
from openai import AzureOpenAI
from ...core.config import settings

logger = logging.getLogger(__name__)


class AzureOpenAIService:
    def __init__(self, api_key: Optional[str] = None, endpoint: Optional[str] = None,
                 api_version: Optional[str] = None, deployment_name: Optional[str] = None,
                 user_id: Optional[int] = None):
        """
        初始化Azure OpenAI服务

        Args:
            api_key: API密钥（可选）
            endpoint: API端点（可选）
            api_version: API版本（可选）
            deployment_name: 部署名称（可选）
            user_id: 用户ID（可选，用于获取用户个人配置）
        """
        self.client = None
        self.deployment_name = deployment_name
        self.user_id = user_id
        self._initialize_client(api_key, endpoint, api_version, deployment_name, user_id)

    def _initialize_client(self, api_key: Optional[str] = None, endpoint: Optional[str] = None,
                          api_version: Optional[str] = None, deployment_name: Optional[str] = None,
                          user_id: Optional[int] = None):
        """
        初始化Azure OpenAI客户端

        配置优先级（从高到低）：
        1. 直接提供的参数（用于测试）
        2. 用户个人配置（UserSettings）
        3. 全局AI配置（AIConfig）
        4. 环境变量配置（.env）
        """
        try:
            # 1. 如果提供了参数，直接使用（用于测试）
            if api_key and endpoint:
                self.client = AzureOpenAI(
                    api_key=api_key,
                    api_version=api_version or "2024-02-15-preview",
                    azure_endpoint=endpoint
                )
                self.deployment_name = deployment_name or "gpt-4o"
                logger.info("Azure OpenAI client initialized with provided credentials")
                return

            # 2. 尝试从用户配置获取（最高优先级）
            if user_id:
                try:
                    from ...core.database import SessionLocal
                    from ...models.user_settings import UserSettings

                    db = SessionLocal()
                    user_settings = db.query(UserSettings).filter(
                        UserSettings.user_id == user_id
                    ).first()

                    if user_settings and user_settings.azure_api_key and user_settings.azure_endpoint:
                        self.client = AzureOpenAI(
                            api_key=user_settings.azure_api_key,
                            api_version=user_settings.azure_api_version or "2024-02-15-preview",
                            azure_endpoint=user_settings.azure_endpoint
                        )
                        self.deployment_name = user_settings.azure_deployment or "gpt-4o"
                        logger.info(f"Azure OpenAI client initialized from user {user_id} settings")
                        db.close()
                        return
                    db.close()
                except Exception as user_error:
                    logger.debug(f"Failed to load config from user settings: {user_error}")

            # 3. 尝试从全局AI配置获取
            try:
                from ...core.database import SessionLocal
                from ...models.config import AIConfig

                db = SessionLocal()
                db_config = db.query(AIConfig).filter(
                    AIConfig.is_enabled == True,
                    AIConfig.is_primary == True
                ).first()

                if not db_config:
                    db_config = db.query(AIConfig).filter(AIConfig.is_enabled == True).first()

                if db_config and db_config.api_key and db_config.api_endpoint:
                    self.client = AzureOpenAI(
                        api_key=db_config.api_key,
                        api_version=db_config.api_version or "2024-02-15-preview",
                        azure_endpoint=db_config.api_endpoint
                    )
                    self.deployment_name = db_config.deployment_name or "gpt-4o"
                    logger.info("Azure OpenAI client initialized from global AI config")
                    db.close()
                    return
                db.close()
            except Exception as db_error:
                logger.debug(f"Failed to load config from database: {db_error}")

            # 4. 如果数据库没有配置，使用环境变量配置
            if settings.azure_openai_api_key and settings.azure_openai_endpoint:
                self.client = AzureOpenAI(
                    api_key=settings.azure_openai_api_key,
                    api_version=settings.azure_openai_api_version,
                    azure_endpoint=settings.azure_openai_endpoint
                )
                self.deployment_name = settings.azure_openai_deployment_name
                logger.info("Azure OpenAI client initialized from environment config")
            else:
                logger.warning("Azure OpenAI credentials not configured")
        except Exception as e:
            logger.error(f"Failed to initialize Azure OpenAI client: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """检查服务是否可用"""
        return self.client is not None

    def test_connection(self) -> Dict[str, Any]:
        """
        测试API连接是否正常

        Returns:
            包含测试结果的字典:
            {
                "success": bool,
                "message": str,
                "error": str (可选)
            }
        """
        if not self.client:
            return {
                "success": False,
                "message": "AI客户端未初始化",
                "error": "Client not initialized"
            }

        try:
            # 尝试进行一个简单的API调用来验证连接
            response = self.client.chat.completions.create(
                model=self.deployment_name or "gpt-4o",
                messages=[
                    {"role": "user", "content": "test"}
                ],
                max_tokens=5,
                temperature=0.3
            )

            return {
                "success": True,
                "message": "连接成功，API配置正确",
                "model": self.deployment_name or "gpt-4o"
            }

        except Exception as e:
            error_message = str(e)
            logger.error(f"Azure OpenAI connection test failed: {error_message}")

            # 提供更友好的错误信息
            if "401" in error_message or "Unauthorized" in error_message:
                user_message = "API密钥无效或已过期"
            elif "404" in error_message or "NotFound" in error_message:
                user_message = "API端点或部署名称不正确"
            elif "429" in error_message or "RateLimitExceeded" in error_message:
                user_message = "API请求频率超限，请稍后再试"
            elif "timeout" in error_message.lower():
                user_message = "连接超时，请检查网络或端点地址"
            else:
                user_message = "连接失败，请检查配置"

            return {
                "success": False,
                "message": user_message,
                "error": error_message
            }
    
    async def summarize_content(self, content: str, source_type: str = "github", language: str = "zh") -> Optional[str]:
        """
        对内容进行摘要
        
        Args:
            content: 要摘要的内容
            source_type: 来源类型 (github, arxiv, huggingface)
            language: 目标语言 (zh, ja, en)
        
        Returns:
            摘要文本
        """
        if not self.is_available():
            logger.warning("Azure OpenAI service not available")
            return None
        
        try:
            # 根据语言选择系统提示
            language_prompts = {
                "zh": "请用中文对以下内容进行简洁的摘要，突出关键技术点和应用场景：",
                "ja": "以下の内容を日本語で簡潔に要約し、主要な技術ポイントと応用シーンを強調してください：",
                "en": "Please provide a concise summary of the following content in English, highlighting key technical points and application scenarios:"
            }
            
            # 根据来源类型调整提示
            source_context = {
                "github": "这是一个GitHub项目",
                "arxiv": "这是一篇学术论文",
                "huggingface": "这是一个Hugging Face模型或数据集"
            }
            
            system_prompt = f"{language_prompts.get(language, language_prompts['zh'])}（{source_context.get(source_type, '')}）"
            
            response = self.client.chat.completions.create(
                model=self.deployment_name or settings.azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content[:4000]}  # 限制输入长度
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error summarizing content: {e}")
            return None
    
    async def translate_content(self, content: str, target_language: str = "zh") -> Optional[str]:
        """
        翻译内容
        
        Args:
            content: 要翻译的内容
            target_language: 目标语言 (zh, ja, en)
        
        Returns:
            翻译后的文本
        """
        if not self.is_available():
            logger.warning("Azure OpenAI service not available")
            return None
        
        try:
            language_names = {
                "zh": "中文",
                "ja": "日语",
                "en": "英语"
            }
            
            system_prompt = f"请将以下内容翻译成{language_names.get(target_language, '中文')}，保持原意和专业术语的准确性："
            
            response = self.client.chat.completions.create(
                model=self.deployment_name or settings.azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content[:4000]}
                ],
                max_tokens=800,
                temperature=0.2
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error translating content: {e}")
            return None
    
    async def extract_tags(self, content: str, language: str = "zh") -> List[str]:
        """
        从内容中提取标签
        
        Args:
            content: 内容
            language: 标签语言 (zh, ja, en)
        
        Returns:
            标签列表
        """
        if not self.is_available():
            logger.warning("Azure OpenAI service not available")
            return []
        
        try:
            language_prompts = {
                "zh": "请从以下内容中提取5-8个关键技术标签，用中文表示，以JSON数组格式返回：",
                "ja": "以下の内容から5-8個の主要な技術タグを日本語で抽出し、JSON配列形式で返してください：",
                "en": "Please extract 5-8 key technical tags from the following content in English, return as JSON array:"
            }
            
            system_prompt = language_prompts.get(language, language_prompts['zh'])
            
            response = self.client.chat.completions.create(
                model=self.deployment_name or settings.azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content[:3000]}
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            result = response.choices[0].message.content.strip()
            
            # 尝试解析JSON
            try:
                tags = json.loads(result)
                if isinstance(tags, list):
                    return tags[:8]  # 限制标签数量
            except json.JSONDecodeError:
                # 如果不是JSON格式，尝试简单解析
                import re
                tags = re.findall(r'"([^"]+)"', result)
                if tags:
                    return tags[:8]
            
            return []
            
        except Exception as e:
            logger.error(f"Error extracting tags: {e}")
            return []
    
    async def generate_trial_suggestion(self, content: str, language: str = "zh") -> Optional[str]:
        """
        生成试用建议
        
        Args:
            content: 项目内容
            language: 语言 (zh, ja, en)
        
        Returns:
            试用建议
        """
        if not self.is_available():
            logger.warning("Azure OpenAI service not available")
            return None
        
        try:
            language_prompts = {
                "zh": "基于以下项目信息，请提供简洁的试用建议，包括如何快速开始、主要功能测试点：",
                "ja": "以下のプロジェクト情報に基づいて、迅速な開始方法と主要機能のテストポイントを含む簡潔な試用提案を提供してください：",
                "en": "Based on the following project information, please provide concise trial suggestions including how to get started quickly and main feature testing points:"
            }
            
            system_prompt = language_prompts.get(language, language_prompts['zh'])
            
            response = self.client.chat.completions.create(
                model=self.deployment_name or settings.azure_openai_deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content[:3000]}
                ],
                max_tokens=300,
                temperature=0.4
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating trial suggestion: {e}")
            return None


# 全局实例
azure_openai_service = AzureOpenAIService()