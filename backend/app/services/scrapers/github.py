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
    
    def _build_trending_query(self, since: str) -> str:
        """
        构建 GitHub 搜索查询
        """
        if since == "daily":
            date_filter = "created:>2023-01-01"
        elif since == "weekly":
            date_filter = "created:>2023-01-01"
        else:
            date_filter = "created:>2023-01-01"
        
        return f"stars:>100 {date_filter}"
    
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