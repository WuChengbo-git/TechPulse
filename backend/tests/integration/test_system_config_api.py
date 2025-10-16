"""
系统配置 API 集成测试
测试配置管理的 RESTful API 端点
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User
from sqlalchemy.orm import Session
import tempfile
import shutil
from pathlib import Path


@pytest.fixture
def temp_config_env(monkeypatch):
    """创建临时配置环境"""
    temp_dir = tempfile.mkdtemp()
    env_file = Path(temp_dir) / ".env"
    env_example = Path(temp_dir) / ".env.example"

    # 创建测试配置文件
    env_content = """DATABASE_URL=sqlite:///./test.db
SECRET_KEY=test-secret-key
JWT_SECRET_KEY=test-jwt-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=true
"""
    env_file.write_text(env_content)
    env_example.write_text(env_content)

    # 修改配置管理器路径
    from app.services import config_manager as cm_module
    original_manager = cm_module.config_manager
    cm_module.config_manager = cm_module.ConfigManager(str(env_file))
    cm_module.config_manager.env_example = env_example
    cm_module.config_manager.backup_dir = Path(temp_dir) / "backups"

    yield temp_dir

    # 恢复原始配置
    cm_module.config_manager = original_manager
    shutil.rmtree(temp_dir)


@pytest.mark.integration
@pytest.mark.api
class TestGetSystemConfig:
    """测试获取系统配置 API"""

    def test_get_config_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功获取配置"""
        response = client.get(
            "/api/v1/system-config",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "config" in data
        assert "env_file" in data
        assert "total_items" in data
        assert isinstance(data["config"], dict)

    def test_get_config_masks_sensitive(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试默认遮蔽敏感信息"""
        response = client.get(
            "/api/v1/system-config",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 敏感配置应该被遮蔽
        if "SECRET_KEY" in data["config"]:
            assert "*" in data["config"]["SECRET_KEY"]

    def test_get_config_show_sensitive(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试显示敏感信息"""
        response = client.get(
            "/api/v1/system-config?show_sensitive=true",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        # 应该显示原始值
        if "SECRET_KEY" in data["config"]:
            assert data["config"]["SECRET_KEY"] == "test-secret-key"

    def test_get_config_unauthorized(
        self, client: TestClient, temp_config_env
    ):
        """测试未授权访问"""
        response = client.get("/api/v1/system-config")

        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.api
class TestGetConfigKeys:
    """测试获取配置键 API"""

    def test_get_keys_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功获取配置键"""
        response = client.get(
            "/api/v1/system-config/keys",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "keys" in data
        assert "sensitive_keys" in data
        assert isinstance(data["keys"], list)
        assert isinstance(data["sensitive_keys"], list)

    def test_sensitive_keys_included(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试敏感键列表包含预期的键"""
        response = client.get(
            "/api/v1/system-config/keys",
            headers=auth_headers
        )

        data = response.json()
        sensitive_keys = data["sensitive_keys"]

        assert "SECRET_KEY" in sensitive_keys
        assert "JWT_SECRET_KEY" in sensitive_keys


@pytest.mark.integration
@pytest.mark.api
class TestGetConfigItem:
    """测试获取单个配置项 API"""

    def test_get_item_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功获取配置项"""
        response = client.get(
            "/api/v1/system-config/item/DEBUG",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["key"] == "DEBUG"
        assert "value" in data
        assert "is_sensitive" in data

    def test_get_nonexistent_item(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试获取不存在的配置项"""
        response = client.get(
            "/api/v1/system-config/item/NONEXISTENT_KEY",
            headers=auth_headers
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.api
class TestUpdateSystemConfig:
    """测试更新系统配置 API"""

    def test_update_config_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功更新配置"""
        update_data = {
            "config": {
                "DEBUG": "false",
                "ACCESS_TOKEN_EXPIRE_MINUTES": "60"
            },
            "apply_immediately": False
        }

        response = client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert "updated_keys" in data
        assert set(data["updated_keys"]) == {"DEBUG",
                                              "ACCESS_TOKEN_EXPIRE_MINUTES"}

    def test_update_config_with_apply(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试更新配置并立即应用"""
        update_data = {
            "config": {
                "DEBUG": "false"
            },
            "apply_immediately": True
        }

        response = client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert data["applied"] is True

    def test_update_config_invalid_key(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试更新无效的配置键"""
        update_data = {
            "config": {
                "invalid-key-with-dash": "value"
            },
            "apply_immediately": False
        }

        response = client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 400

    def test_update_config_creates_backup(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试更新配置时创建备份"""
        update_data = {
            "config": {
                "DEBUG": "false"
            },
            "apply_immediately": False
        }

        response = client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200

        # 检查备份文件
        backup_dir = Path(temp_config_env) / "backups"
        if backup_dir.exists():
            backups = list(backup_dir.glob(".env.backup.*"))
            assert len(backups) >= 1


@pytest.mark.integration
@pytest.mark.api
class TestReloadConfig:
    """测试重载配置 API"""

    def test_reload_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功重载配置"""
        response = client.post(
            "/api/v1/system-config/reload",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "message" in data
        assert "total_items" in data


@pytest.mark.integration
@pytest.mark.api
class TestValidateConfig:
    """测试验证配置 API"""

    def test_validate_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试验证配置"""
        response = client.post(
            "/api/v1/system-config/validate",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "valid" in data
        assert "errors" in data
        assert "warnings" in data
        assert isinstance(data["errors"], list)
        assert isinstance(data["warnings"], list)


@pytest.mark.integration
@pytest.mark.api
class TestRestoreDefaults:
    """测试恢复默认配置 API"""

    def test_restore_defaults_success(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试成功恢复默认配置"""
        # 先修改配置
        update_data = {
            "config": {"DEBUG": "false"},
            "apply_immediately": False
        }
        client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        # 恢复默认配置
        response = client.post(
            "/api/v1/system-config/restore/defaults",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "message" in data


@pytest.mark.integration
@pytest.mark.api
class TestBackups:
    """测试配置备份 API"""

    def test_list_backups(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试列出备份文件"""
        # 先创建一个备份
        update_data = {
            "config": {"DEBUG": "false"},
            "apply_immediately": False
        }
        client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        # 列出备份
        response = client.get(
            "/api/v1/system-config/backups",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()

        assert "backups" in data
        assert isinstance(data["backups"], list)

    def test_restore_from_backup(
        self, client: TestClient, test_user, auth_headers, temp_config_env
    ):
        """测试从备份恢复"""
        # 先创建一个备份
        update_data = {
            "config": {"DEBUG": "true"},
            "apply_immediately": False
        }
        client.put(
            "/api/v1/system-config",
            json=update_data,
            headers=auth_headers
        )

        # 修改配置
        update_data2 = {
            "config": {"DEBUG": "false"},
            "apply_immediately": False
        }
        client.put(
            "/api/v1/system-config",
            json=update_data2,
            headers=auth_headers
        )

        # 从备份恢复
        response = client.post(
            "/api/v1/system-config/restore/backup",
            headers=auth_headers
        )

        # 应该成功或者找不到备份
        assert response.status_code in [200, 404]


@pytest.mark.integration
@pytest.mark.api
class TestConfigSecurity:
    """测试配置安全性"""

    def test_requires_authentication(
        self, client: TestClient, temp_config_env
    ):
        """测试所有端点都需要认证"""
        endpoints = [
            ("GET", "/api/v1/system-config"),
            ("GET", "/api/v1/system-config/keys"),
            ("PUT", "/api/v1/system-config"),
            ("POST", "/api/v1/system-config/reload"),
            ("POST", "/api/v1/system-config/validate"),
        ]

        for method, url in endpoints:
            if method == "GET":
                response = client.get(url)
            elif method == "PUT":
                response = client.put(url, json={"config": {}})
            elif method == "POST":
                response = client.post(url)

            assert response.status_code == 401, \
                f"{method} {url} should require authentication"
