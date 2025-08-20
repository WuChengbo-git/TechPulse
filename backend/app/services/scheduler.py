import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any
from .data_collector import DataCollector
from ..core.config import settings
import schedule
import threading
import time

logger = logging.getLogger(__name__)


class TaskScheduler:
    def __init__(self):
        self.data_collector = DataCollector()
        self.running = False
        self.scheduler_thread = None
        self.last_collection_time = None
        
    def start_scheduler(self):
        """
        启动调度器
        """
        if self.running:
            logger.warning("Scheduler is already running")
            return
            
        self.running = True
        
        # 设置定时任务
        schedule.every(settings.collection_interval_hours).hours.do(self._run_data_collection)
        
        # 每天凌晨2点执行全量更新
        schedule.every().day.at("02:00").do(self._run_full_collection)
        
        # 每小时检查是否需要增量更新
        schedule.every().hour.do(self._check_incremental_update)
        
        # 启动调度器线程
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("Task scheduler started")
    
    def stop_scheduler(self):
        """
        停止调度器
        """
        self.running = False
        schedule.clear()
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=5)
        logger.info("Task scheduler stopped")
    
    def _run_scheduler(self):
        """
        调度器主循环
        """
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # 每分钟检查一次
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                time.sleep(60)
    
    def _run_data_collection(self):
        """
        运行数据收集任务
        """
        try:
            logger.info("Starting scheduled data collection")
            
            # 使用异步运行
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                results = loop.run_until_complete(self.data_collector.collect_all_sources())
                self.last_collection_time = datetime.now()
                
                logger.info(f"Scheduled collection completed: {results}")
                
                # 如果有新数据，触发AI增强
                if results["total"] > 0:
                    loop.run_until_complete(self._enhance_recent_cards())
                
            finally:
                loop.close()
                
        except Exception as e:
            logger.error(f"Error in scheduled data collection: {e}")
    
    def _run_full_collection(self):
        """
        运行全量数据收集
        """
        try:
            logger.info("Starting full data collection")
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                # 运行所有数据源的收集
                results = loop.run_until_complete(self.data_collector.collect_all_sources())
                
                logger.info(f"Full collection completed: {results}")
                
                # 对所有未处理的卡片进行AI增强
                if results["total"] > 0:
                    loop.run_until_complete(self._enhance_all_cards())
                
            finally:
                loop.close()
                
        except Exception as e:
            logger.error(f"Error in full data collection: {e}")
    
    def _check_incremental_update(self):
        """
        检查是否需要增量更新
        """
        try:
            now = datetime.now()
            
            # 如果距离上次收集超过2小时，进行增量更新
            if (not self.last_collection_time or 
                now - self.last_collection_time > timedelta(hours=2)):
                
                logger.info("Running incremental update")
                self._run_data_collection()
                
        except Exception as e:
            logger.error(f"Error in incremental update check: {e}")
    
    async def _enhance_recent_cards(self):
        """
        增强最近添加的卡片
        """
        try:
            from ..models.card import TechCard
            from ..core.database import SessionLocal
            from .ai.summarizer import AISummarizer
            
            db = SessionLocal()
            summarizer = AISummarizer()
            
            # 获取最近1小时内添加的卡片，且没有AI摘要的
            cutoff_time = datetime.now() - timedelta(hours=1)
            recent_cards = db.query(TechCard).filter(
                TechCard.created_at >= cutoff_time,
                TechCard.summary.is_(None) | (TechCard.summary == "")
            ).limit(20).all()
            
            enhanced_count = 0
            for card in recent_cards:
                try:
                    description = ""
                    if card.raw_data:
                        if card.source.value == "github":
                            description = card.raw_data.get("description", "")
                        elif card.source.value == "arxiv":
                            description = card.raw_data.get("summary", "")[:500]
                        elif card.source.value == "huggingface":
                            description = f"Downloads: {card.raw_data.get('downloads', 0)}"
                        elif card.source.value == "zenn":
                            description = card.raw_data.get("content", "")[:300]
                    
                    # 生成AI摘要
                    if not card.summary:
                        summary = await summarizer.generate_summary(
                            card.title, description, card.source.value
                        )
                        if summary:
                            card.summary = summary
                    
                    # 提取标签
                    if not card.chinese_tags:
                        tags = await summarizer.extract_tags(
                            card.title, description, card.source.value
                        )
                        if tags:
                            card.chinese_tags = tags
                    
                    # 生成试用建议
                    if not card.trial_suggestion:
                        trial_suggestion = await summarizer.generate_trial_suggestion(
                            card.title, description, card.chinese_tags or []
                        )
                        if trial_suggestion:
                            card.trial_suggestion = trial_suggestion
                    
                    enhanced_count += 1
                    
                except Exception as e:
                    logger.error(f"Error enhancing card {card.id}: {e}")
                    continue
            
            db.commit()
            db.close()
            
            if enhanced_count > 0:
                logger.info(f"Enhanced {enhanced_count} recent cards with AI")
                
        except Exception as e:
            logger.error(f"Error in _enhance_recent_cards: {e}")
    
    async def _enhance_all_cards(self):
        """
        增强所有未处理的卡片
        """
        try:
            from ..models.card import TechCard
            from ..core.database import SessionLocal
            from .ai.summarizer import AISummarizer
            
            db = SessionLocal()
            summarizer = AISummarizer()
            
            # 获取所有没有AI摘要的卡片
            unprocessed_cards = db.query(TechCard).filter(
                TechCard.summary.is_(None) | (TechCard.summary == "")
            ).limit(50).all()
            
            enhanced_count = 0
            for card in unprocessed_cards:
                try:
                    description = ""
                    if card.raw_data:
                        if card.source.value == "github":
                            description = card.raw_data.get("description", "")
                        elif card.source.value == "arxiv":
                            description = card.raw_data.get("summary", "")[:500]
                        elif card.source.value == "huggingface":
                            description = f"Downloads: {card.raw_data.get('downloads', 0)}"
                        elif card.source.value == "zenn":
                            description = card.raw_data.get("content", "")[:300]
                    
                    # 生成AI摘要
                    if not card.summary:
                        summary = await summarizer.generate_summary(
                            card.title, description, card.source.value
                        )
                        if summary:
                            card.summary = summary
                    
                    # 提取标签
                    if not card.chinese_tags:
                        tags = await summarizer.extract_tags(
                            card.title, description, card.source.value
                        )
                        if tags:
                            card.chinese_tags = tags
                    
                    # 生成试用建议
                    if not card.trial_suggestion:
                        trial_suggestion = await summarizer.generate_trial_suggestion(
                            card.title, description, card.chinese_tags or []
                        )
                        if trial_suggestion:
                            card.trial_suggestion = trial_suggestion
                    
                    enhanced_count += 1
                    
                    # 每处理10个卡片就提交一次，避免长时间占用数据库
                    if enhanced_count % 10 == 0:
                        db.commit()
                    
                except Exception as e:
                    logger.error(f"Error enhancing card {card.id}: {e}")
                    continue
            
            db.commit()
            db.close()
            
            if enhanced_count > 0:
                logger.info(f"Enhanced {enhanced_count} cards with AI")
                
        except Exception as e:
            logger.error(f"Error in _enhance_all_cards: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        获取调度器状态
        """
        return {
            "running": self.running,
            "last_collection_time": self.last_collection_time.isoformat() if self.last_collection_time else None,
            "collection_interval_hours": settings.collection_interval_hours,
            "next_scheduled_jobs": [str(job) for job in schedule.jobs],
            "scheduler_thread_alive": self.scheduler_thread.is_alive() if self.scheduler_thread else False
        }


# 全局调度器实例
task_scheduler = TaskScheduler()