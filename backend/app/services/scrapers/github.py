import requests
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class GitHubScraper:
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.trending_url = "https://github.com/trending"
    
    async def get_trending_repos(self, language: Optional[str] = None, since: str = "daily") -> List[Dict]:
        """
        获取 GitHub Trending 仓库
        """
        try:
            url = f"https://api.github.com/search/repositories"
            params = {
                "q": self._build_trending_query(since),
                "sort": "stars",
                "order": "desc",
                "per_page": 30
            }
            
            if language:
                params["q"] += f" language:{language}"
            
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            repos = []
            
            for repo in data.get("items", []):
                repo_data = {
                    "title": repo["full_name"],
                    "description": repo.get("description", ""),
                    "url": repo["html_url"],
                    "stars": repo["stargazers_count"],
                    "language": repo.get("language"),
                    "created_at": repo["created_at"],
                    "updated_at": repo["updated_at"],
                    "topics": repo.get("topics", []),
                    "raw_data": repo
                }
                repos.append(repo_data)
            
            return repos
            
        except Exception as e:
            logger.error(f"Error fetching GitHub trending: {e}")
            return []
    
    async def get_ai_python_repos(self, since: str = "daily") -> List[Dict]:
        """
        获取 AI 相关的 Python 项目
        """
        try:
            from datetime import datetime, timedelta
            
            if since == "daily":
                date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            elif since == "weekly":
                date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            else:
                date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            
            ai_keywords = [
                "machine learning", "deep learning", "neural network", "artificial intelligence",
                "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy",
                "computer vision", "natural language processing", "nlp", "transformers",
                "llm", "large language model", "gpt", "bert", "stable diffusion",
                "generative ai", "chatbot", "recommendation system", "data science"
            ]
            
            all_repos = []
            
            # 搜索不同的AI关键词组合
            for keyword in ai_keywords[:5]:  # 限制搜索次数避免API限制
                url = f"https://api.github.com/search/repositories"
                params = {
                    "q": f'"{keyword}" language:python created:>{date} stars:>10',
                    "sort": "stars",
                    "order": "desc",
                    "per_page": 10
                }
                
                response = requests.get(url, params=params, timeout=30)
                if response.status_code == 200:
                    data = response.json()
                    
                    for repo in data.get("items", []):
                        # 避免重复
                        if not any(r["url"] == repo["html_url"] for r in all_repos):
                            repo_data = {
                                "title": repo["full_name"],
                                "description": repo.get("description", ""),
                                "url": repo["html_url"],
                                "stars": repo["stargazers_count"],
                                "language": repo.get("language"),
                                "created_at": repo["created_at"],
                                "updated_at": repo["updated_at"],
                                "topics": repo.get("topics", []),
                                "ai_category": keyword,
                                "raw_data": repo
                            }
                            all_repos.append(repo_data)
            
            # 按星数排序
            all_repos.sort(key=lambda x: x["stars"], reverse=True)
            return all_repos[:20]  # 返回前20个
            
        except Exception as e:
            logger.error(f"Error fetching AI Python repos: {e}")
            return []
    
    def _build_trending_query(self, since: str) -> str:
        """
        构建 GitHub 搜索查询
        """
        from datetime import datetime, timedelta
        
        if since == "daily":
            date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            date_filter = f"created:>{date}"
        elif since == "weekly":
            date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            date_filter = f"created:>{date}"
        else:
            date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            date_filter = f"created:>{date}"
        
        return f"stars:>5 {date_filter}"
    
    async def get_repo_details(self, owner: str, repo: str) -> Optional[Dict]:
        """
        获取特定仓库的详细信息
        """
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            repo_data = response.json()
            
            readme_content = await self._get_readme(owner, repo)
            
            return {
                "title": repo_data["full_name"],
                "description": repo_data.get("description", ""),
                "url": repo_data["html_url"],
                "stars": repo_data["stargazers_count"],
                "forks": repo_data["forks_count"],
                "language": repo_data.get("language"),
                "topics": repo_data.get("topics", []),
                "readme": readme_content,
                "license": repo_data.get("license", {}).get("name") if repo_data.get("license") else None,
                "created_at": repo_data["created_at"],
                "updated_at": repo_data["updated_at"],
                "raw_data": repo_data
            }
            
        except Exception as e:
            logger.error(f"Error fetching repo details for {owner}/{repo}: {e}")
            return None
    
    async def _get_readme(self, owner: str, repo: str) -> str:
        """
        获取仓库的 README 内容
        """
        try:
            url = f"{self.base_url}/repos/{owner}/{repo}/readme"
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            readme_data = response.json()
            
            if readme_data.get("encoding") == "base64":
                import base64
                content = base64.b64decode(readme_data["content"]).decode("utf-8")
                return content[:2000]
            
            return ""
            
        except Exception as e:
            logger.error(f"Error fetching README for {owner}/{repo}: {e}")
            return ""