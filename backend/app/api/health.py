"""
数据源健康检查API
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ..core.database import get_db
from ..models.config import DataSourceHealth, HealthStatus
from ..services.data_collector import DataCollector

router = APIRouter(tags=["health"])


# Pydantic模型
class HealthRecord(BaseModel):
    id: int
    source_name: str
    check_time: datetime
    status: str
    items_collected: int
    items_expected: int
    error_message: Optional[str]
    duration_seconds: Optional[float]

    class Config:
        from_attributes = True


class HealthSummary(BaseModel):
    source_name: str
    total_checks: int
    success_count: int
    failed_count: int
    success_rate: float
    avg_duration: float
    avg_items: float
    last_check: Optional[datetime]
    last_status: Optional[str]


class SourceHealthStats(BaseModel):
    source_name: str
    status: str
    last_check: Optional[datetime]
    success_rate: float
    avg_items: float
    is_healthy: bool


@router.get("/health/sources", response_model=List[SourceHealthStats])
async def get_sources_health(
    hours: int = 24,
    db: Session = Depends(get_db)
):
    """
    获取所有数据源的健康状态概览

    Args:
        hours: 统计最近N小时的数据（默认24小时）
    """
    sources = ["github", "arxiv", "huggingface", "zenn"]
    stats = []

    cutoff_time = datetime.now() - timedelta(hours=hours)

    for source in sources:
        # 查询该数据源的健康记录
        records = db.query(DataSourceHealth).filter(
            DataSourceHealth.source_name == source,
            DataSourceHealth.check_time >= cutoff_time
        ).all()

        if not records:
            stats.append(SourceHealthStats(
                source_name=source,
                status="unknown",
                last_check=None,
                success_rate=0.0,
                avg_items=0.0,
                is_healthy=False
            ))
            continue

        # 计算统计数据
        total = len(records)
        success = sum(1 for r in records if r.status == HealthStatus.SUCCESS)
        success_rate = (success / total * 100) if total > 0 else 0
        avg_items = sum(r.items_collected for r in records) / total if total > 0 else 0

        # 最近一次检查
        last_record = max(records, key=lambda r: r.check_time)

        # 判断是否健康：成功率>80% 且 最近一次检查成功
        is_healthy = success_rate > 80 and last_record.status == HealthStatus.SUCCESS

        stats.append(SourceHealthStats(
            source_name=source,
            status=last_record.status.value,
            last_check=last_record.check_time,
            success_rate=round(success_rate, 1),
            avg_items=round(avg_items, 1),
            is_healthy=is_healthy
        ))

    return stats


@router.get("/health/sources/{source_name}", response_model=HealthSummary)
async def get_source_health_detail(
    source_name: str,
    days: int = 7,
    db: Session = Depends(get_db)
):
    """
    获取指定数据源的详细健康统计

    Args:
        source_name: 数据源名称
        days: 统计最近N天的数据（默认7天）
    """
    cutoff_time = datetime.now() - timedelta(days=days)

    records = db.query(DataSourceHealth).filter(
        DataSourceHealth.source_name == source_name,
        DataSourceHealth.check_time >= cutoff_time
    ).all()

    if not records:
        raise HTTPException(status_code=404, detail=f"No health records found for {source_name}")

    total = len(records)
    success = sum(1 for r in records if r.status == HealthStatus.SUCCESS)
    failed = sum(1 for r in records if r.status == HealthStatus.FAILED)

    # 计算平均耗时（只统计成功的）
    success_records = [r for r in records if r.status == HealthStatus.SUCCESS and r.duration_seconds]
    avg_duration = sum(r.duration_seconds for r in success_records) / len(success_records) if success_records else 0

    # 计算平均采集数
    avg_items = sum(r.items_collected for r in records) / total if total > 0 else 0

    # 最近一次检查
    last_record = max(records, key=lambda r: r.check_time)

    return HealthSummary(
        source_name=source_name,
        total_checks=total,
        success_count=success,
        failed_count=failed,
        success_rate=round((success / total * 100) if total > 0 else 0, 1),
        avg_duration=round(avg_duration, 2),
        avg_items=round(avg_items, 1),
        last_check=last_record.check_time,
        last_status=last_record.status.value
    )


@router.get("/health/sources/{source_name}/history", response_model=List[HealthRecord])
async def get_source_health_history(
    source_name: str,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    获取数据源的历史健康记录

    Args:
        source_name: 数据源名称
        limit: 返回记录数量（默认50条）
    """
    records = db.query(DataSourceHealth).filter(
        DataSourceHealth.source_name == source_name
    ).order_by(desc(DataSourceHealth.check_time)).limit(limit).all()

    return [HealthRecord(
        id=r.id,
        source_name=r.source_name,
        check_time=r.check_time,
        status=r.status.value,
        items_collected=r.items_collected,
        items_expected=r.items_expected,
        error_message=r.error_message,
        duration_seconds=r.duration_seconds
    ) for r in records]


@router.post("/health/sources/{source_name}/retry")
async def retry_source_collection(
    source_name: str,
    db: Session = Depends(get_db)
):
    """
    手动重试数据采集

    Args:
        source_name: 数据源名称（github/arxiv/huggingface/zenn）
    """
    valid_sources = ["github", "arxiv", "huggingface", "zenn"]
    if source_name not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source name. Must be one of: {valid_sources}")

    collector = DataCollector()
    start_time = datetime.now()

    try:
        # 根据数据源类型调用对应的采集方法
        if source_name == "github":
            count = await collector.collect_github_data()
        elif source_name == "arxiv":
            count = await collector.collect_arxiv_data()
        elif source_name == "huggingface":
            count = await collector.collect_huggingface_data()
        elif source_name == "zenn":
            count = await collector.collect_zenn_data()

        duration = (datetime.now() - start_time).total_seconds()

        # 记录健康检查
        health_record = DataSourceHealth(
            source_name=source_name,
            status=HealthStatus.SUCCESS,
            items_collected=count,
            items_expected=25,  # 默认预期值
            duration_seconds=duration,
            error_message=None
        )
        db.add(health_record)
        db.commit()

        return {
            "success": True,
            "source": source_name,
            "items_collected": count,
            "duration_seconds": round(duration, 2),
            "message": f"Successfully collected {count} items from {source_name}"
        }

    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()

        # 记录失败
        health_record = DataSourceHealth(
            source_name=source_name,
            status=HealthStatus.FAILED,
            items_collected=0,
            items_expected=25,
            duration_seconds=duration,
            error_message=str(e)
        )
        db.add(health_record)
        db.commit()

        raise HTTPException(status_code=500, detail=f"Collection failed: {str(e)}")


@router.delete("/health/cleanup")
async def cleanup_old_health_records(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """
    清理旧的健康检查记录

    Args:
        days: 保留最近N天的记录（默认30天）
    """
    cutoff_time = datetime.now() - timedelta(days=days)

    deleted = db.query(DataSourceHealth).filter(
        DataSourceHealth.check_time < cutoff_time
    ).delete()

    db.commit()

    return {
        "success": True,
        "deleted_records": deleted,
        "cutoff_date": cutoff_time.isoformat()
    }
