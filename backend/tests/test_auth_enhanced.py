"""
Unit tests for enhanced authentication system
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.database import Base
from app.core.security_enhanced import (
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
    verify_totp_code,
    generate_backup_codes,
    hash_backup_code,
    verify_backup_code,
)
from app.models.user import User


# ==================== Fixtures ====================

@pytest.fixture(scope="function")
def test_db():
    """创建测试数据库"""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(test_db):
    """创建测试用户"""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=get_password_hash("Test123456"),
        display_name="Test User",
        is_active=True,
        email_verified=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


# ==================== Password Tests ====================

def test_password_hashing():
    """测试密码加密"""
    password = "MySecurePassword123"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("WrongPassword", hashed)


def test_password_hash_uniqueness():
    """测试密码哈希唯一性（盐值）"""
    password = "SamePassword123"
    hash1 = get_password_hash(password)
    hash2 = get_password_hash(password)

    assert hash1 != hash2  # 不同的盐值应该产生不同的哈希
    assert verify_password(password, hash1)
    assert verify_password(password, hash2)


# ==================== JWT Token Tests ====================

def test_create_and_verify_access_token():
    """测试创建和验证访问令牌"""
    data = {"sub": 1, "username": "testuser"}
    token = create_access_token(data)

    assert token
    payload = verify_token(token, expected_type="access")
    assert payload
    assert payload["sub"] == 1
    assert payload["username"] == "testuser"
    assert payload["type"] == "access"


def test_create_and_verify_refresh_token():
    """测试创建和验证刷新令牌"""
    data = {"sub": 1, "username": "testuser"}
    token, expires_at = create_refresh_token(data)

    assert token
    assert expires_at > datetime.utcnow()

    payload = verify_token(token, expected_type="refresh")
    assert payload
    assert payload["sub"] == 1
    assert payload["type"] == "refresh"


def test_expired_token():
    """测试过期令牌"""
    data = {"sub": 1, "username": "testuser"}
    # 创建已过期的令牌
    token = create_access_token(data, expires_delta=timedelta(seconds=-1))

    payload = verify_token(token, expected_type="access")
    assert payload is None  # 过期令牌应该返回 None


def test_wrong_token_type():
    """测试错误的令牌类型"""
    data = {"sub": 1, "username": "testuser"}
    access_token = create_access_token(data)

    # 尝试用 access token 作为 refresh token 验证
    payload = verify_token(access_token, expected_type="refresh")
    assert payload is None


# ==================== Email Verification Tests ====================

def test_email_verification_token():
    """测试邮箱验证令牌"""
    email = "test@example.com"
    token = create_email_verification_token(email)

    assert token
    verified_email = verify_email_verification_token(token)
    assert verified_email == email


def test_email_verification_token_expiry():
    """测试邮箱验证令牌过期"""
    email = "test@example.com"
    token = create_email_verification_token(email)

    # 测试已过期的令牌（1 秒最大年龄）
    verified_email = verify_email_verification_token(token, max_age=1)
    if verified_email:
        # 如果立即验证成功，等待 2 秒后再次验证
        import time
        time.sleep(2)
        verified_email = verify_email_verification_token(token, max_age=1)
        assert verified_email is None


def test_invalid_email_verification_token():
    """测试无效的邮箱验证令牌"""
    invalid_token = "invalid.token.here"
    verified_email = verify_email_verification_token(invalid_token)
    assert verified_email is None


# ==================== Password Reset Tests ====================

def test_password_reset_token():
    """测试密码重置令牌"""
    email = "test@example.com"
    token = create_password_reset_token(email)

    assert token
    verified_email = verify_password_reset_token(token)
    assert verified_email == email


def test_password_reset_token_expiry():
    """测试密码重置令牌过期"""
    email = "test@example.com"
    token = create_password_reset_token(email)

    # 测试已过期的令牌
    import time
    time.sleep(2)
    verified_email = verify_password_reset_token(token, max_age=1)
    assert verified_email is None


# ==================== MFA / TOTP Tests ====================

def test_generate_mfa_secret():
    """测试生成 MFA 密钥"""
    secret = generate_mfa_secret()
    assert secret
    assert len(secret) == 32  # Base32 编码的密钥长度


def test_totp_code_verification():
    """测试 TOTP 验证码验证"""
    import pyotp

    secret = generate_mfa_secret()
    totp = pyotp.TOTP(secret)

    # 生成当前有效的验证码
    current_code = totp.now()

    # 验证正确的代码
    assert verify_totp_code(secret, current_code)

    # 验证错误的代码
    assert not verify_totp_code(secret, "000000")


def test_backup_codes():
    """测试备用验证码"""
    codes = generate_backup_codes(count=5)

    assert len(codes) == 5
    assert all(len(code) == 8 for code in codes)  # 8 位十六进制
    assert len(set(codes)) == 5  # 所有代码唯一


def test_backup_code_verification():
    """测试备用验证码验证"""
    codes = generate_backup_codes(count=3)
    hashed_codes = [hash_backup_code(code) for code in codes]

    # 验证正确的备用码
    assert verify_backup_code(codes[0], hashed_codes)
    assert verify_backup_code(codes[1], hashed_codes)

    # 验证错误的备用码
    assert not verify_backup_code("WRONGCODE", hashed_codes)


def test_backup_code_hash_uniqueness():
    """测试备用验证码哈希唯一性"""
    code = "TESTCODE"
    hash1 = hash_backup_code(code)
    hash2 = hash_backup_code(code)

    # 哈希应该是确定性的（相同输入产生相同输出）
    assert hash1 == hash2


# ==================== User Model Tests ====================

def test_create_user(test_db):
    """测试创建用户"""
    user = User(
        username="newuser",
        email="newuser@example.com",
        hashed_password=get_password_hash("Password123"),
        display_name="New User"
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.id
    assert user.username == "newuser"
    assert user.email == "newuser@example.com"
    assert user.is_active
    assert not user.email_verified
    assert not user.mfa_enabled


def test_oauth_user(test_db):
    """测试 OAuth 用户"""
    user = User(
        username="oauth_user",
        email="oauth@example.com",
        display_name="OAuth User",
        oauth_provider="google",
        oauth_id="12345678",
        email_verified=True,  # OAuth 用户邮箱已验证
        hashed_password=None  # OAuth 用户没有密码
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.oauth_provider == "google"
    assert user.oauth_id == "12345678"
    assert user.email_verified
    assert user.hashed_password is None


def test_user_mfa_setup(test_db, test_user):
    """测试用户 MFA 设置"""
    secret = generate_mfa_secret()
    backup_codes = generate_backup_codes()
    hashed_backup_codes = [hash_backup_code(code) for code in backup_codes]

    test_user.mfa_enabled = True
    test_user.mfa_secret = secret
    test_user.backup_codes = hashed_backup_codes
    test_db.commit()

    assert test_user.mfa_enabled
    assert test_user.mfa_secret == secret
    assert len(test_user.backup_codes) == len(backup_codes)


# ==================== Integration Tests ====================

def test_user_registration_flow(test_db):
    """测试用户注册流程"""
    # 1. 创建用户
    password = "SecurePassword123"
    user = User(
        username="reguser",
        email="reguser@example.com",
        hashed_password=get_password_hash(password),
        display_name="Registration Test User",
        email_verified=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    # 2. 生成邮箱验证令牌
    verification_token = create_email_verification_token(user.email)
    user.email_verification_token = verification_token
    test_db.commit()

    # 3. 验证邮箱
    verified_email = verify_email_verification_token(verification_token)
    assert verified_email == user.email

    user.email_verified = True
    user.email_verification_token = None
    test_db.commit()

    assert user.email_verified


def test_password_reset_flow(test_db, test_user):
    """测试密码重置流程"""
    # 1. 请求密码重置
    reset_token = create_password_reset_token(test_user.email)
    test_user.password_reset_token = reset_token
    test_db.commit()

    # 2. 验证重置令牌
    verified_email = verify_password_reset_token(reset_token)
    assert verified_email == test_user.email

    # 3. 重置密码
    new_password = "NewPassword456"
    test_user.hashed_password = get_password_hash(new_password)
    test_user.password_reset_token = None
    test_user.password_changed_at = datetime.utcnow()
    test_db.commit()

    # 4. 验证新密码
    assert verify_password(new_password, test_user.hashed_password)


def test_login_with_mfa_flow(test_db, test_user):
    """测试 MFA 登录流程"""
    import pyotp

    # 1. 设置 MFA
    secret = generate_mfa_secret()
    test_user.mfa_enabled = True
    test_user.mfa_secret = secret
    test_db.commit()

    # 2. 模拟登录 - 验证密码
    assert verify_password("Test123456", test_user.hashed_password)

    # 3. 验证 TOTP
    totp = pyotp.TOTP(secret)
    current_code = totp.now()
    assert verify_totp_code(secret, current_code)

    # 4. 生成令牌
    access_token = create_access_token(
        data={"sub": test_user.id, "username": test_user.username}
    )
    refresh_token, refresh_expires = create_refresh_token(
        data={"sub": test_user.id, "username": test_user.username}
    )

    test_user.refresh_token = refresh_token
    test_user.refresh_token_expires_at = refresh_expires
    test_user.last_login = datetime.utcnow()
    test_db.commit()

    # 5. 验证令牌
    payload = verify_token(access_token, expected_type="access")
    assert payload["sub"] == test_user.id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
