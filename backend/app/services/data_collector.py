import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from ..models.card import TechCard, SourceType
from ..core.database import SessionLocal
from .scrapers import GitHubScraper, ArxivScraper, HuggingFaceScraper
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
            repos = await self.github_scraper.get_trending_repos()
            db = SessionLocal()
            
            saved_count = 0
            for repo in repos:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == repo["url"]
                ).first()
                
                if not existing:
                    card = TechCard(
                        title=repo["title"],
                        source=SourceType.GITHUB,
                        original_url=repo["url"],
                        summary=repo.get("description", ""),
                        chinese_tags=repo.get("topics", []),
                        raw_data=repo["raw_data"]
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
            models = await self.hf_scraper.get_trending_models(limit=15)
            datasets = await self.hf_scraper.get_trending_datasets(limit=15)
            
            db = SessionLocal()
            saved_count = 0
            
            for item in models + datasets:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == item["url"]
                ).first()
                
                if not existing:
                    card = TechCard(
                        title=item["title"],
                        source=SourceType.HUGGINGFACE,
                        original_url=item["url"],
                        summary=f"Downloads: {item.get('downloads', 0)}, Likes: {item.get('likes', 0)}",
                        chinese_tags=item.get("tags", []),
                        raw_data=item["raw_data"]
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