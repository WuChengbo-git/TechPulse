import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.card import TechCard, SourceType
from ..models.config import DataSourceHealth, HealthStatus
from ..core.database import SessionLocal
from .scrapers import GitHubScraper, ArxivScraper, HuggingFaceScraper, ZennScraper
from .ai.azure_openai import azure_openai_service
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)


class DataCollector:
    def __init__(self):
        self.github_scraper = GitHubScraper()
        self.arxiv_scraper = ArxivScraper()
        self.hf_scraper = HuggingFaceScraper()
        self.zenn_scraper = ZennScraper()

    def _log_health(self, db: Session, source_name: str, status: HealthStatus,
                    items_collected: int, items_expected: int,
                    duration: float, error_msg: str = None):
        """记录数据源健康状态"""
        try:
            health_record = DataSourceHealth(
                source_name=source_name,
                status=status,
                items_collected=items_collected,
                items_expected=items_expected,
                duration_seconds=duration,
                error_message=error_msg
            )
            db.add(health_record)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to log health for {source_name}: {e}")
            db.rollback()
    
    async def collect_all_sources(self) -> Dict[str, int]:
        """
        从所有数据源收集信息
        """
        results = {
            "github": 0,
            "arxiv": 0,
            "huggingface": 0,
            "zenn": 0,
            "total": 0
        }
        
        try:
            tasks = [
                self.collect_github_data(),
                self.collect_arxiv_data(),
                self.collect_huggingface_data(),
                self.collect_zenn_data()
            ]
            
            github_count, arxiv_count, hf_count, zenn_count = await asyncio.gather(*tasks)
            
            results["github"] = github_count
            results["arxiv"] = arxiv_count
            results["huggingface"] = hf_count
            results["zenn"] = zenn_count
            results["total"] = github_count + arxiv_count + hf_count + zenn_count
            
        except Exception as e:
            logger.error(f"Error in collect_all_sources: {e}")
        
        return results
    
    async def collect_github_data(self) -> int:
        """
        收集 GitHub 数据 - 优化为获取每日最新trending项目
        """
        start_time = datetime.now()
        db = SessionLocal()

        try:
            # 使用新的每日trending算法获取最新项目
            daily_trending = await self.github_scraper.get_daily_trending_repos(language="python", limit=25)
            ai_repos = await self.github_scraper.get_ai_python_repos(since="daily")

            # 合并并去重
            all_repos = daily_trending + ai_repos
            unique_repos = list({repo["url"]: repo for repo in all_repos}.values())

            # 按trending得分和更新时间排序，确保获取最新内容
            unique_repos.sort(key=lambda x: (x.get("trending_score", 0), x.get("updated_at", "")), reverse=True)
            unique_repos = unique_repos[:25]  # 增加到25个项目

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
                        stars=repo.get("stars", 0),
                        forks=repo.get("forks", 0),
                        license=repo.get("license"),
                        tech_stack=repo.get("topics", [])[:5] if repo.get("topics") else [],
                        raw_data=repo
                    )
                    db.add(card)
                    saved_count += 1
            
            db.commit()

            # 记录成功的健康状态
            duration = (datetime.now() - start_time).total_seconds()
            status = HealthStatus.SUCCESS if saved_count > 0 else HealthStatus.PARTIAL
            self._log_health(db, "github", status, saved_count, 25, duration)

            db.close()

            logger.info(f"Collected {saved_count} GitHub repositories in {duration:.2f}s")
            return saved_count

        except Exception as e:
            # 记录失败的健康状态
            duration = (datetime.now() - start_time).total_seconds()
            self._log_health(db, "github", HealthStatus.FAILED, 0, 25, duration, str(e))
            db.close()

            logger.error(f"Error collecting GitHub data: {e}")
            return 0
    
    async def collect_arxiv_data(self) -> int:
        """
        收集 arXiv 数据 - 改进版，只获取一个月内的论文并进行AI分析
        """
        try:
            # 获取最近30天内的论文
            papers = await self.arxiv_scraper.get_recent_papers(max_results=25, days_back=30)
            db = SessionLocal()
            
            saved_count = 0
            for paper in papers:
                existing = db.query(TechCard).filter(
                    TechCard.original_url == paper["url"]
                ).first()
                
                if not existing:
                    # 准备内容进行AI处理
                    content = f"Title: {paper['title']}\nAuthors: {', '.join(paper.get('authors', []))}\nAbstract: {paper['summary']}\nCategories: {', '.join(paper.get('categories', []))}"
                    
                    # AI处理
                    summary = None
                    chinese_tags = []
                    trial_suggestion = None
                    
                    if azure_openai_service.is_available():
                        try:
                            # 生成摘要
                            if settings.enable_summarization:
                                summary = await azure_openai_service.summarize_content(
                                    content, "arxiv", settings.default_language
                                )
                            
                            # 提取标签
                            chinese_tags = await azure_openai_service.extract_tags(
                                content, settings.default_language
                            )
                            
                            # 生成试用建议（对于论文，主要是阅读和研究建议）
                            trial_suggestion = await azure_openai_service.generate_trial_suggestion(
                                content, settings.default_language
                            )
                            
                        except Exception as e:
                            logger.error(f"AI processing failed for {paper['title']}: {e}")
                    
                    # 构建基础摘要
                    base_summary = paper["summary"][:400] + "..." if len(paper["summary"]) > 400 else paper["summary"]
                    
                    card = TechCard(
                        title=paper["title"],
                        source=SourceType.ARXIV,
                        original_url=paper["url"],
                        summary=summary or base_summary,
                        chinese_tags=chinese_tags if chinese_tags else paper.get("categories", []),
                        trial_suggestion=trial_suggestion,
                        raw_data=paper
                    )
                    db.add(card)
                    saved_count += 1
            
            db.commit()
            db.close()
            
            logger.info(f"Collected {saved_count} arXiv papers from last 30 days")
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
    
    async def collect_zenn_data(self) -> int:
        """
        收集 Zenn 数据 - 改进版，获取最近30天的活跃文章
        """
        try:
            # 使用新的最近文章方法获取一个月内的文章
            recent_articles = await self.zenn_scraper.get_recent_articles(days=30)
            tech_articles = await self.zenn_scraper.get_tech_articles(limit=10)
            
            # 合并并去重
            all_articles = recent_articles + tech_articles
            unique_articles = {article["url"]: article for article in all_articles}.values()
            
            db = SessionLocal()
            saved_count = 0

            for article in unique_articles:
                try:
                    existing = db.query(TechCard).filter(
                        TechCard.original_url == article["url"]
                    ).first()

                    if not existing:
                        # 获取文章详细内容
                        article_details = None
                        try:
                            article_details = await self.zenn_scraper.get_article_details(article["url"])
                        except Exception as e:
                            logger.warning(f"Failed to get article details for {article['url']}: {e}")

                        # 准备内容进行AI处理
                        content = f"Title: {article['title']}\nAuthor: {article.get('author', '')}\nPlatform: Zenn"
                        if article_details and article_details.get("content"):
                            content += f"\nContent: {article_details['content'][:300]}"

                        # AI处理
                        summary = None
                        chinese_tags = []
                        trial_suggestion = None

                        if azure_openai_service.is_available():
                            try:
                                # 生成摘要
                                if settings.enable_summarization:
                                    summary = await azure_openai_service.summarize_content(
                                        content, "zenn", settings.default_language
                                    )
                            except Exception as e:
                                logger.warning(f"Failed to generate summary for {article['title'][:50]}: {e}")

                            try:
                                # 提取标签
                                chinese_tags = await azure_openai_service.extract_tags(
                                    content, settings.default_language
                                )
                            except Exception as e:
                                logger.warning(f"Failed to extract tags for {article['title'][:50]}: {e}")

                            try:
                                # 生成试用建议
                                trial_suggestion = await azure_openai_service.generate_trial_suggestion(
                                    content, settings.default_language
                                )
                            except Exception as e:
                                logger.warning(f"Failed to generate trial suggestion for {article['title'][:50]}: {e}")

                        # 构建基础摘要
                        base_summary = f"作者: {article.get('author', 'Unknown')}"
                        if article.get('likes'):
                            base_summary += f", 点赞: {article['likes']}"
                        if article.get('keyword'):
                            base_summary += f", 关键词: {article['keyword']}"

                        # 准备标签
                        tags = chinese_tags if chinese_tags else []
                        if article_details and article_details.get("tags"):
                            tags.extend(article_details["tags"][:3])
                        if article.get('keyword'):
                            tags.append(article['keyword'])

                        # 去重并限制标签数量
                        unique_tags = list(dict.fromkeys(tags))[:5]

                        card = TechCard(
                            title=article["title"],
                            source=SourceType.ZENN,
                            original_url=article["url"],
                            summary=summary or base_summary,
                            chinese_tags=unique_tags,
                            trial_suggestion=trial_suggestion,
                            raw_data={
                                **article,
                                "article_details": article_details
                            }
                        )
                        db.add(card)
                        db.commit()  # Commit each article individually
                        saved_count += 1
                        logger.info(f"Saved Zenn article: {article['title'][:60]}...")

                except Exception as e:
                    logger.error(f"Error processing Zenn article {article.get('title', 'Unknown')[:50]}: {e}")
                    db.rollback()
                    continue

            db.close()
            
            logger.info(f"Collected {saved_count} Zenn articles")
            return saved_count
            
        except Exception as e:
            logger.error(f"Error collecting Zenn data: {e}")
            return 0