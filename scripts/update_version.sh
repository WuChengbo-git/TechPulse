#!/bin/bash

# TechPulse 版本号统一更新脚本
#
# 使用方法:
#   ./scripts/update_version.sh 0.2.2
#
# 该脚本会更新以下文件的版本号:
#   - frontend/package.json
#   - docs/RELEASE.md (添加新版本记录占位符)
#
# 其他文件会自动从 package.json 读取版本号:
#   - frontend/src/config/version.ts (自动读取)
#   - backend/app/core/version.py (自动读取)
#   - frontend/src/components/VersionInfo.tsx (使用配置)
#   - backend/app/main.py (使用配置)

set -e

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 错误: 请提供版本号"
    echo "使用方法: $0 <version>"
    echo "示例: $0 0.2.2"
    exit 1
fi

NEW_VERSION="$1"
BUILD_DATE=$(date +%Y%m%d)

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 开始更新版本号到 $NEW_VERSION..."
echo ""

# 1. 更新 frontend/package.json
echo "📦 更新 frontend/package.json..."
PACKAGE_JSON="$PROJECT_ROOT/frontend/package.json"
if [ -f "$PACKAGE_JSON" ]; then
    # 使用 sed 替换版本号（兼容 macOS 和 Linux）
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
    else
        sed -i "s/\"version\": \".*\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_JSON"
    fi
    echo "✅ frontend/package.json 已更新"
else
    echo "⚠️  警告: 未找到 $PACKAGE_JSON"
fi

echo ""

# 2. 在 RELEASE.md 顶部添加新版本占位符
echo "📝 更新 docs/RELEASE.md..."
RELEASE_MD="$PROJECT_ROOT/docs/RELEASE.md"
if [ -f "$RELEASE_MD" ]; then
    # 创建临时文件
    TEMP_FILE=$(mktemp)

    # 写入新版本占位符
    cat > "$TEMP_FILE" << EOF
# TechPulse Release Notes

## Version $NEW_VERSION - TechPulse [待定]
**发布日期**: $(date +%Y-%m-%d)

### 🎯 本版本更新概览
[待补充：本版本的主要更新内容]

### 🔧 主要功能
[待补充]

### 🐛 问题修复
[待补充]

### 📝 修改文件列表
[待补充]

---

EOF

    # 追加原文件内容（跳过第一行标题）
    tail -n +2 "$RELEASE_MD" >> "$TEMP_FILE"

    # 替换原文件
    mv "$TEMP_FILE" "$RELEASE_MD"

    echo "✅ docs/RELEASE.md 已更新（添加了新版本占位符）"
    echo "   请手动完善版本记录内容"
else
    echo "⚠️  警告: 未找到 $RELEASE_MD"
fi

echo ""
echo "✨ 版本号更新完成！"
echo ""
echo "📋 版本信息:"
echo "   版本号: $NEW_VERSION"
echo "   构建日期: $BUILD_DATE"
echo ""
echo "🔄 以下文件会自动使用新版本号:"
echo "   ✅ frontend/src/config/version.ts (从 package.json 读取)"
echo "   ✅ frontend/src/components/VersionInfo.tsx (使用配置)"
echo "   ✅ backend/app/core/version.py (从 package.json 读取)"
echo "   ✅ backend/app/main.py (使用配置)"
echo ""
echo "📝 下一步:"
echo "   1. 完善 docs/RELEASE.md 中的版本记录"
echo "   2. 提交更改: git add ."
echo "   3. 创建提交: git commit -m \"release: Version $NEW_VERSION\""
echo ""
