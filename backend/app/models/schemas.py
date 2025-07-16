from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .card import SourceType, TrialStatus


class TechCardBase(BaseModel):
    title: str
    source: SourceType
    original_url: str
    summary: Optional[str] = None
    chinese_tags: Optional[List[str]] = None
    ai_category: Optional[List[str]] = None  # AI分类标签
    tech_stack: Optional[List[str]] = None   # 技术栈
    license: Optional[str] = None            # 开源协议
    stars: Optional[int] = 0                 # GitHub Stars
    forks: Optional[int] = 0                 # GitHub Forks
    issues: Optional[int] = 0                # Issue活跃度
    trial_suggestion: Optional[str] = None
    status: TrialStatus = TrialStatus.NOT_TRIED
    trial_notes: Optional[str] = None


class TechCardCreate(TechCardBase):
    raw_data: Optional[dict] = None


class TechCardUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    chinese_tags: Optional[List[str]] = None
    ai_category: Optional[List[str]] = None
    tech_stack: Optional[List[str]] = None
    license: Optional[str] = None
    stars: Optional[int] = None
    forks: Optional[int] = None
    issues: Optional[int] = None
    trial_suggestion: Optional[str] = None
    status: Optional[TrialStatus] = None
    trial_notes: Optional[str] = None


class TechCard(TechCardBase):
    id: int
    created_at: datetime
    updated_at: datetime
    notion_page_id: Optional[str] = None

    class Config:
        from_attributes = True


class UserConfigBase(BaseModel):
    key: str
    value: Optional[str] = None
    is_active: bool = True


class UserConfigCreate(UserConfigBase):
    pass


class UserConfigUpdate(BaseModel):
    value: Optional[str] = None
    is_active: Optional[bool] = None


class UserConfig(UserConfigBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataSourceBase(BaseModel):
    name: str
    is_enabled: bool = True
    config: Optional[str] = None


class DataSourceCreate(DataSourceBase):
    pass


class DataSource(DataSourceBase):
    id: int
    last_sync: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True