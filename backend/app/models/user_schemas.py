from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模型"""
    password: str = Field(..., min_length=6, max_length=100)


class UserLogin(BaseModel):
    """用户登录模型"""
    username: str
    password: str


class UserUpdate(BaseModel):
    """用户更新模型"""
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token 响应模型"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token 数据模型"""
    user_id: Optional[int] = None
    username: Optional[str] = None


class LoginResponse(BaseModel):
    """登录响应模型"""
    token: str
    token_type: str = "bearer"
    user: UserResponse
