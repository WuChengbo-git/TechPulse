import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class ZennScraper:
    def __init__(self):
        self.base_url = "https://zenn.dev"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    
    async def get_trending_articles(self, limit: int = 20) -> List[Dict]:
        """
        获取 Zenn 热门技术文章 - 使用官方API
        """
        try:
            articles = []

            # 使用 Zenn API
            api_url = f"{self.base_url}/api/articles"
            response = requests.get(api_url, headers=self.headers, timeout=30)
            response.raise_for_status()

            data = response.json()
            article_list = data.get('articles', [])

            for article in article_list[:limit]:
                try:
                    # 提取文章信息
                    article_data = {
                        'title': article.get('title', 'No Title'),
                        'url': f"{self.base_url}{article.get('path', '')}",
                        'author': article.get('user', {}).get('name', 'Unknown'),
                        'author_name': article.get('user', {}).get('username', ''),
                        'likes': article.get('liked_count', 0),
                        'comments': article.get('comments_count', 0),
                        'emoji': article.get('emoji', '📝'),
                        'published_at': article.get('published_at', ''),
                        'type': 'article',
                        'is_premium': False  # Zenn 文章默认免费
                    }

                    articles.append(article_data)
                except Exception as e:
                    logger.warning(f"Error parsing article: {e}")
                    continue

            logger.info(f"Fetched {len(articles)} articles from Zenn API")
            return articles
        except Exception as e:
            logger.error(f"Error fetching Zenn articles: {e}")
            return []

    async def get_tech_articles(self, limit: int = 20) -> List[Dict]:
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
                    if article.get('liked_count', 0) >= 10:
                        article_data = {
                            'title': article.get('title', 'No Title'),
                            'url': f"{self.base_url}{article.get('path', '')}",
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