"""
配置管理器单元测试
测试配置文件的读取、写入、验证和备份功能
"""
import pytest
import tempfile
import shutil
from pathlib import Path
from app.services.config_manager import ConfigManager


@pytest.fixture
def temp_env_dir():
    """创建临时目录用于测试"""
    temp_dir = tempfile.mkdtemp()
    yield Path(temp_dir)
    shutil.rmtree(temp_dir)


@pytest.fixture
def sample_env_content():
    """示例 .env 文件内容"""
    return """# Database Configuration
DATABASE_URL=sqlite:///./test.db

# Security Keys
SECRET_KEY=test-secret-key
JWT_SECRET_KEY=test-jwt-key

# JWT Configuration
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=30

# Debug Mode
DEBUG=true
"""


@pytest.fixture
def config_manager(temp_env_dir, sample_env_content):
    """创建配置管理器实例"""
    env_file = temp_env_dir / ".env"
    env_example = temp_env_dir / ".env.example"

    # 写入测试文件
    env_file.write_text(sample_env_content)
    env_example.write_text(sample_env_content)

    # 创建配置管理器
    manager = ConfigManager(str(env_file))
    manager.env_example = env_example
    manager.backup_dir = temp_env_dir / "backups"

    return manager


class TestConfigManagerLoad:
    """测试配置加载功能"""

    def test_load_config_success(self, config_manager):
        """测试成功加载配置文件"""
        config = config_manager.get_all()

        assert len(config) > 0
        assert config['DATABASE_URL'] == 'sqlite:///./test.db'
        assert config['SECRET_KEY'] == 'test-secret-key'
        assert config['JWT_SECRET_KEY'] == 'test-jwt-key'

    def test_load_config_with_comments(self, config_manager):
        """测试加载时忽略注释"""
        config = config_manager.get_all()

        # 确保注释不被加载
        assert '# Database Configuration' not in config

    def test_load_config_empty_lines(self, config_manager):
        """测试加载时忽略空行"""
        config = config_manager.get_all()

        # 配置项数量应该只包含有效的键值对
        assert len(config) == 7

    def test_get_single_value(self, config_manager):
        """测试获取单个配置值"""
        assert config_manager.get('SECRET_KEY') == 'test-secret-key'
        assert config_manager.get('JWT_ALGORITHM') == 'HS256'

    def test_get_nonexistent_key(self, config_manager):
        """测试获取不存在的配置键"""
        assert config_manager.get('NONEXISTENT_KEY') is None
        assert config_manager.get('NONEXISTENT_KEY', 'default') == 'default'

    def test_load_nonexistent_file(self, temp_env_dir):
        """测试加载不存在的配置文件"""
        manager = ConfigManager(str(temp_env_dir / "nonexistent.env"))
        config = manager.get_all()

        assert len(config) == 0


class TestConfigManagerUpdate:
    """测试配置更新功能"""

    def test_set_single_value(self, config_manager):
        """测试设置单个配置值"""
        config_manager.set('NEW_KEY', 'new_value')

        assert config_manager.get('NEW_KEY') == 'new_value'

    def test_update_existing_value(self, config_manager):
        """测试更新已存在的配置值"""
        original = config_manager.get('SECRET_KEY')
        config_manager.set('SECRET_KEY', 'updated-secret')

        assert config_manager.get('SECRET_KEY') == 'updated-secret'
        assert config_manager.get('SECRET_KEY') != original

    def test_batch_update(self, config_manager):
        """测试批量更新配置"""
        updates = {
            'DATABASE_URL': 'postgresql://localhost/test',
            'DEBUG': 'false',
            'NEW_CONFIG': 'new_value'
        }

        config_manager.update(updates)

        assert config_manager.get('DATABASE_URL') == \
            'postgresql://localhost/test'
        assert config_manager.get('DEBUG') == 'false'
        assert config_manager.get('NEW_CONFIG') == 'new_value'

    def test_update_with_none_values(self, config_manager):
        """测试更新时跳过 None 值"""
        original_count = len(config_manager.get_all())

        config_manager.update({
            'KEY1': 'value1',
            'KEY2': None,
            'KEY3': 'value3'
        })

        config = config_manager.get_all()
        assert 'KEY1' in config
        assert 'KEY2' not in config
        assert 'KEY3' in config


class TestConfigManagerSave:
    """测试配置保存功能"""

    def test_save_to_file(self, config_manager):
        """测试保存配置到文件"""
        config_manager.set('TEST_KEY', 'test_value')
        config_manager.save(backup=False)

        # 重新加载验证
        config_manager.reload()
        assert config_manager.get('TEST_KEY') == 'test_value'

    def test_save_preserves_comments(self, config_manager):
        """测试保存时保留注释"""
        config_manager.set('NEW_KEY', 'new_value')
        config_manager.save(backup=False)

        # 读取文件内容
        content = config_manager.env_file.read_text()

        assert '# Database Configuration' in content
        assert '# Security Keys' in content

    def test_save_updates_existing_keys(self, config_manager):
        """测试保存时更新已存在的键"""
        config_manager.set('SECRET_KEY', 'updated-secret-key')
        config_manager.save(backup=False)

        # 读取文件并验证
        content = config_manager.env_file.read_text()
        assert 'SECRET_KEY=updated-secret-key' in content

    def test_save_adds_new_keys(self, config_manager):
        """测试保存时添加新键"""
        config_manager.set('BRAND_NEW_KEY', 'brand_new_value')
        config_manager.save(backup=False)

        # 读取文件并验证
        content = config_manager.env_file.read_text()
        assert 'BRAND_NEW_KEY=brand_new_value' in content


class TestConfigManagerBackup:
    """测试配置备份功能"""

    def test_create_backup(self, config_manager):
        """测试创建备份文件"""
        config_manager.set('TEST_KEY', 'test_value')
        config_manager.save(backup=True)

        # 检查备份目录
        backups = list(config_manager.backup_dir.glob('.env.backup.*'))
        assert len(backups) >= 1

    def test_backup_cleanup(self, config_manager):
        """测试备份清理功能"""
        # 创建多个备份
        for i in range(15):
            config_manager.set(f'KEY_{i}', f'value_{i}')
            config_manager.save(backup=True)

        # 检查备份数量（应该保留最新10个）
        backups = list(config_manager.backup_dir.glob('.env.backup.*'))
        assert len(backups) <= 10

    def test_restore_from_backup(self, config_manager):
        """测试从备份恢复配置"""
        # 保存初始状态
        original_value = config_manager.get('SECRET_KEY')
        config_manager.save(backup=True)

        # 修改配置
        config_manager.set('SECRET_KEY', 'modified-key')
        config_manager.save(backup=False)

        # 从备份恢复
        config_manager.restore_from_backup()

        # 验证恢复成功
        assert config_manager.get('SECRET_KEY') == original_value

    def test_restore_from_specific_backup(self, config_manager):
        """测试从指定备份恢复"""
        # 创建备份
        config_manager.save(backup=True)
        backups = list(config_manager.backup_dir.glob('.env.backup.*'))
        backup_file = backups[0]

        # 修改配置
        config_manager.set('SECRET_KEY', 'modified-key')
        config_manager.save(backup=False)

        # 从指定备份恢复
        config_manager.restore_from_backup(str(backup_file))

        # 验证恢复成功
        assert config_manager.get('SECRET_KEY') == 'test-secret-key'


class TestConfigManagerValidation:
    """测试配置验证功能"""

    def test_validate_complete_config(self, config_manager):
        """测试验证完整配置"""
        result = config_manager.validate()

        assert 'valid' in result
        assert 'errors' in result
        assert 'warnings' in result

    def test_validate_missing_required_keys(self, temp_env_dir):
        """测试验证缺少必需键"""
        env_file = temp_env_dir / ".env"
        env_file.write_text("DEBUG=true\n")

        manager = ConfigManager(str(env_file))
        result = manager.validate()

        assert result['valid'] is False
        assert len(result['errors']) > 0
        assert any('DATABASE_URL' in err for err in result['errors'])

    def test_validate_invalid_numeric_value(self, config_manager):
        """测试验证无效的数值类型"""
        config_manager.set('ACCESS_TOKEN_EXPIRE_MINUTES', 'not_a_number')
        result = config_manager.validate()

        assert len(result['errors']) > 0
        assert any('ACCESS_TOKEN_EXPIRE_MINUTES' in err
                   for err in result['errors'])

    def test_validate_boolean_value(self, config_manager):
        """测试验证布尔值"""
        config_manager.set('DEBUG', 'maybe')
        result = config_manager.validate()

        # 应该产生警告
        assert len(result['warnings']) > 0

    def test_validate_default_secret_keys(self, config_manager):
        """测试验证使用默认密钥"""
        config_manager.set('SECRET_KEY', 'your-secret-key-here')
        result = config_manager.validate()

        # 应该产生警告
        assert len(result['warnings']) > 0
        assert any('SECRET_KEY' in warn for warn in result['warnings'])


class TestConfigManagerSecurity:
    """测试配置安全功能"""

    def test_get_sensitive_keys(self, config_manager):
        """测试获取敏感配置键列表"""
        sensitive_keys = config_manager.get_sensitive_keys()

        assert 'SECRET_KEY' in sensitive_keys
        assert 'JWT_SECRET_KEY' in sensitive_keys
        assert 'SMTP_PASSWORD' in sensitive_keys

    def test_mask_sensitive_value(self, config_manager):
        """测试遮蔽敏感值"""
        masked = config_manager.mask_sensitive_value(
            'SECRET_KEY', 'super-secret-key-12345'
        )

        assert masked != 'super-secret-key-12345'
        assert '****' in masked or '*' in masked

    def test_mask_short_sensitive_value(self, config_manager):
        """测试遮蔽短敏感值"""
        masked = config_manager.mask_sensitive_value('SECRET_KEY', 'short')

        assert masked == '****'

    def test_mask_non_sensitive_value(self, config_manager):
        """测试不遮蔽非敏感值"""
        value = 'some-public-value'
        masked = config_manager.mask_sensitive_value('DEBUG', value)

        assert masked == value

    def test_export_safe_config(self, config_manager):
        """测试导出安全配置"""
        safe_config = config_manager.export_safe_config()

        # 敏感配置应该被遮蔽
        assert safe_config['SECRET_KEY'] != 'test-secret-key'
        assert '*' in safe_config['SECRET_KEY']

        # 非敏感配置应该保持原样
        assert safe_config['DEBUG'] == 'true'


class TestConfigManagerReload:
    """测试配置重载功能"""

    def test_reload_config(self, config_manager):
        """测试重载配置"""
        # 直接修改文件
        new_content = config_manager.env_file.read_text()
        new_content += "\nNEW_KEY_IN_FILE=new_value\n"
        config_manager.env_file.write_text(new_content)

        # 重载配置
        config_manager.reload()

        # 验证新配置已加载
        assert config_manager.get('NEW_KEY_IN_FILE') == 'new_value'

    def test_reload_clears_cache(self, config_manager):
        """测试重载清除缓存"""
        # 设置缓存中的值
        config_manager.set('CACHE_KEY', 'cache_value')
        assert config_manager.get('CACHE_KEY') == 'cache_value'

        # 重载配置（文件中没有这个键）
        config_manager.reload()

        # 缓存应该被清除
        assert config_manager.get('CACHE_KEY') is None


class TestConfigManagerRestore:
    """测试配置恢复功能"""

    def test_restore_defaults(self, config_manager):
        """测试恢复默认配置"""
        # 修改配置
        config_manager.set('SECRET_KEY', 'modified-key')
        config_manager.save(backup=False)

        # 恢复默认配置
        config_manager.restore_defaults()

        # 验证配置已恢复
        assert config_manager.get('SECRET_KEY') == 'test-secret-key'

    def test_restore_defaults_creates_backup(self, config_manager):
        """测试恢复默认配置时创建备份"""
        # 修改配置
        config_manager.set('TEST_KEY', 'test_value')
        config_manager.save(backup=False)

        # 恢复默认配置
        config_manager.restore_defaults()

        # 检查备份是否创建
        backups = list(config_manager.backup_dir.glob('.env.backup.*'))
        assert len(backups) >= 1

    def test_restore_defaults_no_example_file(self, temp_env_dir):
        """测试没有示例文件时恢复默认配置"""
        env_file = temp_env_dir / ".env"
        env_file.write_text("DEBUG=true\n")

        manager = ConfigManager(str(env_file))
        manager.env_example = temp_env_dir / "nonexistent.env.example"

        # 应该抛出异常
        with pytest.raises(FileNotFoundError):
            manager.restore_defaults()
