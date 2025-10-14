"""
OAuth2 Integration for Google, GitHub, and Microsoft
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
from datetime import datetime
import secrets
import logging

from ..core.database import get_db
from ..core.config import settings
from ..core.security_enhanced import (
    create_access_token,
    create_refresh_token,
    create_oauth_user_data,
    generate_oauth_state,
)
from ..models.user import User
from ..models.auth_log import AuthLog
from ..models.user_schemas import OAuthLoginResponse, UserResponse

router = APIRouter(prefix="/oauth", tags=["OAuth 认证"])
logger = logging.getLogger(__name__)

# 初始化 OAuth 客户端
oauth = OAuth()

# Google OAuth
if settings.google_client_id and settings.google_client_secret:
    oauth.register(
        name='google',
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )

# GitHub OAuth
if settings.github_client_id and settings.github_client_secret:
    oauth.register(
        name='github',
        client_id=settings.github_client_id,
        client_secret=settings.github_client_secret,
        authorize_url='https://github.com/login/oauth/authorize',
        authorize_params=None,
        access_token_url='https://github.com/login/oauth/access_token',
        access_token_params=None,
        refresh_token_url=None,
        client_kwargs={'scope': 'user:email'},
    )

# Microsoft OAuth
if settings.microsoft_client_id and settings.microsoft_client_secret:
    oauth.register(
        name='microsoft',
        client_id=settings.microsoft_client_id,
        client_secret=settings.microsoft_client_secret,
        server_metadata_url='https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )


# 临时存储 OAuth state（生产环境应使用 Redis）
oauth_states = {}


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


# ==================== Google OAuth ====================

@router.get("/google/login")
async def google_login(request: Request):
    """
    Google OAuth 登录
    """
    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth 未配置"
        )

    # 生成 state 防止 CSRF
    state = generate_oauth_state()
    oauth_states[state] = {"provider": "google", "timestamp": datetime.utcnow()}

    redirect_uri = settings.oauth_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Google OAuth 回调
    """
    try:
        # 验证 state
        state = request.query_params.get("state")
        if not state or state not in oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的 state 参数"
            )

        # 获取 token
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取用户信息"
            )

        # 查找或创建用户
        oauth_id = user_info.get('sub')
        email = user_info.get('email')
        display_name = user_info.get('name')
        avatar_url = user_info.get('picture')

        user = db.query(User).filter(
            User.oauth_provider == "google",
            User.oauth_id == oauth_id
        ).first()

        is_new_user = False

        if not user:
            # 检查邮箱是否已被注册
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该邮箱已被注册，请使用密码登录"
                )

            # 创建新用户
            user_data = create_oauth_user_data(
                provider="google",
                oauth_id=oauth_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url
            )

            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True

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

        # 记录日志
        log_auth_event(db, user.username, "oauth_login_google", "success", request)

        # 清理 state
        del oauth_states[state]

        # 重定向到前端，带上 token
        redirect_url = f"{settings.frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&is_new_user={is_new_user}"
        return RedirectResponse(url=redirect_url)

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Google OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth 登录失败"
        )


# ==================== GitHub OAuth ====================

@router.get("/github/login")
async def github_login(request: Request):
    """
    GitHub OAuth 登录
    """
    if not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth 未配置"
        )

    # 生成 state 防止 CSRF
    state = generate_oauth_state()
    oauth_states[state] = {"provider": "github", "timestamp": datetime.utcnow()}

    redirect_uri = settings.oauth_redirect_uri
    return await oauth.github.authorize_redirect(request, redirect_uri, state=state)


@router.get("/github/callback")
async def github_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    GitHub OAuth 回调
    """
    try:
        # 验证 state
        state = request.query_params.get("state")
        if not state or state not in oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的 state 参数"
            )

        # 获取 token
        token = await oauth.github.authorize_access_token(request)

        # 获取用户信息
        resp = await oauth.github.get('https://api.github.com/user', token=token)
        user_info = resp.json()

        # 获取邮箱（GitHub 可能需要额外请求）
        email = user_info.get('email')
        if not email:
            email_resp = await oauth.github.get('https://api.github.com/user/emails', token=token)
            emails = email_resp.json()
            primary_email = next((e for e in emails if e.get('primary')), None)
            if primary_email:
                email = primary_email.get('email')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取邮箱信息"
            )

        oauth_id = str(user_info.get('id'))
        display_name = user_info.get('name') or user_info.get('login')
        avatar_url = user_info.get('avatar_url')

        # 查找或创建用户
        user = db.query(User).filter(
            User.oauth_provider == "github",
            User.oauth_id == oauth_id
        ).first()

        is_new_user = False

        if not user:
            # 检查邮箱是否已被注册
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该邮箱已被注册，请使用密码登录"
                )

            # 创建新用户
            user_data = create_oauth_user_data(
                provider="github",
                oauth_id=oauth_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url
            )

            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True

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

        # 记录日志
        log_auth_event(db, user.username, "oauth_login_github", "success", request)

        # 清理 state
        del oauth_states[state]

        # 重定向到前端，带上 token
        redirect_url = f"{settings.frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&is_new_user={is_new_user}"
        return RedirectResponse(url=redirect_url)

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"GitHub OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth 登录失败"
        )


# ==================== Microsoft OAuth ====================

@router.get("/microsoft/login")
async def microsoft_login(request: Request):
    """
    Microsoft OAuth 登录
    """
    if not settings.microsoft_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Microsoft OAuth 未配置"
        )

    # 生成 state 防止 CSRF
    state = generate_oauth_state()
    oauth_states[state] = {"provider": "microsoft", "timestamp": datetime.utcnow()}

    redirect_uri = settings.oauth_redirect_uri
    return await oauth.microsoft.authorize_redirect(request, redirect_uri, state=state)


@router.get("/microsoft/callback")
async def microsoft_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Microsoft OAuth 回调
    """
    try:
        # 验证 state
        state = request.query_params.get("state")
        if not state or state not in oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无效的 state 参数"
            )

        # 获取 token
        token = await oauth.microsoft.authorize_access_token(request)
        user_info = token.get('userinfo')

        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="无法获取用户信息"
            )

        oauth_id = user_info.get('sub')
        email = user_info.get('email') or user_info.get('preferred_username')
        display_name = user_info.get('name')
        avatar_url = None  # Microsoft 不提供头像 URL

        # 查找或创建用户
        user = db.query(User).filter(
            User.oauth_provider == "microsoft",
            User.oauth_id == oauth_id
        ).first()

        is_new_user = False

        if not user:
            # 检查邮箱是否已被注册
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="该邮箱已被注册，请使用密码登录"
                )

            # 创建新用户
            user_data = create_oauth_user_data(
                provider="microsoft",
                oauth_id=oauth_id,
                email=email,
                display_name=display_name,
                avatar_url=avatar_url
            )

            user = User(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True

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

        # 记录日志
        log_auth_event(db, user.username, "oauth_login_microsoft", "success", request)

        # 清理 state
        del oauth_states[state]

        # 重定向到前端，带上 token
        redirect_url = f"{settings.frontend_url}/auth/callback?access_token={access_token}&refresh_token={refresh_token}&is_new_user={is_new_user}"
        return RedirectResponse(url=redirect_url)

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Microsoft OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth 登录失败"
        )
