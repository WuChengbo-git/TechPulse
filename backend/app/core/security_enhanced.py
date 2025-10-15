"""
Enhanced security module with JWT refresh tokens, MFA, and OAuth support
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import secrets
import pyotp
import hashlib
import qrcode
import io
import base64
from itsdangerous import URLSafeTimedSerializer
from .config import settings
from .database import get_db
from ..models.user import User

# 密码加密上下文 - 使用 bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 密码模式
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Token 序列化器（用于邮箱验证和密码重置）
token_serializer = URLSafeTimedSerializer(
    settings.jwt_secret,
    salt="techpulse-token-salt"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """获取密码哈希"""
    # bcrypt 有 72 字节限制，先截断
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes.decode('utf-8', errors='ignore'))


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:
    """创建访问令牌（短期）"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def create_refresh_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime]:
    """创建刷新令牌（长期）"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.refresh_token_expire_days
        )

    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt, expire


def verify_token(token: str, expected_type: str = "access") -> Optional[Dict]:
    """
    验证并解码令牌

    Args:
        token: JWT 令牌
        expected_type: 期望的令牌类型（access 或 refresh）

    Returns:
        令牌负载，如果无效则返回 None
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )

        token_type = payload.get("type")
        if token_type != expected_type:
            return None

        return payload
    except JWTError:
        return None


def create_email_verification_token(email: str) -> str:
    """创建邮箱验证令牌"""
    return token_serializer.dumps(
        email,
        salt="email-verification"
    )


def verify_email_verification_token(
    token: str,
    max_age: int = None
) -> Optional[str]:
    """
    验证邮箱验证令牌

    Args:
        token: 验证令牌
        max_age: 令牌最大有效期（秒）

    Returns:
        邮箱地址，如果无效则返回 None
    """
    if max_age is None:
        max_age = settings.email_verification_token_expire_hours * 3600

    try:
        email = token_serializer.loads(
            token,
            salt="email-verification",
            max_age=max_age
        )
        return email
    except Exception:
        return None


def create_password_reset_token(email: str) -> str:
    """创建密码重置令牌"""
    return token_serializer.dumps(
        email,
        salt="password-reset"
    )


def verify_password_reset_token(
    token: str,
    max_age: int = None
) -> Optional[str]:
    """
    验证密码重置令牌

    Args:
        token: 重置令牌
        max_age: 令牌最大有效期（秒）

    Returns:
        邮箱地址，如果无效则返回 None
    """
    if max_age is None:
        max_age = settings.password_reset_token_expire_hours * 3600

    try:
        email = token_serializer.loads(
            token,
            salt="password-reset",
            max_age=max_age
        )
        return email
    except Exception:
        return None


# ==================== MFA / TOTP ====================

def generate_mfa_secret() -> str:
    """生成 MFA 密钥"""
    return pyotp.random_base32()


def generate_mfa_qr_code(username: str, secret: str) -> str:
    """
    生成 MFA 二维码（Base64 编码的图片）

    Args:
        username: 用户名
        secret: MFA 密钥

    Returns:
        Base64 编码的 QR 码图片
    """
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=username,
        issuer_name="TechPulse"
    )

    # 生成二维码
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # 转换为 Base64
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()

    return f"data:image/png;base64,{img_str}"


def verify_totp_code(secret: str, code: str) -> bool:
    """
    验证 TOTP 验证码

    Args:
        secret: MFA 密钥
        code: 用户输入的 6 位验证码

    Returns:
        验证是否通过
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)  # 允许前后 30 秒的时间差


def generate_backup_codes(count: int = 8) -> list:
    """
    生成备用验证码

    Args:
        count: 生成的验证码数量

    Returns:
        备用验证码列表
    """
    codes = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()  # 8 位十六进制
        codes.append(code)
    return codes


def hash_backup_code(code: str) -> str:
    """对备用验证码进行哈希"""
    return hashlib.sha256(code.encode()).hexdigest()


def verify_backup_code(code: str, hashed_codes: list) -> bool:
    """
    验证备用验证码

    Args:
        code: 用户输入的验证码
        hashed_codes: 已哈希的备用验证码列表

    Returns:
        验证是否通过
    """
    code_hash = hash_backup_code(code)
    return code_hash in hashed_codes


# ==================== User Authentication ====================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的认证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token, expected_type="access")
    if payload is None:
        raise credentials_exception

    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="用户账号已被禁用"
        )
    return current_user


async def get_current_verified_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """获取当前已验证邮箱的用户"""
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="请先验证邮箱"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """获取当前超级用户"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足"
        )
    return current_user


# ==================== OAuth2 Helpers ====================

def generate_oauth_state() -> str:
    """生成 OAuth 状态令牌（防止 CSRF）"""
    return secrets.token_urlsafe(32)


def create_oauth_user_data(
    provider: str,
    oauth_id: str,
    email: str,
    username: str = None,
    display_name: str = None,
    avatar_url: str = None
) -> dict:
    """
    创建 OAuth 用户数据

    Args:
        provider: OAuth 提供商（google, github, microsoft）
        oauth_id: OAuth 提供商的用户 ID
        email: 邮箱
        username: 用户名（可选）
        display_name: 显示名称（可选）
        avatar_url: 头像 URL（可选）

    Returns:
        用户数据字典
    """
    # 如果没有提供用户名，从邮箱生成
    if not username:
        username = email.split("@")[0] + "_" + secrets.token_hex(4)

    return {
        "oauth_provider": provider,
        "oauth_id": oauth_id,
        "email": email,
        "username": username,
        "display_name": display_name or username,
        "avatar_url": avatar_url,
        "email_verified": True,  # OAuth 用户邮箱已验证
        "is_active": True
    }
