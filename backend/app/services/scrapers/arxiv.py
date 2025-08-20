import feedparser
import requests
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ArxivScraper:
    def __init__(self):
        self.base_url = "http://export.arxiv.org/api/query"
        self.categories = {
            "cs.AI": "Artificial Intelligence",
            "cs.ML": "Machine Learning", 
            "cs.LG": "Learning",
            "cs.CV": "Computer Vision",
            "cs.CL": "Computation and Language",
            "cs.RO": "Robotics",
            "stat.ML": "Machine Learning (Statistics)"
        }
    
    async def get_recent_papers(self, categories: Optional[List[str]] = None, max_results: int = 30, days_back: int = 30) -> List[Dict]:
        """
        获取最近的 arXiv 论文 - 重点关注AI相关领域，只获取指定天数内的论文
        """
        try:
            if not categories:
                # 重点关注AI核心领域
                categories = ["cs.AI", "cs.ML", "cs.LG", "cs.CV", "cs.CL"]
            
            # 构建查询：包含分类和热门关键词
            cat_query = " OR ".join([f"cat:{cat}" for cat in categories])
            keyword_query = " OR ".join([
                "all:\"large language model\"",
                "all:\"transformer\"", 
                "all:\"diffusion\"",
                "all:\"reinforcement learning\"",
                "all:\"neural network\"",
                "all:\"deep learning\"",
                "all:\"multimodal\"",
                "all:\"foundation model\"",
                "all:\"RLHF\"",
                "all:\"instruction tuning\""
            ])
            
            # 组合查询：(分类 OR 关键词) 
            query = f"({cat_query}) OR ({keyword_query})"
            
            params = {
                "search_query": query,
                "start": 0,
                "max_results": max_results * 2,  # 获取更多以便过滤
                "sortBy": "submittedDate",
                "sortOrder": "descending"
            }
            
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            
            feed = feedparser.parse(response.text)
            papers = []
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            for entry in feed.entries:
                # 检查论文发布时间
                try:
                    # arXiv时间格式: Mon, 1 Jan 2024 19:00:00 GMT
                    published_date = datetime.strptime(entry.published, "%a, %d %b %Y %H:%M:%S %Z")
                    
                    # 只保留指定天数内的论文
                    if published_date < cutoff_date:
                        continue
                    
                except Exception as e:
                    logger.warning(f"Error parsing date for paper {entry.title}: {e}")
                    # 如果时间解析失败，仍然包含该论文
                    pass
                
                paper_data = {
                    "title": entry.title,
                    "authors": [author.name for author in entry.authors] if hasattr(entry, 'authors') else [],
                    "summary": entry.summary.replace('\n', ' ').strip(),
                    "url": entry.link,
                    "arxiv_id": entry.id.split("/")[-1],
                    "categories": [tag.term for tag in entry.tags] if hasattr(entry, 'tags') else [],
                    "published": entry.published,
                    "updated": entry.updated if hasattr(entry, 'updated') else entry.published,
                    "pdf_url": None,
                    "raw_data": dict(entry)
                }
                
                for link in entry.links:
                    if link.type == "application/pdf":
                        paper_data["pdf_url"] = link.href
                        break
                
                papers.append(paper_data)
                
                # 如果已经获取足够数量的论文，停止
                if len(papers) >= max_results:
                    break
            
            logger.info(f"Filtered {len(papers)} papers from last {days_back} days")
            return papers
            
        except Exception as e:
            logger.error(f"Error fetching arXiv papers: {e}")
            return []
    
    async def get_paper_details(self, arxiv_id: str) -> Optional[Dict]:
        """
        获取特定论文的详细信息
        """
        try:
            params = {
                "id_list": arxiv_id,
                "max_results": 1
            }
            
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()
            
            feed = feedparser.parse(response.text)
            
            if not feed.entries:
                return None
            
            entry = feed.entries[0]
            
            paper_data = {
                "title": entry.title,
                "authors": [author.name for author in entry.authors] if hasattr(entry, 'authors') else [],
                "summary": entry.summary.replace('\n', ' ').strip(),
                "url": entry.link,
                "arxiv_id": arxiv_id,
                "categories": [tag.term for tag in entry.tags] if hasattr(entry, 'tags') else [],
                "published": entry.published,
                "updated": entry.updated if hasattr(entry, 'updated') else entry.published,
                "pdf_url": None,
                "raw_data": dict(entry)
            }
            
            for link in entry.links:
                if link.type == "application/pdf":
                    paper_data["pdf_url"] = link.href
                    break
            
            return paper_data
            
        except Exception as e:
            logger.error(f"Error fetching arXiv paper {arxiv_id}: {e}")
            return None
    
    def get_category_name(self, category: str) -> str:
        """
        获取类别的中文名称
        """
        return self.categories.get(category, category)