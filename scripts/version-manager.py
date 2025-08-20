#!/usr/bin/env python3
"""
TechPulse Version Manager
用于管理项目版本号和构建信息
"""

import json
import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent

# 版本文件路径
VERSION_FILE = PROJECT_ROOT / "version.json"
FRONTEND_VERSION_FILE = PROJECT_ROOT / "frontend" / "src" / "components" / "VersionInfo.tsx"

def load_version():
    """加载当前版本信息"""
    if VERSION_FILE.exists():
        with open(VERSION_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        return {
            "version": "1.0.0",
            "build": datetime.now().strftime("%Y%m%d"),
            "codename": "Initial Release",
            "releaseDate": datetime.now().strftime("%Y-%m-%d"),
            "description": "Initial release"
        }

def save_version(version_info):
    """保存版本信息"""
    with open(VERSION_FILE, 'w', encoding='utf-8') as f:
        json.dump(version_info, f, indent=2, ensure_ascii=False)

def update_frontend_version(version_info):
    """更新前端版本信息组件"""
    version = version_info["version"]
    build = version_info["build"]
    
    content = f'''import React from 'react'
import {{ Typography, Space }} from 'antd'

const {{ Text }} = Typography

interface VersionInfoProps {{
  style?: React.CSSProperties
}}

const VersionInfo: React.FC<VersionInfoProps> = ({{ style }}) => {{
  const version = '{version}'
  const build = '{build}'
  
  return (
    <Space style={{style}} split={{<Text type="secondary">|</Text>}}>
      <Text type="secondary" style={{{{ fontSize: '11px' }}}}>
        Version {{version}}
      </Text>
      <Text type="secondary" style={{{{ fontSize: '11px' }}}}>
        Build {{build}}
      </Text>
    </Space>
  )
}}

export default VersionInfo'''
    
    with open(FRONTEND_VERSION_FILE, 'w', encoding='utf-8') as f:
        f.write(content)

def increment_version(current_version, increment_type="patch"):
    """递增版本号"""
    parts = current_version.split('.')
    major, minor, patch = map(int, parts)
    
    if increment_type == "major":
        major += 1
        minor = 0
        patch = 0
    elif increment_type == "minor":
        minor += 1
        patch = 0
    else:  # patch
        patch += 1
    
    return f"{major}.{minor}.{patch}"

def main():
    parser = argparse.ArgumentParser(description='TechPulse Version Manager')
    parser.add_argument('action', choices=['show', 'set', 'bump', 'release'], 
                       help='Action to perform')
    parser.add_argument('--type', choices=['major', 'minor', 'patch'], 
                       default='patch', help='Version increment type')
    parser.add_argument('--version', help='Set specific version')
    parser.add_argument('--codename', help='Release codename')
    parser.add_argument('--description', help='Release description')
    
    args = parser.parse_args()
    
    version_info = load_version()
    
    if args.action == 'show':
        print("Current Version Information:")
        print(f"  Version: {version_info['version']}")
        print(f"  Build: {version_info['build']}")
        print(f"  Codename: {version_info['codename']}")
        print(f"  Release Date: {version_info['releaseDate']}")
        print(f"  Description: {version_info['description']}")
        
    elif args.action == 'set':
        if not args.version:
            print("Error: --version is required for 'set' action")
            sys.exit(1)
        
        version_info['version'] = args.version
        version_info['build'] = datetime.now().strftime("%Y%m%d")
        version_info['releaseDate'] = datetime.now().strftime("%Y-%m-%d")
        
        if args.codename:
            version_info['codename'] = args.codename
        if args.description:
            version_info['description'] = args.description
        
        save_version(version_info)
        update_frontend_version(version_info)
        print(f"Version set to {version_info['version']}")
        
    elif args.action == 'bump':
        old_version = version_info['version']
        new_version = increment_version(old_version, args.type)
        
        version_info['version'] = new_version
        version_info['build'] = datetime.now().strftime("%Y%m%d")
        version_info['releaseDate'] = datetime.now().strftime("%Y-%m-%d")
        
        if args.codename:
            version_info['codename'] = args.codename
        if args.description:
            version_info['description'] = args.description
        
        save_version(version_info)
        update_frontend_version(version_info)
        print(f"Version bumped from {old_version} to {new_version}")
        
    elif args.action == 'release':
        # 生成发布信息
        print("Preparing release...")
        print(f"  Version: {version_info['version']}")
        print(f"  Build: {version_info['build']}")
        print(f"  Release Date: {version_info['releaseDate']}")
        
        # 这里可以添加更多发布相关的操作
        # 比如更新CHANGELOG、创建Git标签等
        
        print("Release preparation completed!")

if __name__ == '__main__':
    main()