"""
配置文件管理服务
负责读取、写入和热重载配置文件
"""
import os
import re
from typing import Dict, Any, Optional, List
from pathlib import Path
import logging
from datetime import datetime
import shutil

logger = logging.getLogger(__name__)


class ConfigManager:
    """配置文件管理器 - 支持 .env 文件读写和热重载"""

    def __init__(self, env_file: str = ".env"):
        self.env_file = Path(env_file)
        self.env_example = Path(".env.example")
        self.backup_dir = Path("config_backups")
        self._config_cache: Dict[str, str] = {}
        self._load_config()

    def _load_config(self) -> None:
        """从 .env 文件加载配置到缓存"""
        self._config_cache = {}
        if not self.env_file.exists():
            logger.warning(f"Config file {self.env_file} not found")
            return

        try:
            with open(self.env_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    # 跳过注释和空行
                    if not line or line.startswith('#'):
                        continue

                    # 解析 KEY=VALUE
                    match = re.match(r'^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$', line)
                    if match:
                        key, value = match.groups()
                        # 移除引号
                        value = value.strip().strip('"').strip("'")
                        self._config_cache[key] = value

            logger.info(f"Loaded {len(self._config_cache)} config items from {self.env_file}")
        except Exception as e:
            logger.error(f"Error loading config file: {e}")

    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """获取配置值"""
        return self._config_cache.get(key, default)

    def get_all(self) -> Dict[str, str]:
        """获取所有配置"""
        return self._config_cache.copy()

    def set(self, key: str, value: str) -> None:
        """设置配置值（仅更新缓存，需调用 save() 持久化）"""
        self._config_cache[key] = value

    def update(self, config_dict: Dict[str, Any]) -> None:
        """批量更新配置（仅更新缓存）"""
        for key, value in config_dict.items():
            if value is not None:
                self._config_cache[key] = str(value)

    def save(self, backup: bool = True) -> None:
        """保存配置到 .env 文件"""
        if backup:
            self._create_backup()

        try:
            # 读取原文件，保留注释和格式
            lines = []
            if self.env_file.exists():
                with open(self.env_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()

            # 更新配置值
            updated_keys = set()
            new_lines = []

            for line in lines:
                stripped = line.strip()
                # 保留注释和空行
                if not stripped or stripped.startswith('#'):
                    new_lines.append(line)
                    continue

                # 更新已存在的配置
                match = re.match(r'^([A-Z_][A-Z0-9_]*)\s*=', stripped)
                if match:
                    key = match.group(1)
                    if key in self._config_cache:
                        new_lines.append(f"{key}={self._config_cache[key]}\n")
                        updated_keys.add(key)
                    else:
                        # 保留未在缓存中的配置
                        new_lines.append(line)
                else:
                    new_lines.append(line)

            # 添加新配置
            for key, value in self._config_cache.items():
                if key not in updated_keys:
                    new_lines.append(f"\n# Auto-added configuration\n{key}={value}\n")

            # 写入文件
            with open(self.env_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)

            logger.info(f"Saved configuration to {self.env_file}")
        except Exception as e:
            logger.error(f"Error saving config file: {e}")
            raise

    def _create_backup(self) -> None:
        """创建配置文件备份"""
        if not self.env_file.exists():
            return

        try:
            self.backup_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_file = self.backup_dir / f".env.backup.{timestamp}"
            shutil.copy2(self.env_file, backup_file)
            logger.info(f"Created backup: {backup_file}")

            # 保留最近10个备份
            self._cleanup_old_backups(keep=10)
        except Exception as e:
            logger.warning(f"Failed to create backup: {e}")

    def _cleanup_old_backups(self, keep: int = 10) -> None:
        """清理旧备份文件"""
        try:
            backups = sorted(
                self.backup_dir.glob(".env.backup.*"),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )
            for old_backup in backups[keep:]:
                old_backup.unlink()
                logger.debug(f"Deleted old backup: {old_backup}")
        except Exception as e:
            logger.warning(f"Failed to cleanup backups: {e}")

    def reload(self) -> None:
        """重新加载配置文件"""
        logger.info("Reloading configuration...")
        self._load_config()

    def restore_from_backup(self, backup_file: Optional[str] = None) -> None:
        """从备份恢复配置"""
        if backup_file:
            backup_path = Path(backup_file)
        else:
            # 使用最新的备份
            backups = sorted(
                self.backup_dir.glob(".env.backup.*"),
                key=lambda p: p.stat().st_mtime,
                reverse=True
            )
            if not backups:
                raise FileNotFoundError("No backup files found")
            backup_path = backups[0]

        if not backup_path.exists():
            raise FileNotFoundError(f"Backup file not found: {backup_path}")

        try:
            shutil.copy2(backup_path, self.env_file)
            self.reload()
            logger.info(f"Restored configuration from {backup_path}")
        except Exception as e:
            logger.error(f"Error restoring from backup: {e}")
            raise

    def restore_defaults(self) -> None:
        """恢复默认配置（从 .env.example）"""
        if not self.env_example.exists():
            raise FileNotFoundError(f"Example config file not found: {self.env_example}")

        try:
            # 备份当前配置
            self._create_backup()

            # 复制示例配置
            shutil.copy2(self.env_example, self.env_file)
            self.reload()
            logger.info("Restored default configuration")
        except Exception as e:
            logger.error(f"Error restoring defaults: {e}")
            raise

    def validate(self) -> Dict[str, List[str]]:
        """验证配置的有效性"""
        errors = []
        warnings = []

        # 必需配置项
        required_keys = [
            'DATABASE_URL',
            'SECRET_KEY',
            'JWT_SECRET_KEY'
        ]

        for key in required_keys:
            if key not in self._config_cache or not self._config_cache[key]:
                errors.append(f"Missing required config: {key}")
            elif self._config_cache[key] in ['your-secret-key-here', 'change-this-in-production']:
                warnings.append(f"Using default/example value for {key}")

        # 验证数值类型
        numeric_keys = {
            'ACCESS_TOKEN_EXPIRE_MINUTES': int,
            'REFRESH_TOKEN_EXPIRE_DAYS': int,
            'SMTP_PORT': int,
            'PASSWORD_MIN_LENGTH': int,
            'MAX_LOGIN_ATTEMPTS': int,
            'LOCKOUT_DURATION_MINUTES': int
        }

        for key, expected_type in numeric_keys.items():
            if key in self._config_cache:
                try:
                    expected_type(self._config_cache[key])
                except ValueError:
                    errors.append(f"Invalid {expected_type.__name__} value for {key}: {self._config_cache[key]}")

        # 验证布尔类型
        boolean_keys = ['DEBUG']
        for key in boolean_keys:
            if key in self._config_cache:
                value = self._config_cache[key].lower()
                if value not in ['true', 'false', '1', '0', 'yes', 'no']:
                    warnings.append(f"Invalid boolean value for {key}: {self._config_cache[key]}")

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }

    def get_sensitive_keys(self) -> List[str]:
        """获取敏感配置键列表"""
        return [
            'SECRET_KEY',
            'JWT_SECRET_KEY',
            'SMTP_PASSWORD',
            'GOOGLE_CLIENT_SECRET',
            'GITHUB_CLIENT_SECRET',
            'MICROSOFT_CLIENT_SECRET',
            'AZURE_APIKEY',
            'NOTION_TOKEN',
            'GITHUB_TOKEN',
            'HUGGINGFACE_TOKEN'
        ]

    def mask_sensitive_value(self, key: str, value: str) -> str:
        """遮蔽敏感信息"""
        if key in self.get_sensitive_keys() and value:
            if len(value) <= 8:
                return '****'
            return f"{value[:4]}{'*' * (len(value) - 8)}{value[-4:]}"
        return value

    def export_safe_config(self) -> Dict[str, str]:
        """导出安全配置（遮蔽敏感信息）"""
        safe_config = {}
        for key, value in self._config_cache.items():
            safe_config[key] = self.mask_sensitive_value(key, value)
        return safe_config


# 全局配置管理器实例
config_manager = ConfigManager()
