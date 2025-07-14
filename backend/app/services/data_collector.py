import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from ..models.card import TechCard, SourceType
from ..core.database import SessionLocal
from .scrapers import GitHubScraper, ArxivScraper, HuggingFaceScraper
from .ai.azure_openai import azure_openai_service
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


class DataCollector:
    def __init__(self):
        self.github_scraper = GitHubScraper()
        self.arxiv_scraper = ArxivScraper()
        self.hf_scraper = HuggingFaceScraper()
    
    async def collect_all_sources(self) -> Dict[str, int]:
        """
        从所有数据源收集信息
        """
        results = {
            "github": 0,
            "arxiv": 0,
            "huggingface": 0,
            "total": 0
        }
        
        try:
            tasks = [
                self.collect_github_data(),
                self.collect_arxiv_data(),
                self.collect_huggingface_data()
            ]
            
            github_count, arxiv_count, hf_count = await asyncio.gather(*tasks)
            
            results["github"] = github_count
            results["arxiv"] = arxiv_count
            results["huggingface"] = hf_count
            results["total"] = github_count + arxiv_count + hf_count
            
        except Exception as e:
            logger.error(f"Error in collect_all_sources: {e}")
        
        return results
    
    async def collect_github_data(self) -> int:
        """
        收集 GitHub 数据
        """
        try:
            # 同时收集一般trending和AI Python项目
            general_repos = await self.github_scraper.get_trending_repos(language="python")
            ai_repos = await self.github_scraper.get_ai_python_repos()
            
            # 合并并去重
            all_repos = general_repos + ai_repos
            unique_repos = {repo["url"]: repo for repo in all_repos}.values()
            
            db = SessionLocal()
            saved_count = 0
            
            for repo in unique_repos:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == repo["url"]
                ).first()
                
                if not existing:
                    # 准备内容进行AI处理
                    content = f"Project: {repo['title']}\nDescription: {repo.get('description', '')}\nTopics: {', '.join(repo.get('topics', []))}"
                    
                    # AI处理
                    summary = None
                    chinese_tags = []
                    trial_suggestion = None
                    
                    if azure_openai_service.is_available():
                        try:
                            # 生成摘要
                            if settings.enable_summarization:
                                summary = await azure_openai_service.summarize_content(
                                    content, "github", settings.default_language
                                )
                            
                            # 提取标签
                            chinese_tags = await azure_openai_service.extract_tags(
                                content, settings.default_language
                            )
                            
                            # 生成试用建议
                            trial_suggestion = await azure_openai_service.generate_trial_suggestion(
                                content, settings.default_language
                            )
                            
                        except Exception as e:
                            logger.error(f"AI processing failed for {repo['title']}: {e}")
                    
                    card = TechCard(
                        title=repo["title"],
                        source=SourceType.GITHUB,
                        original_url=repo["url"],
                        summary=summary or repo.get("description", ""),
                        chinese_tags=chinese_tags if chinese_tags else repo.get("topics", []),
                        trial_suggestion=trial_suggestion,
                        raw_data=repo
                    )
                    db.add(card)
                    saved_count += 1
            
            db.commit()
            db.close()
            
            logger.info(f"Collected {saved_count} GitHub repositories")
            return saved_count
            
        except Exception as e:
            logger.error(f"Error collecting GitHub data: {e}")
            return 0
    
    async def collect_arxiv_data(self) -> int:
        """
        收集 arXiv 数据
        """
        try:
            papers = await self.arxiv_scraper.get_recent_papers()
            db = SessionLocal()
            
            saved_count = 0
            for paper in papers:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == paper["url"]
                ).first()
                
                if not existing:
                    card = TechCard(
                        title=paper["title"],
                        source=SourceType.ARXIV,
                        original_url=paper["url"],
                        summary=paper["summary"][:500] + "..." if len(paper["summary"]) > 500 else paper["summary"],
                        chinese_tags=paper.get("categories", []),
                        raw_data=paper["raw_data"]
                    )
                    db.add(card)
                    saved_count += 1
            
            db.commit()
            db.close()
            
            logger.info(f"Collected {saved_count} arXiv papers")
            return saved_count
            
        except Exception as e:
            logger.error(f"Error collecting arXiv data: {e}")
            return 0
    
    async def collect_huggingface_data(self) -> int:
        """
        收集 HuggingFace 数据
        """
        try:
            # 收集热门模型和每日trending模型
            trending_models = await self.hf_scraper.get_trending_models(limit=15)
            daily_models = await self.hf_scraper.get_daily_trending_models(limit=15)
            datasets = await self.hf_scraper.get_trending_datasets(limit=10)
            
            # 合并并去重
            all_items = trending_models + daily_models + datasets
            unique_items = {item["url"]: item for item in all_items}.values()
            
            db = SessionLocal()
            saved_count = 0
            
            for item in unique_items:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == item["url"]
                ).first()
                
                if not existing:
                    # 准备内容进行AI处理
                    item_type = "Model" if "models" in item["url"] else "Dataset"
                    content = f"{item_type}: {item['title']}\nAuthor: {item.get('author', '')}\nTags: {', '.join(item.get('tags', []))}\nTask: {item.get('pipeline_tag', '')}"
                    
                    # AI处理
                    summary = None
                    chinese_tags = []
                    trial_suggestion = None
                    
                    if azure_openai_service.is_available():
                        try:
                            # 生成摘要
                            if settings.enable_summarization:
                                summary = await azure_openai_service.summarize_content(
                                    content, "huggingface", settings.default_language
                                )
                            
                            # 提取标签
                            chinese_tags = await azure_openai_service.extract_tags(
                                content, settings.default_language
                            )
                            
                            # 生成试用建议
                            trial_suggestion = await azure_openai_service.generate_trial_suggestion(
                                content, settings.default_language
                            )
                            
                        except Exception as e:
                            logger.error(f"AI processing failed for {item['title']}: {e}")
                    
                    # 构建基础摘要
                    base_summary = f"Downloads: {item.get('downloads', 0)}, Likes: {item.get('likes', 0)}"
                    if item.get('pipeline_tag'):
                        base_summary += f", Task: {item['pipeline_tag']}"
                    
                    card = TechCard(
                        title=item["title"],
                        source=SourceType.HUGGINGFACE,
                        original_url=item["url"],
                        summary=summary or base_summary,
                        chinese_tags=chinese_tags if chinese_tags else item.get("tags", []),
                        trial_suggestion=trial_suggestion,
                        raw_data=item
                    )
                    db.add(card)
                    saved_count += 1
            
            db.commit()
            db.close()
            
            logger.info(f"Collected {saved_count} HuggingFace items")
            return saved_count
            
        except Exception as e:
            logger.error(f"Error collecting HuggingFace data: {e}")
            return 0