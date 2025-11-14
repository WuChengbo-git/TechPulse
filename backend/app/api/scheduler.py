"""
数据收集调度器 API
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from datetime import datetime
import logging
import subprocess
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scheduler", tags=["scheduler"])


@router.get("/status")
async def get_scheduler_status() -> Dict[str, Any]:
    """
    获取调度器状态

    返回：
    - running: 是否运行中
    - pid: 进程ID
    - uptime: 运行时长
    - last_collection_time: 最后收集时间
    """
    try:
        # 检查PID文件
        pid_file = "/home/AI/TechPulse/logs/scheduler.pid"

        if not os.path.exists(pid_file):
            return {
                "running": False,
                "message": "调度器未运行（PID文件不存在）"
            }

        # 读取PID
        with open(pid_file, 'r') as f:
            pid = int(f.read().strip())

        # 检查进程是否存在
        try:
            # 检查进程是否运行（添加rss获取实际内存使用）
            result = subprocess.run(
                ['ps', '-p', str(pid), '-o', 'pid,etime,pcpu,pmem,rss'],
                capture_output=True,
                text=True,
                timeout=5
            )

            if result.returncode != 0:
                return {
                    "running": False,
                    "message": f"调度器进程 (PID: {pid}) 不存在",
                    "pid": pid
                }

            # 解析进程信息
            lines = result.stdout.strip().split('\n')
            if len(lines) < 2:
                return {
                    "running": False,
                    "message": "无法获取进程信息"
                }

            # 提取进程信息（跳过标题行）
            process_info = lines[1].split()
            uptime = process_info[1] if len(process_info) > 1 else "unknown"
            cpu_usage = process_info[2] if len(process_info) > 2 else "0"
            mem_percent = process_info[3] if len(process_info) > 3 else "0"
            mem_rss = process_info[4] if len(process_info) > 4 else "0"  # RSS in KB

            # 将RSS从KB转换为MB
            try:
                mem_mb = float(mem_rss) / 1024
            except:
                mem_mb = 0

            # 获取数据库统计信息
            from ..core.database import SessionLocal
            from ..models.card import TechCard
            from datetime import timedelta

            db = SessionLocal()

            # 今天和昨天的数据统计
            now = datetime.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday_start = today_start - timedelta(days=1)

            # 总数据量
            total_cards = db.query(TechCard).count()

            # 今天收集的数据
            today_cards = db.query(TechCard).filter(
                TechCard.created_at >= today_start
            ).count()

            # 昨天收集的数据
            yesterday_cards = db.query(TechCard).filter(
                TechCard.created_at >= yesterday_start,
                TechCard.created_at < today_start
            ).count()

            # 最后收集的卡片
            last_card = db.query(TechCard).order_by(
                TechCard.created_at.desc()
            ).first()

            last_collection_time = last_card.created_at.isoformat() if last_card else None

            # 按来源统计
            from sqlalchemy import func as sql_func
            source_stats = db.query(
                TechCard.source,
                sql_func.count(TechCard.id)
            ).filter(
                TechCard.created_at >= yesterday_start
            ).group_by(TechCard.source).all()

            source_distribution = {
                source.value if hasattr(source, 'value') else str(source): count
                for source, count in source_stats
            }

            db.close()

            return {
                "running": True,
                "pid": pid,
                "uptime": uptime,
                "cpu_usage": float(cpu_usage),
                "mem_usage": float(mem_percent),
                "mem_mb": round(mem_mb, 1),  # 实际内存使用（MB）
                "last_collection_time": last_collection_time,
                "statistics": {
                    "total_cards": total_cards,
                    "today_cards": today_cards,
                    "yesterday_cards": yesterday_cards,
                    "source_distribution": source_distribution
                },
                "schedule": {
                    "incremental_update": "2_hours",
                    "full_update": "daily_02:00",
                    "health_check": "1_hour"
                }
            }

        except subprocess.TimeoutExpired:
            return {
                "running": False,
                "message": "检查进程状态超时",
                "pid": pid
            }
        except Exception as e:
            logger.error(f"Error checking process: {e}")
            return {
                "running": False,
                "message": f"检查进程时出错: {str(e)}",
                "pid": pid
            }

    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trigger")
async def trigger_collection() -> Dict[str, Any]:
    """
    手动触发数据收集

    这将立即启动一次数据收集任务
    """
    try:
        import asyncio
        from ..services.data_collector import DataCollector

        logger.info("Manual data collection triggered")

        # 创建收集器并执行收集
        collector = DataCollector()

        # 在后台执行收集（不阻塞请求）
        async def collect_in_background():
            try:
                results = await collector.collect_all_sources()
                logger.info(f"Manual collection completed: {results}")
            except Exception as e:
                logger.error(f"Error in manual collection: {e}")

        # 启动后台任务
        asyncio.create_task(collect_in_background())

        return {
            "success": True,
            "message": "数据收集已启动，请稍后查看结果",
            "triggered_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error triggering collection: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
async def get_scheduler_logs(lines: int = 50) -> Dict[str, Any]:
    """
    获取调度器日志

    参数:
    - lines: 返回的日志行数（默认50行）
    """
    try:
        log_file = "/home/AI/TechPulse/logs/scheduler.log"

        if not os.path.exists(log_file):
            return {
                "logs": [],
                "message": "日志文件不存在"
            }

        # 读取最后N行日志
        result = subprocess.run(
            ['tail', '-n', str(lines), log_file],
            capture_output=True,
            text=True,
            timeout=5
        )

        if result.returncode != 0:
            return {
                "logs": [],
                "message": "无法读取日志文件"
            }

        log_lines = result.stdout.strip().split('\n')

        return {
            "logs": log_lines,
            "total_lines": len(log_lines),
            "log_file": log_file
        }

    except Exception as e:
        logger.error(f"Error reading logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))
