"""
Pytest Configuration and Shared Fixtures
"""
import pytest
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.core.database import Base, get_db
from app.core.security import get_password_hash
from app.main import app

# Import all models to ensure they are registered with Base.metadata
from app.models.user import User
from app.models.card import TechCard
from app.models.user_preference import UserPreference
from app.models.behavior import UserBehavior, SearchHistory, UserRecommendation


# ==================== Database Fixtures ====================

@pytest.fixture(scope="function")
def test_db() -> Generator[Session, None, None]:
    """
    Create a test database for each test function.
    Uses in-memory SQLite database with shared cache for speed.
    """
    # Create in-memory database with StaticPool to ensure all connections use the same database
    # StaticPool maintains a single connection, so all sessions share the same in-memory database
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool  # Use static pool to share the same connection
    )

    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Create session
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )

    # Store the engine for use in client fixture
    db = TestingSessionLocal()
    db._test_engine = engine
    db._test_sessionmaker = TestingSessionLocal

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture(scope="function")
def client(test_db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with overridden database dependency.
    """
    # Override the get_db dependency BEFORE creating the TestClient
    def override_get_db():
        session = test_db._test_sessionmaker()
        try:
            yield session
        finally:
            session.close()

    # Clear any existing overrides
    app.dependency_overrides.clear()
    # Set the override
    app.dependency_overrides[get_db] = override_get_db

    # Now create the test client
    with TestClient(app, raise_server_exceptions=True) as test_client:
        yield test_client

    # Clean up
    app.dependency_overrides.clear()


# ==================== User Fixtures ====================

@pytest.fixture
def test_user_data():
    """
    Test user data dictionary.
    """
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "Test123456!",
        "display_name": "Test User"
    }


@pytest.fixture
def test_user(test_db: Session, test_user_data: dict) -> User:
    """
    Create a test user in the database.
    """
    user = User(
        username=test_user_data["username"],
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        display_name=test_user_data["display_name"],
        is_active=True
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def test_user_token(client: TestClient, test_user, test_user_data: dict) -> str:
    """
    Get authentication token for test user.
    Depends on test_user to ensure user exists before login.
    """
    response = client.post(
        "/api/v1/auth/login",
        json={
            "username": test_user_data["username"],
            "password": test_user_data["password"]
        }
    )
    data = response.json()
    # Support both 'token' and 'access_token' field names
    return data.get("access_token") or data.get("token")


@pytest.fixture
def authenticated_client(client: TestClient, test_user_token: str) -> TestClient:
    """
    Create an authenticated test client.
    """
    client.headers.update({"Authorization": f"Bearer {test_user_token}"})
    return client


@pytest.fixture
def inactive_user(test_db: Session) -> User:
    """
    Create an inactive test user.
    """
    user = User(
        username="inactive_user",
        email="inactive@example.com",
        hashed_password=get_password_hash("Test123456!"),
        display_name="Inactive User",
        is_active=False
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


# ==================== Data Fixtures ====================

@pytest.fixture
def sample_tech_card_data():
    """
    Sample tech card data for testing.
    """
    return {
        "title": "Test Repository",
        "source": "github",
        "original_url": "https://github.com/test/repo",
        "summary": "A test repository for unit testing",
        "quality_score": 7.5,
        "tags": ["python", "testing", "pytest"]
    }


# ==================== Utility Fixtures ====================

@pytest.fixture
def mock_response():
    """
    Mock HTTP response factory.
    """
    class MockResponse:
        def __init__(self, status_code: int, json_data: dict = None):
            self.status_code = status_code
            self._json_data = json_data or {}

        def json(self):
            return self._json_data

    return MockResponse


# ==================== Setup and Teardown ====================

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Setup test environment before running tests.
    """
    # Setup code here (if needed)
    print("\n=== Starting Test Suite ===")

    yield

    # Teardown code here (if needed)
    print("\n=== Test Suite Completed ===")


# ==================== Helper Functions ====================

def create_test_user(
    db: Session,
    username: str = "testuser",
    email: str = "test@example.com",
    password: str = "Test123456!",
    **kwargs
) -> User:
    """
    Helper function to create test users with custom data.
    """
    user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        display_name=kwargs.get("display_name", username),
        is_active=kwargs.get("is_active", True),
        **{k: v for k, v in kwargs.items() if k not in ["display_name", "is_active"]}
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
