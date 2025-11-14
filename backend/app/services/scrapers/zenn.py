import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging
from bs4 import BeautifulSoup
from ..summarization_service import get_summarization_service

logger = logging.getLogger(__name__)


class ZennScraper:
    def __init__(self):
        self.base_url = "https://zenn.dev"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        self.summarization_service = get_summarization_service()
    
    def _get_article_content(self, article_url: str) -> tuple[Optional[str], Optional[str]]:
        """
        从文章页面获取完整内容和摘要（保留Markdown格式）

        Returns:
            tuple: (summary, full_content) - 摘要（前300字符）和完整Markdown内容
        """
        try:
            response = requests.get(article_url, headers=self.headers, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # 找到文章正文
            content_div = soup.find('div', class_='znc') or soup.find('article')

            if content_div:
                # 将HTML转换为Markdown风格的文本
                markdown_text = self._html_to_markdown(content_div)

                # 生成摘要（前300字符）
                summary = markdown_text[:300] + '...' if len(markdown_text) > 300 else markdown_text

                return summary, markdown_text

            return None, None
        except Exception as e:
            logger.warning(f"Error fetching article content from {article_url}: {e}")
            return None, None

    def _html_to_markdown(self, element) -> str:
        """
        将HTML元素转换为Markdown格式的文本
        保留代码块、标题、列表等格式
        """
        markdown_lines = []

        for child in element.children:
            if child.name is None:  # 文本节点
                text = str(child).strip()
                if text:
                    markdown_lines.append(text)
            elif child.name == 'h1':
                markdown_lines.append(f"\n# {child.get_text(strip=True)}\n")
            elif child.name == 'h2':
                markdown_lines.append(f"\n## {child.get_text(strip=True)}\n")
            elif child.name == 'h3':
                markdown_lines.append(f"\n### {child.get_text(strip=True)}\n")
            elif child.name == 'h4':
                markdown_lines.append(f"\n#### {child.get_text(strip=True)}\n")
            elif child.name == 'pre':
                # 代码块
                code = child.get_text(strip=True)
                lang = ''
                # 尝试获取语言标识
                code_tag = child.find('code')
                if code_tag and code_tag.get('class'):
                    classes = code_tag.get('class', [])
                    for cls in classes:
                        if cls.startswith('language-'):
                            lang = cls.replace('language-', '')
                            break
                markdown_lines.append(f"\n```{lang}\n{code}\n```\n")
            elif child.name == 'code' and child.parent.name != 'pre':
                # 行内代码
                markdown_lines.append(f"`{child.get_text(strip=True)}`")
            elif child.name in ['ul', 'ol']:
                # 列表
                for li in child.find_all('li', recursive=False):
                    prefix = '- ' if child.name == 'ul' else '1. '
                    markdown_lines.append(f"{prefix}{li.get_text(strip=True)}")
                markdown_lines.append("")
            elif child.name == 'p':
                markdown_lines.append(f"\n{child.get_text(strip=True)}\n")
            elif child.name == 'a':
                text = child.get_text(strip=True)
                href = child.get('href', '')
                markdown_lines.append(f"[{text}]({href})")
            elif child.name == 'blockquote':
                quote_text = child.get_text(strip=True)
                markdown_lines.append(f"\n> {quote_text}\n")
            else:
                # 其他元素递归处理
                if hasattr(child, 'children'):
                    markdown_lines.append(self._html_to_markdown(child))
                else:
                    text = child.get_text(strip=True) if hasattr(child, 'get_text') else str(child).strip()
                    if text:
                        markdown_lines.append(text)

        return '\n'.join(markdown_lines)

    def _get_article_summary(self, article_url: str) -> Optional[str]:
        """向后兼容的方法，只返回摘要"""
        summary, _ = self._get_article_content(article_url)
        return summary

    async def _get_article_with_ai_summary(
        self,
        article_url: str
    ) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """
        获取文章并生成AI摘要

        Returns:
            tuple: (short_summary, summary, full_content)
            - short_summary: 30字AI总结（列表展示）
            - summary: 200字AI总结（快速阅览）
            - full_content: 完整原文（深度阅读）
        """
        try:
            # 获取完整文章内容
            _, full_content = self._get_article_content(article_url)

            if not full_content:
                return None, None, None

            # 使用AI生成不同长度的摘要（Zenn是日语网站，生成日语摘要）
            summaries = await self.summarization_service.generate_multi_length_summaries(
                full_content,
                language="ja"  # Zenn文章生成日语摘要
            )

            return summaries["short"], summaries["medium"], summaries["full"]

        except Exception as e:
            logger.error(f"生成AI摘要失败: {e}")
            # 降级方案：使用截断的文本
            _, full_content = self._get_article_content(article_url)
            if full_content:
                short = full_content[:30] + "..." if len(full_content) > 30 else full_content
                medium = full_content[:200] + "..." if len(full_content) > 200 else full_content
                return short, medium, full_content
            return None, None, None

    async def get_trending_articles(self, limit: int = 20, min_likes: int = 20) -> List[Dict]:
        """
        获取 Zenn 热门技术文章 - 使用官方API并获取文章摘要
        """
        try:
            articles = []

            # 使用 Zenn API
            api_url = f"{self.base_url}/api/articles"
            response = requests.get(api_url, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            article_list = data.get('articles', [])

            for article in article_list:
                try:
                    likes = article.get('liked_count', 0)

                    # 应用最小いいね筛选
                    if likes < min_likes:
                        continue

                    article_url = f"{self.base_url}{article.get('path', '')}"

                    # 获取文章并生成AI摘要
                    short_summary, medium_summary, full_content = await self._get_article_with_ai_summary(article_url)

                    # 提取文章信息
                    article_data = {
                        'title': article.get('title', 'No Title'),
                        'url': article_url,
                        'short_summary': short_summary or f"{article.get('emoji', '📝')} {article.get('title', 'No Title')[:30]}",  # 30字AI总结
                        'summary': medium_summary or short_summary,  # 200字AI总结
                        'content': full_content,  # 完整原文
                        'author': article.get('user', {}).get('name', 'Unknown'),
                        'author_name': article.get('user', {}).get('username', ''),
                        'likes': likes,
                        'comments': article.get('comments_count', 0),
                        'emoji': article.get('emoji', '📝'),
                        'published_at': article.get('published_at', ''),
                        'type': 'article',
                        'is_premium': False  # Zenn 文章默认免费
                    }

                    articles.append(article_data)

                    # 如果已收集足够数量，停止
                    if len(articles) >= limit:
                        break
                except Exception as e:
                    logger.warning(f"Error parsing article: {e}")
                    continue

            logger.info(f"Fetched {len(articles)} articles from Zenn API")
            return articles
        except Exception as e:
            logger.error(f"Error fetching Zenn articles: {e}")
            return []

    async def get_tech_articles(self, limit: int = 20, min_likes: int = 20) -> List[Dict]:
        """
        获取技术相关文章 - 使用API并筛选点赞数高的文章
        """
        try:
            articles = []

            # 使用 Zenn API
            api_url = f"{self.base_url}/api/articles"
            response = requests.get(api_url, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            article_list = data.get('articles', [])

            for article in article_list:
                try:
                    # 只保留技术相关文章（根据点赞数筛选）
                    if article.get('liked_count', 0) >= min_likes:
                        article_url = f"{self.base_url}{article.get('path', '')}"

                        # 获取文章并生成AI摘要
                        short_summary, medium_summary, full_content = await self._get_article_with_ai_summary(article_url)

                        article_data = {
                            'title': article.get('title', 'No Title'),
                            'url': article_url,
                            'short_summary': short_summary or f"{article.get('emoji', '📝')} {article.get('title', 'No Title')[:30]}",  # 30字AI总结
                            'summary': medium_summary or short_summary,  # 200字AI总结
                            'content': full_content,  # 完整原文
                            'author': article.get('user', {}).get('name', 'Unknown'),
                            'author_name': article.get('user', {}).get('username', ''),
                            'likes': article.get('liked_count', 0),
                            'comments': article.get('comments_count', 0),
                            'emoji': article.get('emoji', '📝'),
                            'published_at': article.get('published_at', ''),
                            'type': 'article',
                            'is_premium': False
                        }
                        articles.append(article_data)

                        if len(articles) >= limit:
                            break
                except Exception as e:
                    logger.warning(f"Error parsing tech article: {e}")
                    continue

            logger.info(f"Fetched {len(articles)} tech articles from Zenn")
            return articles
        except Exception as e:
            logger.error(f"Error fetching tech articles: {e}")
            return []

    async def get_recent_articles(self, days: int = 30) -> List[Dict]:
        """
        获取最近N天的文章 - 使用API
        """
        try:
            # Zenn API 返回的就是最新的文章，所以直接使用 trending articles
            articles = await self.get_trending_articles(limit=30)
            logger.info(f"Fetched {len(articles)} recent articles from Zenn (last {days} days)")
            return articles
        except Exception as e:
            logger.error(f"Error fetching recent articles: {e}")
            return []

    async def get_article_details(self, url: str) -> Optional[Dict]:
        """
        获取文章详细内容 - 基本信息版本
        """
        try:
            # Zenn API 不提供完整文章内容，返回基本结构
            return {
                'url': url,
                'content': '',
                'tags': []
            }
        except Exception as e:
            logger.error(f"Error fetching article details: {e}")
            return None

    # 保留原有方法作为备用
    async def get_trending_articles_html(self, limit: int = 20) -> List[Dict]:
        """
        获取 Zenn 热门技术文章 - HTML解析版本（备用）
        """
        try:
            articles = []

            # 获取文章页面
            url = f"{self.base_url}/articles"
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # 查找文章列表
            article_items = soup.find_all('article') or soup.find_all('div', class_=lambda x: x and 'article' in x.lower())

            for item in article_items[:limit]:
                try:
                    # 提取文章链接
                    link_elem = item.find('a', href=True)
                    if not link_elem:
                        continue

                    article_url = link_elem['href']
                    if not article_url.startswith('http'):
                        article_url = f"{self.base_url}{article_url}"

                    # 提取标题
                    title_elem = item.find(['h1', 'h2', 'h3']) or link_elem
                    title = title_elem.get_text(strip=True) if title_elem else "No Title"

                    # 提取作者信息
                    author_elem = item.find('span', class_=lambda x: x and 'author' in x.lower()) or \
                                 item.find('div', class_=lambda x: x and 'user' in x.lower())
                    author = author_elem.get_text(strip=True) if author_elem else "Unknown"
                    
                    # 提取时间信息
                    time_elem = item.find('time') or item.find('span', class_=lambda x: x and 'date' in x.lower())
                    published_at = time_elem.get_text(strip=True) if time_elem else ""
                    
                    # 提取emoji
                    emoji_elem = item.find('span', class_=lambda x: x and 'emoji' in x.lower())
                    emoji = emoji_elem.get_text(strip=True) if emoji_elem else "📝"
                    
                    # 提取点赞数或其他互动数据
                    likes_elem = item.find('span', class_=lambda x: x and ('like' in x.lower() or 'heart' in x.lower()))
                    likes = 0
                    if likes_elem:
                        try:
                            likes_text = likes_elem.get_text(strip=True)
                            likes = int(''.join(filter(str.isdigit, likes_text)))
                        except:
                            likes = 0
                    
                    article_data = {
                        "title": title,
                        "url": article_url,
                        "author": author,
                        "published_at": published_at,
                        "emoji": emoji,
                        "likes": likes,
                        "platform": "Zenn",
                        "language": "ja",
                        "raw_data": {
                            "scraped_at": datetime.now().isoformat(),
                            "source_url": url
                        }
                    }
                    
                    articles.append(article_data)
                    
                except Exception as e:
                    logger.warning(f"Error parsing article item: {e}")
                    continue
            
            logger.info(f"Successfully scraped {len(articles)} articles from Zenn")
            return articles

        except Exception as e:
            logger.error(f"Error fetching Zenn articles: {e}")
            return []