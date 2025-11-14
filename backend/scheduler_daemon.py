#!/usr/bin/env python3
"""
独立的数据收集调度器守护进程

可以独立运行，不受主应用启动/停止的影响
"""
import sys
import os
import time
import signal
import logging
from datetime import datetime
from pathlib import Path

# 添加项目路径到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.services.scheduler import TaskScheduler

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(project_root / '../logs/scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# 全局调度器实例
scheduler = None
running = True


def signal_handler(signum, frame):
    """处理退出信号"""
    global running
    logger.info(f"Received signal {signum}, shutting down...")
    running = False
    if scheduler:
        scheduler.stop_scheduler()
    sys.exit(0)


def main():
    """主函数"""
    global scheduler, running

    logger.info("=" * 60)
    logger.info("TechPulse Data Collection Scheduler Daemon")
    logger.info("=" * 60)
    logger.info(f"Started at: {datetime.now().isoformat()}")
    logger.info(f"PID: {os.getpid()}")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info("=" * 60)

    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        # 创建并启动调度器
        scheduler = TaskScheduler()
        scheduler.start_scheduler()

        logger.info("✅ Scheduler started successfully")
        logger.info("📅 Schedule:")
        logger.info(f"   - Incremental update: Every 2 hours")
        logger.info(f"   - Full update: Every day at 02:00")
        logger.info(f"   - Health check: Every hour")
        logger.info("")
        logger.info("Press Ctrl+C to stop...")
        logger.info("=" * 60)

        # 保持运行
        while running:
            time.sleep(10)

            # 每10秒检查一次调度器状态
            if scheduler and scheduler.running:
                status = scheduler.get_status()
                if status.get("last_collection_time"):
                    last_time = status["last_collection_time"]
                    # 只在整点时记录状态（避免日志过多）
                    if datetime.now().minute == 0 and datetime.now().second < 10:
                        logger.info(f"💓 Scheduler heartbeat - Last collection: {last_time}")
            else:
                logger.warning("⚠️ Scheduler is not running! Attempting to restart...")
                scheduler.start_scheduler()
                time.sleep(5)

    except Exception as e:
        logger.error(f"❌ Fatal error in scheduler daemon: {e}", exc_info=True)
        sys.exit(1)

    finally:
        if scheduler:
            scheduler.stop_scheduler()
        logger.info("👋 Scheduler daemon stopped")


if __name__ == "__main__":
    main()
