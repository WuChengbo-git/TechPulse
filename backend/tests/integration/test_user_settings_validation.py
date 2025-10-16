"""
测试用户设置 API 的 AI 配置验证功能
测试保存时的自动验证和独立的测试端点
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
from app.main import app
from app.core.database import get_db, Base, engine
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.user_settings import UserSettings
from app.core.security import get_password_hash


@pytest.fixture
def client():
    """创建测试客户端"""
    Base.metadata.create_all(bind=engine)
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def test_user(client):
    """创建测试用户"""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        # 创建测试用户
        user = User(
            username="testuser",
            email="test@example.com",
            hashed_password=get_password_hash("testpassword"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 登录获取 token
        response = client.post(
            "/api/v1/auth/login",
            data={"username": "testuser", "password": "testpassword"}
        )
        token = response.json()["access_token"]

        return {"user": user, "token": token, "db": db}
    finally:
        db.close()


@pytest.fixture
def auth_headers(test_user):
    """创建带认证的请求头"""
    return {"Authorization": f"Bearer {test_user['token']}"}


class TestAzureConfigValidation:
    """测试 Azure OpenAI 配置验证"""

    @patch('app.services.ai.azure_openai.AzureOpenAI')
    def test_save_azure_config_with_valid_credentials(self, mock_azure_openai, client, auth_headers):
        """测试保存有效的 Azure OpenAI 配置"""
        # 模拟成功的 API 调用
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        mock_client.chat.completions.create.return_value = mock_response
        mock_azure_openai.return_value = mock_client

        response = client.put(
            "/api/v1/user-settings",
            json={
                "azure": {
                    "api_key": "valid_key",
                    "endpoint": "https://test.openai.azure.com",
                    "deployment": "gpt-4o",
                    "api_version": "2024-02-15-preview"
                }
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Settings updated successfully"
        assert "validation" in data
        assert data["validation"]["success"] is True

    @patch('app.services.ai.azure_openai.AzureOpenAI')
    def test_save_azure_config_with_invalid_credentials(self, mock_azure_openai, client, auth_headers):
        """测试保存无效的 Azure OpenAI 配置"""
        # 模拟 401 错误
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("401 Unauthorized")
        mock_azure_openai.return_value = mock_client

        response = client.put(
            "/api/v1/user-settings",
            json={
                "azure": {
                    "api_key": "invalid_key",
                    "endpoint": "https://test.openai.azure.com",
                    "deployment": "gpt-4o",
                    "api_version": "2024-02-15-preview"
                }
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "验证失败" in data["detail"]["message"]

    def test_save_azure_config_without_credentials(self, client, auth_headers):
        """测试保存不完整的 Azure OpenAI 配置（不触发验证）"""
        response = client.put(
            "/api/v1/user-settings",
            json={
                "azure": {
                    "api_version": "2024-02-15-preview"
                }
            },
            headers=auth_headers
        )

        # 不完整的配置应该保存成功（不触发验证）
        assert response.status_code == 200

    @patch('app.services.ai.azure_openai.AzureOpenAI')
    def test_save_azure_config_with_masked_key(self, mock_azure_openai, client, auth_headers, test_user):
        """测试使用遮蔽的 API key 保存（不应触发验证）"""
        # 首先保存一个有效的配置
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        mock_client.chat.completions.create.return_value = mock_response
        mock_azure_openai.return_value = mock_client

        # 保存初始配置
        client.put(
            "/api/v1/user-settings",
            json={
                "azure": {
                    "api_key": "real_key",
                    "endpoint": "https://test.openai.azure.com",
                    "deployment": "gpt-4o"
                }
            },
            headers=auth_headers
        )

        # 现在尝试用遮蔽的 key 更新其他字段
        response = client.put(
            "/api/v1/user-settings",
            json={
                "azure": {
                    "api_key": "****",
                    "deployment": "gpt-4o-new"
                }
            },
            headers=auth_headers
        )

        assert response.status_code == 200


class TestAzureConfigTestEndpoint:
    """测试独立的 Azure OpenAI 配置测试端点"""

    @patch('app.services.ai.azure_openai.AzureOpenAI')
    def test_test_azure_config_success(self, mock_azure_openai, client, auth_headers):
        """测试 Azure OpenAI 配置测试成功"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test"))]
        mock_client.chat.completions.create.return_value = mock_response
        mock_azure_openai.return_value = mock_client

        response = client.post(
            "/api/v1/user-settings/test-azure-config",
            json={
                "api_key": "test_key",
                "endpoint": "https://test.openai.azure.com",
                "deployment": "gpt-4o",
                "api_version": "2024-02-15-preview"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "成功" in data["message"]

    @patch('app.services.ai.azure_openai.AzureOpenAI')
    def test_test_azure_config_unauthorized(self, mock_azure_openai, client, auth_headers):
        """测试 Azure OpenAI 配置测试失败（未授权）"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("401 Unauthorized")
        mock_azure_openai.return_value = mock_client

        response = client.post(
            "/api/v1/user-settings/test-azure-config",
            json={
                "api_key": "invalid_key",
                "endpoint": "https://test.openai.azure.com",
                "deployment": "gpt-4o",
                "api_version": "2024-02-15-preview"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "API密钥无效" in data["message"]

    def test_test_azure_config_missing_credentials(self, client, auth_headers):
        """测试缺少必需凭据时的测试"""
        response = client.post(
            "/api/v1/user-settings/test-azure-config",
            json={
                "api_key": "test_key"
                # 缺少 endpoint
            },
            headers=auth_headers
        )

        assert response.status_code == 400
        data = response.json()
        assert "必填项" in data["detail"]

    def test_test_azure_config_without_auth(self, client):
        """测试未认证时的配置测试"""
        response = client.post(
            "/api/v1/user-settings/test-azure-config",
            json={
                "api_key": "test_key",
                "endpoint": "https://test.openai.azure.com"
            }
        )

        assert response.status_code == 401


class TestUserSettingsGet:
    """测试获取用户设置"""

    def test_get_settings_with_azure_config(self, client, auth_headers, test_user):
        """测试获取包含 Azure 配置的用户设置"""
        # 首先保存一些配置
        with patch('app.services.ai.azure_openai.AzureOpenAI') as mock_azure:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content="test"))]
            mock_client.chat.completions.create.return_value = mock_response
            mock_azure.return_value = mock_client

            client.put(
                "/api/v1/user-settings",
                json={
                    "azure": {
                        "api_key": "test_key",
                        "endpoint": "https://test.openai.azure.com",
                        "deployment": "gpt-4o"
                    }
                },
                headers=auth_headers
            )

        # 获取设置
        response = client.get("/api/v1/user-settings", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "azure" in data
        assert data["azure"]["api_key"] == "****"  # 应该被遮蔽
        assert data["azure"]["endpoint"] == "https://test.openai.azure.com"
        assert data["azure"]["deployment"] == "gpt-4o"

    def test_get_settings_without_config(self, client, auth_headers):
        """测试获取默认设置"""
        response = client.get("/api/v1/user-settings", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "azure" in data
        assert data["azure"]["api_key"] is None


class TestAIConfigStatus:
    """测试 AI 配置状态端点"""

    def test_get_ai_config_status_without_config(self, client, auth_headers):
        """测试未配置时的状态"""
        response = client.get("/api/v1/user-settings/ai-config-status", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"]["is_configured"] is False

    def test_get_ai_config_status_with_user_config(self, client, auth_headers):
        """测试有用户配置时的状态"""
        # 保存用户配置
        with patch('app.services.ai.azure_openai.AzureOpenAI') as mock_azure:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.choices = [Mock(message=Mock(content="test"))]
            mock_client.chat.completions.create.return_value = mock_response
            mock_azure.return_value = mock_client

            client.put(
                "/api/v1/user-settings",
                json={
                    "azure": {
                        "api_key": "test_key",
                        "endpoint": "https://test.openai.azure.com",
                        "deployment": "gpt-4o"
                    }
                },
                headers=auth_headers
            )

        # 检查状态
        response = client.get("/api/v1/user-settings/ai-config-status", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["status"]["is_configured"] is True
        assert data["status"]["active_source"] == "user"
        assert "用户个人配置" in data["message"]
