from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    """用户基础模型"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    display_name: Optional[str] = None


class UserCreate(UserBase):
    """用户创建模型"""
    password: str = Field(..., min_length=8, max_length=100)

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少为 8 位')
        if not any(char.isdigit() for char in v):
            raise ValueError('密码必须包含至少一个数字')
        if not any(char.isalpha() for char in v):
            raise ValueError('密码必须包含至少一个字母')
        return v


class UserLogin(BaseModel):
    """用户登录模型"""
    username: str
    password: str
    totp_code: Optional[str] = None  # MFA 验证码


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
    email_verified: bool
    mfa_enabled: bool
    oauth_provider: Optional[str] = None
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
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    mfa_required: bool = False  # 是否需要 MFA 验证


class TokenRefreshRequest(BaseModel):
    """刷新令牌请求"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """刷新令牌响应"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PasswordResetRequest(BaseModel):
    """密码重置请求"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """密码重置确认"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少为 8 位')
        if not any(char.isdigit() for char in v):
            raise ValueError('密码必须包含至少一个数字')
        if not any(char.isalpha() for char in v):
            raise ValueError('密码必须包含至少一个字母')
        return v


class PasswordChange(BaseModel):
    """修改密码"""
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=100)

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('密码长度至少为 8 位')
        if not any(char.isdigit() for char in v):
            raise ValueError('密码必须包含至少一个数字')
        if not any(char.isalpha() for char in v):
            raise ValueError('密码必须包含至少一个字母')
        return v


class EmailVerificationRequest(BaseModel):
    """邮箱验证请求"""
    token: str


class ResendVerificationEmail(BaseModel):
    """重新发送验证邮件"""
    email: EmailStr


# ==================== MFA Schemas ====================

class MFASetupResponse(BaseModel):
    """MFA 设置响应"""
    secret: str
    qr_code: str  # Base64 encoded QR code image
    backup_codes: List[str]


class MFAEnableRequest(BaseModel):
    """启用 MFA 请求"""
    totp_code: str  # 用户输入的验证码，确认已正确配置


class MFAVerifyRequest(BaseModel):
    """MFA 验证请求"""
    totp_code: Optional[str] = None  # TOTP 验证码
    backup_code: Optional[str] = None  # 备用验证码


class MFADisableRequest(BaseModel):
    """禁用 MFA 请求"""
    password: str
    totp_code: Optional[str] = None


# ==================== OAuth Schemas ====================

class OAuthCallbackRequest(BaseModel):
    """OAuth 回调请求"""
    code: str
    state: str


class OAuthLoginResponse(BaseModel):
    """OAuth 登录响应"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False  # 是否是新用户
