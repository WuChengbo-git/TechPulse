from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import requests
from bs4 import BeautifulSoup
import logging
from ..services.ai.azure_openai import azure_openai_service
from ..services.ai.config_helper import get_ai_service_for_user
from ..core.config import settings
from ..api.auth import get_current_user
from ..models.user import User
import re
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


class URLAnalysisRequest(BaseModel):
    url: HttpUrl
    custom_prompt: Optional[str] = None


class URLAnalysisResponse(BaseModel):
    url: str
    title: str
    content_summary: str
    key_points: List[str]
    analysis: str
    tags: List[str]
    content_type: str
    error: Optional[str] = None


class ChatMessage(BaseModel):
    message: str
    context_url: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[str]] = None
    suggestions: Optional[List[str]] = None


class WebContentExtractor:
    """网页内容提取器"""
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    def extract_content(self, url: str) -> Dict[str, Any]:
        """提取网页内容"""
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 移除脚本和样式
            for script in soup(["script", "style"]):
                script.decompose()
            
            # 提取标题
            title = ""
            if soup.title:
                title = soup.title.string.strip()
            elif soup.find('h1'):
                title = soup.find('h1').get_text().strip()
            
            # 提取主要内容
            content = ""
            
            # 尝试不同的内容选择器
            content_selectors = [
                'article', 'main', '.content', '.post', '.entry',
                '[role="main"]', '.article-content', '.post-content'
            ]
            
            for selector in content_selectors:
                content_elem = soup.select_one(selector)
                if content_elem:
                    content = content_elem.get_text(separator='\n', strip=True)
                    break
            
            # 如果没有找到特定容器，使用body
            if not content:
                content = soup.body.get_text(separator='\n', strip=True) if soup.body else ""
            
            # 清理内容
            content = self._clean_content(content)
            
            # 检测内容类型
            content_type = self._detect_content_type(url, title, content)
            
            # 提取关键信息
            metadata = self._extract_metadata(soup)
            
            return {
                'title': title,
                'content': content[:5000],  # 限制内容长度
                'content_type': content_type,
                'metadata': metadata,
                'url': url
            }
            
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {e}")
            raise HTTPException(status_code=400, detail=f"无法提取网页内容: {str(e)}")
    
    def _clean_content(self, content: str) -> str:
        """清理文本内容"""
        # 移除多余的空白行
        content = re.sub(r'\n\s*\n', '\n\n', content)
        # 移除行首行尾空格
        content = '\n'.join(line.strip() for line in content.split('\n'))
        # 限制连续空行
        content = re.sub(r'\n{3,}', '\n\n', content)
        return content.strip()
    
    def _detect_content_type(self, url: str, title: str, content: str) -> str:
        """检测内容类型"""
        url_lower = url.lower()
        title_lower = title.lower()
        content_lower = content.lower()
        
        # GitHub检测
        if 'github.com' in url_lower:
            return 'github_repository'
        
        # 技术博客检测
        blog_indicators = ['blog', 'article', 'post', 'tutorial']
        if any(indicator in url_lower for indicator in blog_indicators):
            return 'tech_blog'
        
        # 文档检测
        doc_indicators = ['docs', 'documentation', 'manual', 'guide']
        if any(indicator in url_lower for indicator in doc_indicators):
            return 'documentation'
        
        # 学术论文检测
        if 'arxiv.org' in url_lower or 'paper' in title_lower:
            return 'academic_paper'
        
        # 新闻检测
        news_indicators = ['news', '新闻', 'report', 'announcement']
        if any(indicator in title_lower for indicator in news_indicators):
            return 'news'
        
        # 技术内容检测
        tech_keywords = ['api', 'code', 'programming', 'development', 'framework', 'library']
        if any(keyword in content_lower for keyword in tech_keywords):
            return 'technical_content'
        
        return 'general_web_page'
    
    def _extract_metadata(self, soup: BeautifulSoup) -> Dict[str, str]:
        """提取网页元数据"""
        metadata = {}
        
        # 提取description
        description_meta = soup.find('meta', attrs={'name': 'description'}) or \
                          soup.find('meta', attrs={'property': 'og:description'})
        if description_meta:
            metadata['description'] = description_meta.get('content', '')
        
        # 提取keywords
        keywords_meta = soup.find('meta', attrs={'name': 'keywords'})
        if keywords_meta:
            metadata['keywords'] = keywords_meta.get('content', '')
        
        # 提取author
        author_meta = soup.find('meta', attrs={'name': 'author'})
        if author_meta:
            metadata['author'] = author_meta.get('content', '')
        
        return metadata


# 全局实例
web_extractor = WebContentExtractor()


@router.post("/analyze-url", response_model=URLAnalysisResponse)
async def analyze_url(
    request: URLAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    分析网页URL，提取内容并进行AI分析
    使用当前用户的AI配置（如果有）
    """
    try:
        # 获取用户的AI服务实例
        user_ai_service = get_ai_service_for_user(current_user.id)

        # 提取网页内容
        extracted_data = web_extractor.extract_content(str(request.url))

        if not user_ai_service.is_available():
            raise HTTPException(status_code=503, detail="AI服务不可用，请在设置中配置您的AI模型")
        
        # 准备分析内容
        analysis_content = f"""
        标题: {extracted_data['title']}
        网址: {extracted_data['url']}
        内容类型: {extracted_data['content_type']}
        内容: {extracted_data['content'][:3000]}
        """
        
        # 自定义分析提示词
        if request.custom_prompt:
            analysis_prompt = f"{request.custom_prompt}\n\n基于以下网页内容进行分析:\n{analysis_content}"
        else:
            analysis_prompt = f"""
            请对以下网页内容进行详细分析：
            
            {analysis_content}
            
            请按以下格式提供分析：
            
            📝 **内容摘要** (50-100字简洁概括)
            
            🔍 **关键要点** (3-5个要点，每个要点一行)
            - 要点1
            - 要点2
            - 要点3
            
            💡 **深度分析** (详细分析内容价值、技术深度、实用性等)
            
            🏷️ **相关标签** (5-8个标签，如：技术栈、应用场景、难度等)
            
            ⭐ **推荐指数** (1-5星，说明推荐理由)
            """
        
        # 调用AI分析（使用用户的AI服务）
        analysis_result = await user_ai_service.summarize_content(
            analysis_prompt,
            extracted_data['content_type'],
            settings.default_language
        )

        # 提取标签
        tags = await user_ai_service.extract_tags(
            analysis_content,
            settings.default_language
        )
        
        # 解析关键要点
        key_points = []
        if analysis_result:
            # 尝试从分析结果中提取要点
            lines = analysis_result.split('\n')
            in_key_points = False
            for line in lines:
                line = line.strip()
                if '关键要点' in line or '要点' in line:
                    in_key_points = True
                    continue
                elif line.startswith('-') and in_key_points:
                    key_points.append(line[1:].strip())
                elif line.startswith('💡') or line.startswith('🏷️'):
                    in_key_points = False
        
        # 如果没有解析到要点，生成默认要点
        if not key_points:
            key_points = [
                f"网页类型: {extracted_data['content_type']}",
                f"内容长度: {len(extracted_data['content'])} 字符",
                "需要进一步分析"
            ]
        
        return URLAnalysisResponse(
            url=str(request.url),
            title=extracted_data['title'],
            content_summary=analysis_result or "AI分析暂时不可用",
            key_points=key_points[:5],  # 限制要点数量
            analysis=analysis_result or "AI分析暂时不可用",
            tags=tags or ['网页内容'],
            content_type=extracted_data['content_type']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing URL {request.url}: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {str(e)}")


@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    """
    与AI聊天，支持基于网页内容的问答
    使用当前用户的AI配置（如果有）
    """
    try:
        # 获取用户的AI服务实例
        user_ai_service = get_ai_service_for_user(current_user.id)

        if not user_ai_service.is_available():
            raise HTTPException(status_code=503, detail="AI服务不可用，请在设置中配置您的AI模型")
        
        # 准备对话上下文
        context = ""
        if request.context_url:
            try:
                # 如果有上下文URL，先提取内容
                extracted_data = web_extractor.extract_content(request.context_url)
                context = f"""
                参考网页: {extracted_data['title']}
                网址: {extracted_data['url']}
                内容摘要: {extracted_data['content'][:1500]}
                """
            except Exception as e:
                logger.warning(f"Failed to extract context from URL {request.context_url}: {e}")
        
        # 构建对话历史
        conversation = ""
        if request.conversation_history:
            for msg in request.conversation_history[-5:]:  # 只保留最近5轮对话
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                conversation += f"{role}: {content}\n"
        
        # 构建完整的对话提示
        chat_prompt = f"""
        你是一个专业的技术助手，擅长分析网页内容和回答技术问题。
        
        {context}
        
        对话历史:
        {conversation}
        
        用户问题: {request.message}
        
        请根据上下文信息给出准确、有用的回答。如果问题与提供的网页内容相关，请结合内容进行回答。
        """
        
        # 获取AI回复（使用用户的AI服务）
        ai_response = await user_ai_service.summarize_content(
            chat_prompt,
            "chat",
            settings.default_language
        )
        
        # 生成建议问题
        suggestions = []
        if request.context_url:
            suggestions = [
                "这个内容的主要技术栈是什么？",
                "如何快速上手这个项目？",
                "这个内容的实用价值如何？",
                "有什么需要注意的地方？"
            ]
        else:
            suggestions = [
                "能详细解释一下吗？",
                "有什么相关的最佳实践？",
                "这个技术的优缺点是什么？",
                "如何在实际项目中应用？"
            ]
        
        return ChatResponse(
            response=ai_response or "抱歉，我现在无法回答这个问题。",
            sources=[request.context_url] if request.context_url else None,
            suggestions=suggestions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=f"聊天失败: {str(e)}")


@router.get("/content-types")
async def get_supported_content_types():
    """
    获取支持的内容类型
    """
    return {
        "content_types": [
            {
                "type": "github_repository",
                "name": "GitHub仓库",
                "description": "代码仓库、开源项目"
            },
            {
                "type": "tech_blog", 
                "name": "技术博客",
                "description": "技术文章、教程"
            },
            {
                "type": "documentation",
                "name": "技术文档",
                "description": "API文档、使用手册"
            },
            {
                "type": "academic_paper",
                "name": "学术论文",
                "description": "研究论文、arXiv文章"
            },
            {
                "type": "news",
                "name": "技术新闻",
                "description": "行业动态、产品发布"
            },
            {
                "type": "technical_content",
                "name": "技术内容",
                "description": "技术相关的一般内容"
            },
            {
                "type": "general_web_page",
                "name": "普通网页",
                "description": "其他类型的网页内容"
            }
        ]
    }


@router.get("/health")
async def chat_health_check():
    """
    Chat API健康检查
    """
    return {
        "status": "healthy",
        "ai_service_available": azure_openai_service.is_available(),
        "supported_features": [
            "url_analysis",
            "content_extraction", 
            "ai_chat",
            "context_aware_chat"
        ]
    }