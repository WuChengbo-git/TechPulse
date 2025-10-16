"""
测试 AI 配置验证功能
测试 Azure OpenAI 连接测试和用户设置验证
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.ai.azure_openai import AzureOpenAIService


class TestAzureOpenAIConnectionTest:
    """测试 Azure OpenAI 连接测试功能"""

    def test_connection_success(self):
        """测试连接成功场景"""
        # 创建 mock 客户端
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="test response"))]
        mock_client.chat.completions.create.return_value = mock_response

        # 创建服务实例并设置 mock 客户端
        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com",
            deployment_name="gpt-4o"
        )
        service.client = mock_client

        # 执行测试
        result = service.test_connection()

        # 验证结果
        assert result["success"] is True
        assert "成功" in result["message"]
        assert result["model"] == "gpt-4o"

        # 验证 API 被调用
        mock_client.chat.completions.create.assert_called_once()

    def test_connection_no_client(self):
        """测试没有初始化客户端的场景"""
        service = AzureOpenAIService()
        service.client = None

        result = service.test_connection()

        assert result["success"] is False
        assert "未初始化" in result["message"]
        assert "error" in result

    def test_connection_unauthorized_error(self):
        """测试 401 未授权错误"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("401 Unauthorized: Invalid API key")

        service = AzureOpenAIService(
            api_key="invalid_key",
            endpoint="https://test.openai.azure.com"
        )
        service.client = mock_client

        result = service.test_connection()

        assert result["success"] is False
        assert "API密钥无效" in result["message"]
        assert "error" in result

    def test_connection_not_found_error(self):
        """测试 404 未找到错误（端点或部署名称错误）"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("404 NotFound: Deployment not found")

        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com"
        )
        service.client = mock_client

        result = service.test_connection()

        assert result["success"] is False
        assert "端点或部署名称不正确" in result["message"]

    def test_connection_rate_limit_error(self):
        """测试 429 频率限制错误"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("429 RateLimitExceeded")

        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com"
        )
        service.client = mock_client

        result = service.test_connection()

        assert result["success"] is False
        assert "请求频率超限" in result["message"]

    def test_connection_timeout_error(self):
        """测试超时错误"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("Connection timeout")

        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com"
        )
        service.client = mock_client

        result = service.test_connection()

        assert result["success"] is False
        assert "超时" in result["message"]

    def test_connection_generic_error(self):
        """测试通用错误"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("Unknown error")

        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com"
        )
        service.client = mock_client

        result = service.test_connection()

        assert result["success"] is False
        assert "连接失败" in result["message"]
        assert result["error"] == "Unknown error"


class TestAzureOpenAIServiceInitialization:
    """测试 Azure OpenAI 服务初始化时的配置优先级"""

    def test_init_with_provided_credentials(self):
        """测试使用提供的凭据初始化"""
        service = AzureOpenAIService(
            api_key="test_key",
            endpoint="https://test.openai.azure.com",
            deployment_name="gpt-4o"
        )

        assert service.client is not None
        assert service.deployment_name == "gpt-4o"

    @patch('app.core.database.SessionLocal')
    def test_init_with_user_config(self, mock_session):
        """测试使用用户配置初始化"""
        # 模拟用户设置
        mock_user_settings = Mock()
        mock_user_settings.azure_api_key = "user_key"
        mock_user_settings.azure_endpoint = "https://user.openai.azure.com"
        mock_user_settings.azure_deployment = "user-deployment"
        mock_user_settings.azure_api_version = "2024-02-15-preview"

        mock_db = Mock()
        mock_db.query.return_value.filter.return_value.first.return_value = mock_user_settings
        mock_session.return_value = mock_db

        service = AzureOpenAIService(user_id=123)

        assert service.deployment_name == "user-deployment"
        mock_db.close.assert_called()

    def test_init_without_credentials(self):
        """测试没有任何凭据时初始化"""
        with patch('app.services.ai.azure_openai.settings') as mock_settings:
            mock_settings.azure_openai_api_key = None
            mock_settings.azure_openai_endpoint = None

            service = AzureOpenAIService()

            # 应该没有初始化客户端
            assert service.client is None


@pytest.mark.asyncio
class TestAzureOpenAIServiceMethods:
    """测试 Azure OpenAI 服务的其他方法"""

    async def test_summarize_content_unavailable(self):
        """测试服务不可用时的摘要功能"""
        service = AzureOpenAIService()
        service.client = None

        result = await service.summarize_content("test content")

        assert result is None

    async def test_translate_content_unavailable(self):
        """测试服务不可用时的翻译功能"""
        service = AzureOpenAIService()
        service.client = None

        result = await service.translate_content("test content")

        assert result is None

    async def test_extract_tags_unavailable(self):
        """测试服务不可用时的标签提取功能"""
        service = AzureOpenAIService()
        service.client = None

        result = await service.extract_tags("test content")

        assert result == []
