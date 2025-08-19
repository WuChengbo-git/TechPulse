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
        获取 Zenn 热门技术文章
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
    
    async def get_tech_articles(self, limit: int = 20) -> List[Dict]:
        """
        获取技术类文章，通过搜索关键词
        """
        try:
            all_articles = []
            
            # 技术关键词
            tech_keywords = [
                "AI", "機械学習", "Python", "JavaScript", "React", "Vue",
                "Docker", "Kubernetes", "AWS", "クラウド", "DevOps",
                "フロントエンド", "バックエンド", "データベース", "API"
            ]
            
            for keyword in tech_keywords[:3]:  # 限制搜索次数
                try:
                    # 使用搜索功能
                    search_url = f"{self.base_url}/search"
                    params = {"q": keyword}
                    
                    response = requests.get(search_url, params=params, headers=self.headers, timeout=30)
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        
                        # 查找搜索结果
                        article_items = soup.find_all('article') or soup.find_all('div', class_=lambda x: x and 'search-result' in x.lower())
                        
                        for item in article_items[:5]:  # 每个关键词取5篇
                            try:
                                link_elem = item.find('a', href=True)
                                if not link_elem:
                                    continue
                                
                                article_url = link_elem['href']
                                if not article_url.startswith('http'):
                                    article_url = f"{self.base_url}{article_url}"
                                
                                # 避免重复
                                if any(art["url"] == article_url for art in all_articles):
                                    continue
                                
                                title_elem = item.find(['h1', 'h2', 'h3']) or link_elem
                                title = title_elem.get_text(strip=True) if title_elem else "No Title"
                                
                                author_elem = item.find('span', class_=lambda x: x and 'author' in x.lower())
                                author = author_elem.get_text(strip=True) if author_elem else "Unknown"
                                
                                article_data = {
                                    "title": title,
                                    "url": article_url,
                                    "author": author,
                                    "keyword": keyword,
                                    "platform": "Zenn",
                                    "language": "ja",
                                    "raw_data": {
                                        "scraped_at": datetime.now().isoformat(),
                                        "search_keyword": keyword
                                    }
                                }
                                
                                all_articles.append(article_data)
                                
                            except Exception as e:
                                logger.warning(f"Error parsing search result: {e}")
                                continue
                                
                except Exception as e:
                    logger.warning(f"Error searching for keyword {keyword}: {e}")
                    continue
            
            # 按标题去重并限制数量
            unique_articles = list({art["title"]: art for art in all_articles}.values())
            return unique_articles[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching tech articles from Zenn: {e}")
            return []
    
    async def get_article_details(self, article_url: str) -> Optional[Dict]:
        """
        获取文章详细内容
        """
        try:
            response = requests.get(article_url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取文章内容
            title_elem = soup.find('h1')
            title = title_elem.get_text(strip=True) if title_elem else "No Title"
            
            # 提取正文内容的前500字符
            content_elem = soup.find('article') or soup.find('div', class_=lambda x: x and 'content' in x.lower())
            content = ""
            if content_elem:
                # 移除代码块和其他不必要的元素
                for code in content_elem.find_all('code'):
                    code.decompose()
                for pre in content_elem.find_all('pre'):
                    pre.decompose()
                    
                content = content_elem.get_text(strip=True)[:500]
            
            # 提取标签
            tags = []
            tag_elements = soup.find_all('span', class_=lambda x: x and 'tag' in x.lower()) or \
                          soup.find_all('a', class_=lambda x: x and 'tag' in x.lower())
            
            for tag_elem in tag_elements:
                tag_text = tag_elem.get_text(strip=True)
                if tag_text and tag_text not in tags:
                    tags.append(tag_text)
            
            # 提取作者信息
            author_elem = soup.find('span', class_=lambda x: x and 'author' in x.lower()) or \
                         soup.find('div', class_=lambda x: x and 'user' in x.lower())
            author = author_elem.get_text(strip=True) if author_elem else "Unknown"
            
            return {
                "title": title,
                "url": article_url,
                "author": author,
                "content": content,
                "tags": tags[:5],  # 限制标签数量
                "platform": "Zenn",
                "language": "ja",
                "scraped_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error fetching article details from {article_url}: {e}")
            return None
    
    async def get_recent_articles(self, days: int = 7) -> List[Dict]:
        """
        获取最近几天的文章
        """
        try:
            # 由于Zenn没有直接的日期过滤API，我们获取最新文章并手动过滤
            articles = await self.get_trending_articles(limit=50)
            
            # 这里可以根据实际需要添加日期过滤逻辑
            # 目前返回最新的文章
            return articles[:20]
            
        except Exception as e:
            logger.error(f"Error fetching recent Zenn articles: {e}")
            return []