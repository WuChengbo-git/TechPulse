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
                    "forks": repo["forks_count"],
                    "language": repo.get("language"),
                    "license": repo.get("license", {}).get("name") if repo.get("license") else None,
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
    
    async def get_daily_trending_repos(self, language: Optional[str] = None, limit: int = 30, min_stars: int = 100) -> List[Dict]:
        """
        获取每日真正trending的项目 - 结合新建和活跃项目
        """
        try:
            from datetime import datetime, timedelta

            today = datetime.now().strftime("%Y-%m-%d")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

            all_repos = []

            # 策略1: 获取今天新建的项目（应用星数筛选）
            new_repos = await self._search_repos({
                "q": f"created:{today} stars:>={min_stars}" + (f" language:{language}" if language else ""),
                "sort": "stars",
                "order": "desc",
                "per_page": 15
            })

            # 策略2: 获取昨天活跃且星数增长的项目（应用星数筛选）
            active_repos = await self._search_repos({
                "q": f"pushed:>{yesterday} stars:>={min_stars}" + (f" language:{language}" if language else ""),
                "sort": "updated",
                "order": "desc",
                "per_page": 15
            })

            # 策略3: 获取最近2天创建的新兴项目（应用星数筛选）
            recent_repos = await self._search_repos({
                "q": f"created:>{yesterday} stars:>={min_stars}" + (f" language:{language}" if language else ""),
                "sort": "stars",
                "order": "desc",
                "per_page": 15
            })
            
            # 合并并去重
            all_repos.extend(new_repos)
            all_repos.extend(active_repos) 
            all_repos.extend(recent_repos)
            
            # 去重并按综合得分排序
            unique_repos = {repo["url"]: repo for repo in all_repos}.values()
            scored_repos = []
            
            for repo in unique_repos:
                # 计算trending得分：新鲜度 + 星数增长潜力
                try:
                    from datetime import timezone
                    created_at = datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00"))
                    now_utc = datetime.now(timezone.utc)
                    created_days = (now_utc - created_at).days
                    freshness_score = max(0, 30 - created_days)  # 越新得分越高
                    popularity_score = min(repo["stars"], 1000) / 10  # 星数得分，上限100
                    
                    repo["trending_score"] = freshness_score + popularity_score
                    scored_repos.append(repo)
                except Exception as e:
                    logger.error(f"Error calculating score for repo {repo.get('title', '')}: {e}")
                    # 如果时间处理出错，仍然添加但设置默认得分
                    repo["trending_score"] = repo["stars"] / 10
                    scored_repos.append(repo)
            
            # 按得分排序
            scored_repos.sort(key=lambda x: x["trending_score"], reverse=True)
            return scored_repos[:limit]
            
        except Exception as e:
            logger.error(f"Error fetching daily trending repos: {e}")
            return []
    
    async def _search_repos(self, params: Dict) -> List[Dict]:
        """
        搜索GitHub仓库的通用方法
        """
        try:
            url = "https://api.github.com/search/repositories"
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
                    "forks": repo["forks_count"],
                    "language": repo.get("language"),
                    "license": repo.get("license", {}).get("name") if repo.get("license") else None,
                    "created_at": repo["created_at"],
                    "updated_at": repo["updated_at"],
                    "topics": repo.get("topics", []),
                    "raw_data": repo
                }
                repos.append(repo_data)
                
            return repos
            
        except Exception as e:
            logger.error(f"Error in _search_repos: {e}")
            return []

    async def get_ai_python_repos(self, since: str = "daily", min_stars: int = 100) -> List[Dict]:
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

            # 搜索不同的AI关键词组合，应用星数筛选
            for keyword in ai_keywords[:5]:  # 限制搜索次数避免API限制
                params = {
                    "q": f'"{keyword}" language:python (created:>{date} OR pushed:>{date}) stars:>={min_stars}',
                    "sort": "updated",
                    "order": "desc",
                    "per_page": 10
                }
                
                repos = await self._search_repos(params)
                
                for repo in repos:
                    # 避免重复
                    if not any(r["url"] == repo["url"] for r in all_repos):
                        repo["ai_category"] = keyword
                        all_repos.append(repo)
            
            # 按更新时间和星数综合排序
            all_repos.sort(key=lambda x: (x["stars"], x["updated_at"]), reverse=True)
            return all_repos[:20]  # 返回前20个
            
        except Exception as e:
            logger.error(f"Error fetching AI Python repos: {e}")
            return []
    
    def _build_trending_query(self, since: str) -> str:
        """
        构建 GitHub 搜索查询 - 获取真正trending的项目
        """
        from datetime import datetime, timedelta
        
        if since == "daily":
            # 最近1天创建或有重大更新的项目，降低星数要求
            date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            return f"created:>{date} OR (stars:>20 pushed:>{date})"
        elif since == "weekly":
            # 最近一周的活跃项目
            date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
            return f"created:>{date} OR (stars:>10 pushed:>{date})"
        else:
            # 最近一月的项目，包括新创建和活跃项目
            date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
            return f"created:>{date} OR (stars:>5 pushed:>{date})"
    
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