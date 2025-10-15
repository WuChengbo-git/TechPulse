"""
Enhanced Authentication API with OAuth2, MFA, Email Verification, and Password Reset
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from ..core.database import get_db
from ..core.security_enhanced import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
    create_email_verification_token,
    verify_email_verification_token,
    create_password_reset_token,
    verify_password_reset_token,
    generate_mfa_secret,
    generate_mfa_qr_code,
    verify_totp_code,
    generate_backup_codes,
    hash_backup_code,
    verify_backup_code,
    get_current_user,
    get_current_active_user,
    get_current_verified_user,
)
from ..core.email import (
    send_verification_email,
    send_password_reset_email,
    send_mfa_enabled_email,
)
from ..models.user import User
from ..models.auth_log import AuthLog
from ..models.user_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    LoginResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
    PasswordChange,
    EmailVerificationRequest,
    ResendVerificationEmail,
    MFASetupResponse,
    MFAEnableRequest,
    MFAVerifyRequest,
    MFADisableRequest,
)

router = APIRouter(prefix="/auth", tags=["认证（增强版）"])
logger = logging.getLogger(__name__)


def log_auth_event(
    db: Session,
    username: str,
    action: str,
    status: str,
    request: Request,
    error_message: str = None
):
    """记录认证事件"""
    try:
        auth_log = AuthLog(
            username=username,
            action=action,
            status=status,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error_message=error_message
        )
        db.add(auth_log)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log auth event: {e}")


# ==================== 注册和邮箱验证 ====================

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    用户注册（带邮箱验证）
    """
    error_msg = None
    try:
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            error_msg = "用户名已存在"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # 检查邮箱是否已存在
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            error_msg = "邮箱已被注册"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # 创建新用户
        hashed_password = get_password_hash(user_data.password)
        verification_token = create_email_verification_token(user_data.email)

        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            display_name=user_data.display_name or user_data.username,
            email_verified=False,
            email_verification_token=verification_token,
            email_verification_sent_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 发送验证邮件
        await send_verification_email(
            email=new_user.email,
            username=new_user.username,
            token=verification_token
        )

        # 记录成功日志
        log_auth_event(db, user_data.username, "register", "success", request)

        return new_user

    except HTTPException as he:
        log_auth_event(db, user_data.username, "register", "failed", request, error_msg)
        raise he
    except Exception as e:
        logger.error(f"Registration error: {e}")
        log_auth_event(db, user_data.username, "register", "failed", request, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="注册失败，请稍后重试"
        )


@router.post("/verify-email")
async def verify_email(
    data: EmailVerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    验证邮箱
    """
    email = verify_email_verification_token(data.token)
    if not email:
        log_auth_event(db, "unknown", "verify_email", "failed", request, "Invalid token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证链接无效或已过期"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        log_auth_event(db, "unknown", "verify_email", "failed", request, "User not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    if user.email_verified:
        return {"message": "邮箱已经验证过了"}

    user.email_verified = True
    user.email_verification_token = None
    db.commit()

    log_auth_event(db, user.username, "verify_email", "success", request)

    return {"message": "邮箱验证成功"}


@router.post("/resend-verification")
async def resend_verification_email(
    data: ResendVerificationEmail,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    重新发送验证邮件
    """
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # 不透露用户是否存在
        return {"message": "如果该邮箱已注册，验证邮件将发送到邮箱"}

    if user.email_verified:
        return {"message": "邮箱已经验证过了"}

    # 生成新的验证令牌
    verification_token = create_email_verification_token(user.email)
    user.email_verification_token = verification_token
    user.email_verification_sent_at = datetime.utcnow()
    db.commit()

    # 发送验证邮件
    await send_verification_email(
        email=user.email,
        username=user.username,
        token=verification_token
    )

    log_auth_event(db, user.username, "resend_verification", "success", request)

    return {"message": "验证邮件已发送"}


# ==================== 登录和令牌刷新 ====================

@router.post("/login", response_model=LoginResponse)
async def login(
    user_credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    用户登录（支持 MFA）
    """
    error_msg = None
    username = user_credentials.username

    try:
        # 查找用户（支持用户名或邮箱登录）
        user = db.query(User).filter(
            (User.username == user_credentials.username) |
            (User.email == user_credentials.username)
        ).first()

        if not user or not user.hashed_password:
            error_msg = "用户名或密码错误"
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_msg,
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 验证密码
        if not verify_password(user_credentials.password, user.hashed_password):
            error_msg = "用户名或密码错误"
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_msg,
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 检查用户是否被禁用
        if not user.is_active:
            error_msg = "账号已被禁用"
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_msg
            )

        # MFA 验证
        if user.mfa_enabled:
            if not user_credentials.totp_code:
                # 需要 MFA 验证码但未提供
                return LoginResponse(
                    access_token="",
                    refresh_token="",
                    user=UserResponse.from_orm(user),
                    mfa_required=True
                )

            # 验证 TOTP 或备用码
            valid_totp = verify_totp_code(user.mfa_secret, user_credentials.totp_code)
            valid_backup = False

            if not valid_totp and user.backup_codes:
                valid_backup = verify_backup_code(
                    user_credentials.totp_code,
                    user.backup_codes
                )
                if valid_backup:
                    # 移除已使用的备用码
                    code_hash = hash_backup_code(user_credentials.totp_code)
                    user.backup_codes.remove(code_hash)
                    db.commit()

            if not valid_totp and not valid_backup:
                error_msg = "验证码错误"
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=error_msg
                )

        # 更新最后登录时间
        user.last_login = datetime.utcnow()

        # 生成令牌
        access_token = create_access_token(
            data={"sub": user.id, "username": user.username}
        )
        refresh_token, refresh_expires = create_refresh_token(
            data={"sub": user.id, "username": user.username}
        )

        # 保存 refresh token
        user.refresh_token = refresh_token
        user.refresh_token_expires_at = refresh_expires
        db.commit()

        # 记录成功日志
        log_auth_event(db, user.username, "login", "success", request)

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.from_orm(user),
            mfa_required=False
        )

    except HTTPException as he:
        log_auth_event(db, username, "login", "failed", request, error_msg)
        raise he
    except Exception as e:
        logger.error(f"Login error: {e}")
        log_auth_event(db, username, "login", "failed", request, str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="登录失败，请稍后重试"
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    data: TokenRefreshRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    刷新访问令牌
    """
    payload = verify_token(data.refresh_token, expected_type="refresh")
    if not payload:
        log_auth_event(db, "unknown", "refresh_token", "failed", request, "Invalid token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or user.refresh_token != data.refresh_token:
        log_auth_event(db, "unknown", "refresh_token", "failed", request, "Token mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的刷新令牌"
        )

    if not user.is_active:
        log_auth_event(db, user.username, "refresh_token", "failed", request, "User inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用"
        )

    # 生成新的令牌
    new_access_token = create_access_token(
        data={"sub": user.id, "username": user.username}
    )
    new_refresh_token, new_refresh_expires = create_refresh_token(
        data={"sub": user.id, "username": user.username}
    )

    # 更新 refresh token
    user.refresh_token = new_refresh_token
    user.refresh_token_expires_at = new_refresh_expires
    db.commit()

    log_auth_event(db, user.username, "refresh_token", "success", request)

    return TokenRefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )


@router.post("/logout")
async def logout(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    用户登出（清除 refresh token）
    """
    current_user.refresh_token = None
    current_user.refresh_token_expires_at = None
    db.commit()

    log_auth_event(db, current_user.username, "logout", "success", request)

    return {"message": "登出成功"}


# ==================== 密码管理 ====================

@router.post("/password/reset-request")
async def request_password_reset(
    data: PasswordResetRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    请求密码重置
    """
    user = db.query(User).filter(User.email == data.email).first()

    # 不透露用户是否存在
    if not user:
        return {"message": "如果该邮箱已注册，重置链接将发送到邮箱"}

    # 生成重置令牌
    reset_token = create_password_reset_token(user.email)
    user.password_reset_token = reset_token
    user.password_reset_sent_at = datetime.utcnow()
    db.commit()

    # 发送重置邮件
    await send_password_reset_email(
        email=user.email,
        username=user.username,
        token=reset_token
    )

    log_auth_event(db, user.username, "password_reset_request", "success", request)

    return {"message": "重置链接已发送到邮箱"}


@router.post("/password/reset-confirm")
async def confirm_password_reset(
    data: PasswordResetConfirm,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    确认密码重置
    """
    email = verify_password_reset_token(data.token)
    if not email:
        log_auth_event(db, "unknown", "password_reset_confirm", "failed", request, "Invalid token")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="重置链接无效或已过期"
        )

    user = db.query(User).filter(User.email == email).first()
    if not user:
        log_auth_event(db, "unknown", "password_reset_confirm", "failed", request, "User not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 更新密码
    user.hashed_password = get_password_hash(data.new_password)
    user.password_reset_token = None
    user.password_changed_at = datetime.utcnow()
    # 清除所有 refresh tokens
    user.refresh_token = None
    user.refresh_token_expires_at = None
    db.commit()

    log_auth_event(db, user.username, "password_reset_confirm", "success", request)

    return {"message": "密码重置成功"}


@router.post("/password/change")
async def change_password(
    data: PasswordChange,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    修改密码（需要提供旧密码）
    """
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OAuth 用户无法修改密码"
        )

    if not verify_password(data.old_password, current_user.hashed_password):
        log_auth_event(db, current_user.username, "password_change", "failed", request, "Wrong password")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码错误"
        )

    # 更新密码
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.password_changed_at = datetime.utcnow()
    # 清除所有 refresh tokens
    current_user.refresh_token = None
    current_user.refresh_token_expires_at = None
    db.commit()

    log_auth_event(db, current_user.username, "password_change", "success", request)

    return {"message": "密码修改成功，请重新登录"}


# ==================== 多因素认证 (MFA) ====================

@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(
    current_user: User = Depends(get_current_verified_user),
):
    """
    设置 MFA（生成密钥和二维码）
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA 已启用"
        )

    # 生成 MFA 密钥和备用码
    secret = generate_mfa_secret()
    qr_code = generate_mfa_qr_code(current_user.username, secret)
    backup_codes = generate_backup_codes()

    return MFASetupResponse(
        secret=secret,
        qr_code=qr_code,
        backup_codes=backup_codes
    )


@router.post("/mfa/enable")
async def enable_mfa(
    data: MFAEnableRequest,
    request: Request,
    current_user: User = Depends(get_current_verified_user),
    db: Session = Depends(get_db)
):
    """
    启用 MFA（验证 TOTP 码后启用）
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA 已启用"
        )

    # 从 setup 获取的 secret 需要客户端传回
    # 这里简化处理，实际应该从临时存储获取
    secret = request.state.get("mfa_secret")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先调用 /mfa/setup 获取密钥"
        )

    # 验证 TOTP 码
    if not verify_totp_code(secret, data.totp_code):
        log_auth_event(db, current_user.username, "mfa_enable", "failed", request, "Invalid TOTP")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )

    # 生成备用码（哈希后存储）
    backup_codes = generate_backup_codes()
    hashed_backup_codes = [hash_backup_code(code) for code in backup_codes]

    # 启用 MFA
    current_user.mfa_enabled = True
    current_user.mfa_secret = secret
    current_user.backup_codes = hashed_backup_codes
    db.commit()

    # 发送通知邮件
    await send_mfa_enabled_email(
        email=current_user.email,
        username=current_user.username
    )

    log_auth_event(db, current_user.username, "mfa_enable", "success", request)

    return {
        "message": "MFA 已启用",
        "backup_codes": backup_codes  # 返回明文备用码（仅此一次）
    }


@router.post("/mfa/disable")
async def disable_mfa(
    data: MFADisableRequest,
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    禁用 MFA
    """
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA 未启用"
        )

    # 验证密码
    if not current_user.hashed_password or not verify_password(data.password, current_user.hashed_password):
        log_auth_event(db, current_user.username, "mfa_disable", "failed", request, "Wrong password")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="密码错误"
        )

    # 如果提供了 TOTP 码，也验证
    if data.totp_code and not verify_totp_code(current_user.mfa_secret, data.totp_code):
        log_auth_event(db, current_user.username, "mfa_disable", "failed", request, "Invalid TOTP")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码错误"
        )

    # 禁用 MFA
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    current_user.backup_codes = None
    db.commit()

    log_auth_event(db, current_user.username, "mfa_disable", "success", request)

    return {"message": "MFA 已禁用"}


# ==================== 用户信息 ====================

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    获取当前用户信息
    """
    return current_user


@router.get("/check")
async def check_auth(current_user: User = Depends(get_current_active_user)):
    """
    检查认证状态
    """
    return {
        "authenticated": True,
        "user_id": current_user.id,
        "username": current_user.username,
        "email_verified": current_user.email_verified,
        "mfa_enabled": current_user.mfa_enabled
    }
