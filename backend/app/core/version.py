"""
统一版本号管理

该文件提供项目的版本信息，确保全项目版本号统一。

使用方法:
from app.core.version import APP_VERSION, BUILD_DATE, VERSION_INFO

更新版本号时，只需要修改 frontend/package.json 中的 version 字段，
然后运行 scripts/update_version.py 脚本即可同步所有版本号。
"""

import json
import os
from pathlib import Path
from datetime import datetime

# 获取项目根目录
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent

def read_package_version() -> str:
    """从 package.json 读取版本号"""
    try:
        package_json_path = PROJECT_ROOT / "frontend" / "package.json"
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
            return package_data.get('version', '0.0.0')
    except Exception as e:
        print(f"Warning: Could not read version from package.json: {e}")
        return '0.0.0'

# 从 package.json 读取版本号
APP_VERSION = read_package_version()

# 自动生成构建日期（格式：YYYYMMDD）
BUILD_DATE = datetime.now().strftime('%Y%m%d')

# 版本代号（可以手动维护，或从环境变量读取）
VERSION_CODENAME = os.getenv('VERSION_CODENAME', 'TechPulse')

# 完整的版本信息对象
VERSION_INFO = {
    'version': APP_VERSION,
    'build': BUILD_DATE,
    'codename': VERSION_CODENAME,
    'fullVersion': f'{APP_VERSION} ({BUILD_DATE})'
}

__all__ = ['APP_VERSION', 'BUILD_DATE', 'VERSION_CODENAME', 'VERSION_INFO']
