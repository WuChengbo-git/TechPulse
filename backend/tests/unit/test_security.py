"""
Unit Tests for Security Module (app/core/security.py)

Tests password hashing, JWT token generation/verification,
and other security-related functions.
"""
import pytest
from datetime import datetime, timedelta
from jose import jwt

from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token,
    SECRET_KEY,
)
from app.core.config import settings


# ==================== Password Hashing Tests ====================

@pytest.mark.unit
@pytest.mark.security
class TestPasswordHashing:
    """Tests for password hashing functions"""

    def test_password_hashing_basic(self):
        """Test basic password hashing"""
        password = "MySecurePassword123"
        hashed = get_password_hash(password)

        # Hashed password should be different from original
        assert hashed != password
        # Hashed password should not be empty
        assert hashed
        # Hashed password should contain argon2 identifier
        assert hashed.startswith("$argon2")

    def test_password_verification_correct(self):
        """Test password verification with correct password"""
        password = "CorrectPassword456"
        hashed = get_password_hash(password)

        # Should verify successfully
        assert verify_password(password, hashed) is True

    def test_password_verification_incorrect(self):
        """Test password verification with incorrect password"""
        password = "CorrectPassword456"
        wrong_password = "WrongPassword789"
        hashed = get_password_hash(password)

        # Should fail verification
        assert verify_password(wrong_password, hashed) is False

    def test_password_hash_uniqueness(self):
        """Test that same password produces different hashes (salt)"""
        password = "SamePassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to different salts
        assert hash1 != hash2
        # But both should verify the same password
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_empty_password(self):
        """Test hashing empty password"""
        password = ""
        hashed = get_password_hash(password)

        # Should still create a hash
        assert hashed
        # Should verify empty password
        assert verify_password("", hashed) is True
        # Should not verify non-empty password
        assert verify_password("something", hashed) is False

    def test_password_with_special_characters(self):
        """Test password with special characters"""
        password = "P@ssw0rd!#$%^&*()_+-=[]{}|;:',.<>?/`~"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    def test_password_case_sensitivity(self):
        """Test that password verification is case-sensitive"""
        password = "CaseSensitive123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("casesensitive123", hashed) is False
        assert verify_password("CASESENSITIVE123", hashed) is False

    def test_long_password(self):
        """Test hashing very long password"""
        password = "a" * 1000  # 1000 character password
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True
        assert verify_password("a" * 999, hashed) is False


# ==================== JWT Token Tests ====================

@pytest.mark.unit
@pytest.mark.security
class TestJWTTokens:
    """Tests for JWT token functions"""

    def test_create_access_token_basic(self):
        """Test basic JWT token creation"""
        data = {"sub": 1, "username": "testuser"}
        token = create_access_token(data)

        # Token should be created
        assert token
        # Token should be a string
        assert isinstance(token, str)
        # Token should have 3 parts (header.payload.signature)
        assert len(token.split('.')) == 3

    def test_create_access_token_with_user_id(self):
        """Test token creation with user ID"""
        user_id = "42"  # JWT 'sub' must be string
        data = {"sub": user_id, "username": "testuser"}
        token = create_access_token(data)

        # Decode and verify
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )
        assert payload["sub"] == user_id
        assert payload["username"] == "testuser"

    def test_create_access_token_with_expiry(self):
        """Test token creation with custom expiry"""
        data = {"sub": "1", "username": "testuser"}  # JWT 'sub' must be string
        expires_delta = timedelta(hours=2)
        token = create_access_token(data, expires_delta=expires_delta)

        # Decode and check expiry
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        exp_timestamp = payload["exp"]
        # Use utcfromtimestamp to match utcnow()
        exp_datetime = datetime.utcfromtimestamp(exp_timestamp)
        now = datetime.utcnow()

        # Should expire roughly 2 hours from now (allow 1 minute tolerance)
        time_diff = (exp_datetime - now).total_seconds()
        assert 7140 < time_diff < 7260  # ~2 hours = 7200 seconds ± 60 seconds

    def test_decode_access_token_valid(self):
        """Test decoding valid access token"""
        data = {"sub": "123", "username": "validuser"}  # JWT 'sub' must be string
        token = create_access_token(data)

        # Decode token
        token_data = decode_access_token(token)

        assert token_data is not None
        # user_id is stored as integer after decoding
        assert token_data.user_id == 123
        assert token_data.username == "validuser"

    def test_decode_access_token_expired(self):
        """Test decoding expired token"""
        from fastapi import HTTPException

        data = {"sub": "1", "username": "testuser"}  # JWT 'sub' must be string
        # Create token that expires in the past
        expired_token = create_access_token(
            data,
            expires_delta=timedelta(seconds=-10)
        )

        # Should raise HTTPException for expired token
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(expired_token)
        assert exc_info.value.status_code == 401

    def test_decode_access_token_invalid_signature(self):
        """Test decoding token with invalid signature"""
        from fastapi import HTTPException

        data = {"sub": "1", "username": "testuser"}  # JWT 'sub' must be string
        token = create_access_token(data)

        # Tamper with the token
        parts = token.split('.')
        tampered_token = parts[0] + '.' + parts[1] + '.' + 'invalid_signature'

        # Should raise HTTPException for invalid token
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(tampered_token)
        assert exc_info.value.status_code == 401

    def test_decode_access_token_malformed(self):
        """Test decoding malformed token"""
        from fastapi import HTTPException

        invalid_tokens = [
            "not.a.token",
            "invalid",
            "",
            "abc",
        ]

        for invalid_token in invalid_tokens:
            with pytest.raises(HTTPException) as exc_info:
                decode_access_token(invalid_token)
            assert exc_info.value.status_code == 401

    def test_token_contains_required_fields(self):
        """Test that token contains all required fields"""
        data = {"sub": "999", "username": "fulluser"}  # JWT 'sub' must be string
        token = create_access_token(data)

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        # Check required fields
        assert "sub" in payload
        assert "username" in payload
        assert "exp" in payload
        assert isinstance(payload["exp"], int)

    def test_token_data_integrity(self):
        """Test that data in token matches original data"""
        original_data = {
            "sub": "777",  # JWT 'sub' must be string
            "username": "integrity_test",
            "role": "admin",
            "email": "test@example.com"
        }
        token = create_access_token(original_data)

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        # Verify all original data is preserved
        assert payload["sub"] == original_data["sub"]
        assert payload["username"] == original_data["username"]
        assert payload["role"] == original_data["role"]
        assert payload["email"] == original_data["email"]


# ==================== Edge Cases ====================

@pytest.mark.unit
@pytest.mark.security
class TestSecurityEdgeCases:
    """Tests for edge cases and boundary conditions"""

    def test_verify_password_with_none(self):
        """Test password verification with None values"""
        hashed = get_password_hash("password123")

        # None password with valid hash should raise TypeError
        with pytest.raises(TypeError):
            verify_password(None, hashed)

        # None hash should return False (passlib behavior)
        assert verify_password("password123", None) is False

        # Both None should also return False (passlib behavior)
        assert verify_password(None, None) is False

    def test_unicode_password(self):
        """Test password with Unicode characters"""
        passwords = [
            "密码123",  # Chinese
            "パスワード",  # Japanese
            "🔐🔑💻",  # Emojis
            "Пароль123",  # Russian
        ]

        for password in passwords:
            hashed = get_password_hash(password)
            assert verify_password(password, hashed) is True
            assert verify_password("wrong", hashed) is False

    def test_token_with_empty_data(self):
        """Test creating token with minimal/empty data"""
        from fastapi import HTTPException

        token = create_access_token({})

        # Should raise exception because 'sub' is None
        with pytest.raises(HTTPException) as exc_info:
            decode_access_token(token)
        assert exc_info.value.status_code == 401

    def test_token_with_large_payload(self):
        """Test creating token with large payload"""
        large_data = {
            "sub": "1",  # JWT 'sub' must be string
            "username": "user",
            "data": "x" * 10000  # Large string
        }
        token = create_access_token(large_data)

        # Should handle large payload
        assert token
        token_data = decode_access_token(token)
        # Just verify we can decode it successfully
        assert token_data.user_id == 1
        assert token_data.username == "user"


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "unit"])
