"""
用户偏好设置API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ..core.database import get_db
from ..models.user import User
from ..core.security import get_current_user

router = APIRouter(prefix="/preferences", tags=["preferences"])


class UserPreferences(BaseModel):
    """用户偏好设置"""
    # 关注领域
    interests: List[str] = []  # LLM, CV, RL, Agent, Multimodal, Quantization, Tools
    # 技术角色
    role: Optional[str] = None  # researcher, engineer, pm, student
    # 内容类型偏好
    content_types: List[str] = []  # papers, projects, tools, trends
    # 语言偏好
    languages: List[str] = ["zh-CN"]  # zh-CN, en-US, ja-JP
    # 是否完成了首次问卷
    onboarding_completed: bool = False


@router.get("/", response_model=UserPreferences)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取当前用户的偏好设置
    """
    # 从用户表的preferences字段读取
    preferences = current_user.preferences or {}

    return UserPreferences(
        interests=preferences.get('interests', []),
        role=preferences.get('role'),
        content_types=preferences.get('content_types', []),
        languages=preferences.get('languages', ['zh-CN']),
        onboarding_completed=preferences.get('onboarding_completed', False)
    )


@router.post("/", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    更新用户偏好设置
    """
    # 将偏好设置保存到用户表
    current_user.preferences = preferences.dict()

    db.commit()
    db.refresh(current_user)

    return preferences


@router.post("/onboarding")
async def complete_onboarding(
    preferences: UserPreferences,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    完成首次问卷并保存偏好
    """
    # 设置onboarding已完成
    preferences.onboarding_completed = True

    # 保存到数据库
    current_user.preferences = preferences.dict()

    db.commit()

    return {"message": "Onboarding completed successfully", "preferences": preferences}
