import asyncio
from typing import List, Dict
from sqlalchemy.orm import Session
from datetime import datetime
from ..models.card import TechCard, SourceType
from ..models.config import DataSourceHealth, HealthStatus, DataSource
from ..core.database import SessionLocal
from .scrapers import GitHubScraper, ArxivScraper, HuggingFaceScraper, ZennScraper
from .ai.azure_openai import azure_openai_service
from ..core.config import settings
import logging
import re

logger = logging.getLogger(__name__)


def generate_short_summary(summary: str) -> str:
    """从完整摘要生成简短摘要（1-2句话，用于卡片列表）"""
    if not summary:
        return ""

    # 移除多余空格和换行
    summary = summary.strip()
    summary = re.sub(r'\s+', ' ', summary)

    # 尝试找到第一句话（以句号、问号、感叹号结束）
    # 支持中文和英文标点
    sentence_end = re.search(r'[。！？\.!\?]', summary)
    if sentence_end:
        first_sentence = summary[:sentence_end.end()].strip()
        # 如果第一句话太短，尝试取两句话
        if len(first_sentence) < 50 and sentence_end.end() < len(summary):
            second_end = re.search(r'[。！？\.!\?]', summary[sentence_end.end():])
            if second_end:
                return summary[:sentence_end.end() + second_end.end()].strip()
        return first_sentence

    # 如果没有找到句号，取前120个字符
    if len(summary) > 120:
        return summary[:120] + "..."

    return summary


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
            # 获取GitHub数据源配置
            github_config = db.query(DataSource).filter(
                DataSource.name == "github"
            ).first()

            # 获取最小星数要求（默认100）
            min_stars = github_config.min_stars if github_config else 100

            # 检查数据源是否启用
            if github_config and not github_config.is_enabled:
                logger.info("GitHub data source is disabled, skipping collection")
                return 0

            logger.info(f"Collecting GitHub repos with min_stars >= {min_stars}")

            # 使用新的每日trending算法获取最新项目
            daily_trending = await self.github_scraper.get_daily_trending_repos(
                language="python", limit=25, min_stars=min_stars
            )
            ai_repos = await self.github_scraper.get_ai_python_repos(
                since="daily", min_stars=min_stars
            )

            # 合并并去重
            all_repos = daily_trending + ai_repos
            unique_repos = list({repo["url"]: repo for repo in all_repos}.values())

            # 按trending得分和更新时间排序，确保获取最新内容
            unique_repos.sort(key=lambda x: (x.get("trending_score", 0), x.get("updated_at", "")), reverse=True)
            unique_repos = unique_repos[:25]  # 增加到25个项目

            # 再次应用星数筛选（双重保险）
            unique_repos = [repo for repo in unique_repos if repo.get("stars", 0) >= min_stars]

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
                    
                    full_summary = summary or repo.get("description", "")
                    card = TechCard(
                        title=repo["title"],
                        source=SourceType.GITHUB,
                        original_url=repo["url"],
                        short_summary=generate_short_summary(full_summary),
                        summary=full_summary,
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
                    full_summary = summary or base_summary

                    card = TechCard(
                        title=paper["title"],
                        source=SourceType.ARXIV,
                        original_url=paper["url"],
                        short_summary=generate_short_summary(full_summary),
                        summary=full_summary,
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
            db = SessionLocal()

            # 获取HuggingFace数据源配置
            hf_config = db.query(DataSource).filter(
                DataSource.name == "huggingface"
            ).first()

            # 获取最小likes要求（默认20）
            min_likes = hf_config.min_likes if hf_config else 20

            # 检查数据源是否启用
            if hf_config and not hf_config.is_enabled:
                logger.info("HuggingFace data source is disabled, skipping")
                db.close()
                return 0

            logger.info(f"Collecting HuggingFace models with min_likes >= {min_likes}")

            # 收集热门模型和每日trending模型（传入min_likes参数）
            trending_models = await self.hf_scraper.get_trending_models(limit=15)
            daily_models = await self.hf_scraper.get_daily_trending_models(
                limit=15, min_likes=min_likes
            )
            datasets = await self.hf_scraper.get_trending_datasets(limit=10)

            # 合并并去重
            all_items = trending_models + daily_models + datasets
            unique_items = {item["url"]: item for item in all_items}.values()

            # 再次应用likes筛选（双重保险）
            unique_items = [
                item for item in unique_items
                if item.get("likes", 0) >= min_likes
            ]

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
                    full_summary = summary or base_summary

                    card = TechCard(
                        title=item["title"],
                        source=SourceType.HUGGINGFACE,
                        original_url=item["url"],
                        short_summary=generate_short_summary(full_summary),
                        summary=full_summary,
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
            db = SessionLocal()

            # 获取Zenn数据源配置
            zenn_config = db.query(DataSource).filter(
                DataSource.name == "zenn"
            ).first()

            # 获取最小いいね要求（默认20）
            min_likes = zenn_config.min_likes if zenn_config else 20

            # 检查数据源是否启用
            if zenn_config and not zenn_config.is_enabled:
                logger.info("Zenn data source is disabled, skipping collection")
                db.close()
                return 0

            logger.info(f"Collecting Zenn articles with min_likes >= {min_likes}")

            # 使用新的最近文章方法获取一个月内的文章（传入min_likes参数）
            recent_articles = await self.zenn_scraper.get_trending_articles(
                limit=30, min_likes=min_likes
            )
            tech_articles = await self.zenn_scraper.get_tech_articles(
                limit=10, min_likes=min_likes
            )

            # 合并并去重
            all_articles = recent_articles + tech_articles
            unique_articles = {article["url"]: article for article in all_articles}.values()

            # 再次应用likes筛选（双重保险）
            unique_articles = [
                article for article in unique_articles
                if article.get("likes", 0) >= min_likes
            ]

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

                        # 构建基础摘要 (使用英文标签以支持国际化)
                        base_summary = f"Author: {article.get('author', 'Unknown')}"
                        if article.get('likes'):
                            base_summary += f", Likes: {article['likes']}"
                        if article.get('keyword'):
                            base_summary += f", Keyword: {article['keyword']}"

                        # 准备标签
                        tags = chinese_tags if chinese_tags else []
                        if article_details and article_details.get("tags"):
                            tags.extend(article_details["tags"][:3])
                        if article.get('keyword'):
                            tags.append(article['keyword'])

                        # 去重并限制标签数量
                        unique_tags = list(dict.fromkeys(tags))[:5]

                        full_summary = summary or base_summary
                        card = TechCard(
                            title=article["title"],
                            source=SourceType.ZENN,
                            original_url=article["url"],
                            short_summary=generate_short_summary(full_summary),
                            summary=full_summary,
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