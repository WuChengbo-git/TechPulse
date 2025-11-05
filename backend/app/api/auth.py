from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from datetime import datetime
from ..core.database import get_db
from ..core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user,
    get_current_active_user,
    get_current_user_optional
)
from ..models.user import User
from ..models.auth_log import AuthLog
from ..models.user_schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    LoginResponse,
    UserUpdate
)

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    """
    用户注册
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
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            display_name=user_data.display_name or user_data.username
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # 记录成功日志
        auth_log = AuthLog(
            username=user_data.username,
            action="register",
            status="success",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(auth_log)
        db.commit()

        return new_user
    except HTTPException:
        # 记录失败日志
        auth_log = AuthLog(
            username=user_data.username,
            action="register",
            status="failed",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error_message=error_msg
        )
        db.add(auth_log)
        db.commit()
        raise


@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: UserLogin, request: Request, db: Session = Depends(get_db)):
    """
    用户登录
    """
    error_msg = None
    username = user_credentials.username

    try:
        # 查找用户（支持用户名或邮箱登录）
        user = db.query(User).filter(
            (User.username == user_credentials.username) |
            (User.email == user_credentials.username)
        ).first()

        if not user:
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
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # 更新最后登录时间
        user.last_login = datetime.utcnow()
        db.commit()

        # 生成 JWT Token
        access_token = create_access_token(
            data={"sub": user.id, "username": user.username}
        )
        refresh_token = create_refresh_token(
            data={"sub": user.id, "username": user.username}
        )

        # 记录成功日志
        auth_log = AuthLog(
            username=user.username,
            action="login",
            status="success",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )
        db.add(auth_log)
        db.commit()

        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserResponse.from_orm(user)
        )
    except HTTPException:
        # 记录失败日志
        auth_log = AuthLog(
            username=username,
            action="login",
            status="failed",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
            error_message=error_msg
        )
        db.add(auth_log)
        db.commit()
        raise


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    """
    获取当前用户信息
    """
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    更新当前用户信息
    """
    # 如果更新邮箱，检查是否已被使用
    if user_update.email and user_update.email != current_user.email:
        existing_email = db.query(User).filter(User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被使用"
            )
        current_user.email = user_update.email

    # 更新其他字段
    if user_update.display_name is not None:
        current_user.display_name = user_update.display_name

    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)

    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    用户登出（主要在前端处理，这里只是一个端点）
    """
    return {"message": "登出成功"}


@router.get("/check")
async def check_auth(current_user: User = Depends(get_current_active_user)):
    """
    检查认证状态
    """
    return {
        "authenticated": True,
        "user_id": current_user.id,
        "username": current_user.username
    }
