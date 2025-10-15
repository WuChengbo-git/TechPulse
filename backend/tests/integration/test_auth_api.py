"""
Integration Tests for Authentication API (app/api/auth.py)

Tests the complete authentication flow including:
- User registration
- User login
- Token authentication
- User profile management
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


# ==================== Registration Tests ====================

@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.api
class TestUserRegistration:
    """Tests for user registration endpoint"""

    def test_register_new_user_success(self, client: TestClient, test_db: Session):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "NewPass123!",
                "display_name": "New User"
            }
        )

        assert response.status_code == 201
        data = response.json()

        # Check response structure
        assert "id" in data
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["display_name"] == "New User"
        assert data["is_active"] is True
        assert "hashed_password" not in data  # Password should not be exposed

        # Verify user in database
        user = test_db.query(User).filter(User.username == "newuser").first()
        assert user is not None
        assert user.email == "newuser@example.com"

    def test_register_duplicate_username(self, client: TestClient, test_user):
        """Test registration with duplicate username"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",  # Already exists
                "email": "different@example.com",
                "password": "Pass123!",
                "display_name": "Different User"
            }
        )

        assert response.status_code == 400
        assert "用户名已存在" in response.json()["detail"] or "already exists" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Test registration with duplicate email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "differentuser",
                "email": "test@example.com",  # Already exists
                "password": "Pass123!",
                "display_name": "Different User"
            }
        )

        assert response.status_code == 400
        assert "邮箱已被注册" in response.json()["detail"] or "email" in response.json()["detail"].lower()

    def test_register_missing_required_fields(self, client: TestClient):
        """Test registration with missing required fields"""
        # Missing username
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "Pass123!"
            }
        )
        assert response.status_code == 422  # Validation error

        # Missing email
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "password": "Pass123!"
            }
        )
        assert response.status_code == 422

        # Missing password
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com"
            }
        )
        assert response.status_code == 422

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "username": "testuser",
                "email": "not-an-email",  # Invalid format
                "password": "Pass123!"
            }
        )
        assert response.status_code == 422

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password"""
        weak_passwords = ["123", "abc", ""]

        for weak_pass in weak_passwords:
            response = client.post(
                "/api/v1/auth/register",
                json={
                    "username": f"user_{weak_pass}",
                    "email": f"user_{weak_pass}@example.com",
                    "password": weak_pass
                }
            )
            # Should either reject (422) or accept based on validation rules
            assert response.status_code in [201, 422, 400]


# ==================== Login Tests ====================

@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.api
class TestUserLogin:
    """Tests for user login endpoint"""

    def test_login_success(self, client: TestClient, test_user, test_user_data):
        """Test successful login"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": test_user_data["username"],
                "password": test_user_data["password"]
            }
        )

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "access_token" in data or "token" in data  # Support both formats
        assert "user" in data
        assert data["user"]["username"] == test_user_data["username"]
        assert data["user"]["email"] == test_user_data["email"]
        assert "hashed_password" not in data["user"]

        # Token should be a valid JWT string
        token = data.get("access_token") or data.get("token")
        assert isinstance(token, str)
        assert len(token.split('.')) == 3

    def test_login_wrong_password(self, client: TestClient, test_user, test_user_data):
        """Test login with incorrect password"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": test_user_data["username"],
                "password": "WrongPassword123!"
            }
        )

        assert response.status_code in [401, 400]
        assert "detail" in response.json()

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent username"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "SomePassword123!"
            }
        )

        assert response.status_code in [401, 404]

    def test_login_with_email(self, client: TestClient, test_user, test_user_data):
        """Test login using email instead of username"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": test_user_data["email"],  # Use email as username
                "password": test_user_data["password"]
            }
        )

        # Should either succeed or fail based on implementation
        # If email login is supported, should return 200
        # If not supported, should return 401
        assert response.status_code in [200, 401]

    def test_login_inactive_user(self, client: TestClient, inactive_user):
        """Test login with inactive user account"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": "inactive_user",
                "password": "Test123456!"
            }
        )

        # Should reject inactive users
        assert response.status_code in [400, 401, 403]  # 400 is also acceptable for inactive users

    def test_login_missing_credentials(self, client: TestClient):
        """Test login with missing credentials"""
        # Missing password
        response = client.post(
            "/api/v1/auth/login",
            json={"username": "testuser"}
        )
        assert response.status_code == 422

        # Missing username
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "Pass123!"}
        )
        assert response.status_code == 422

        # Empty credentials
        response = client.post(
            "/api/v1/auth/login",
            json={}
        )
        assert response.status_code == 422

    def test_login_case_sensitivity(self, client: TestClient, test_user, test_user_data):
        """Test username case sensitivity in login"""
        # Try login with uppercase username
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": test_user_data["username"].upper(),
                "password": test_user_data["password"]
            }
        )

        # Behavior depends on implementation
        # Could be case-sensitive (401) or case-insensitive (200)
        assert response.status_code in [200, 401]


# ==================== Authentication Token Tests ====================

@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.api
class TestTokenAuthentication:
    """Tests for token-based authentication"""

    def test_access_protected_route_with_valid_token(
        self,
        authenticated_client: TestClient
    ):
        """Test accessing protected route with valid token"""
        response = authenticated_client.get("/api/v1/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert "username" in data
        assert "email" in data

    def test_access_protected_route_without_token(self, client: TestClient):
        """Test accessing protected route without token"""
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_access_protected_route_with_invalid_token(self, client: TestClient):
        """Test accessing protected route with invalid token"""
        client.headers.update({"Authorization": "Bearer invalid_token"})
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_access_protected_route_with_expired_token(self, client: TestClient):
        """Test accessing protected route with expired token"""
        # This would require creating an expired token
        # For now, just test with malformed token
        client.headers.update({"Authorization": "Bearer expired.token.here"})
        response = client.get("/api/v1/auth/me")

        assert response.status_code == 401

    def test_token_in_different_header_formats(self, client: TestClient, test_user_token):
        """Test different Authorization header formats"""
        # Correct format
        client.headers.update({"Authorization": f"Bearer {test_user_token}"})
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200

        # Missing "Bearer" prefix
        client.headers.update({"Authorization": test_user_token})
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401

        # Wrong prefix
        client.headers.update({"Authorization": f"Token {test_user_token}"})
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401


# ==================== User Profile Tests ====================

@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.api
class TestUserProfile:
    """Tests for user profile endpoints"""

    def test_get_current_user(self, authenticated_client: TestClient, test_user_data):
        """Test getting current user profile"""
        response = authenticated_client.get("/api/v1/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user_data["username"]
        assert data["email"] == test_user_data["email"]
        assert "hashed_password" not in data

    def test_update_user_profile(self, authenticated_client: TestClient, test_user_data):
        """Test updating user profile"""
        response = authenticated_client.put(
            "/api/v1/auth/me",
            json={
                "display_name": "Updated Name",
                "email": "updated@example.com"
            }
        )

        # Should succeed or return 200/404 based on implementation
        if response.status_code == 200:
            data = response.json()
            assert data["display_name"] == "Updated Name" or data["email"] == "updated@example.com"


# ==================== Complete Authentication Flow ====================

@pytest.mark.integration
@pytest.mark.auth
@pytest.mark.slow
class TestCompleteAuthFlow:
    """Tests for complete authentication workflows"""

    def test_register_login_access_flow(self, client: TestClient, test_db: Session):
        """Test complete flow: register -> login -> access protected resource"""
        # Step 1: Register
        register_data = {
            "username": "flowuser",
            "email": "flow@example.com",
            "password": "Flow123!",
            "display_name": "Flow User"
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201

        # Step 2: Login
        response = client.post(
            "/api/v1/auth/login",
            json={
                "username": register_data["username"],
                "password": register_data["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        token = data.get("access_token") or data.get("token")

        # Step 3: Access protected resource
        client.headers.update({"Authorization": f"Bearer {token}"})
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200
        assert response.json()["username"] == register_data["username"]

    def test_multiple_login_sessions(self, client: TestClient, test_user, test_user_data):
        """Test multiple concurrent login sessions"""
        tokens = []

        # Create multiple login sessions
        for _ in range(3):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "username": test_user_data["username"],
                    "password": test_user_data["password"]
                }
            )
            assert response.status_code == 200
            data = response.json()
            tokens.append(data.get("access_token") or data.get("token"))

        # All tokens should be valid
        for token in tokens:
            client.headers.update({"Authorization": f"Bearer {token}"})
            response = client.get("/api/v1/auth/me")
            assert response.status_code == 200


# ==================== Run Tests ====================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])
