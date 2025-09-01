#!/bin/bash

# TechPulse 版本更新脚本
# 用法: ./update-version.sh [版本号]
# 示例: ./update-version.sh 0.2.0

set -e

VERSION=${1:-"0.1.3"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 TechPulse 版本管理工具"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 验证版本号格式
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ 错误: 版本号格式无效。请使用 x.y.z 格式 (例如: 1.2.3)"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装。请先安装 Node.js"
    exit 1
fi

echo "📋 当前目录: $SCRIPT_DIR"
echo "🎯 目标版本: $VERSION"
echo

# 运行版本管理工具
if [ -f "$SCRIPT_DIR/version-manager.js" ]; then
    echo "📝 正在更新版本信息..."
    node "$SCRIPT_DIR/version-manager.js" "$VERSION"
    echo
else
    echo "❌ 错误: version-manager.js 文件不存在"
    exit 1
fi

# 检查是否在 Git 仓库中
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo "📚 Git 信息:"
    echo "   当前分支: $(git branch --show-current)"
    echo "   最新提交: $(git log -1 --oneline)"
    echo
    
    # 询问是否提交更改
    read -p "🤔 是否要将版本更改提交到 Git? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📤 正在提交版本更改..."
        git add .
        git commit -m "chore: bump version to v$VERSION

- 更新版本号到 $VERSION
- 更新构建信息和发布说明
- 自动化版本管理工具执行"
        
        echo "✅ 版本更改已提交到 Git"
        echo "💡 提示: 使用 'git push' 推送到远程仓库"
        echo "💡 提示: 使用 'git tag v$VERSION && git push --tags' 创建版本标签"
    fi
else
    echo "ℹ️  当前目录不是 Git 仓库，跳过 Git 操作"
fi

echo
echo "🎉 版本更新完成!"
echo "📋 版本信息:"
echo "   版本: $VERSION"
echo "   构建: $(date +%Y%m%d)"
echo "   时间: $(date)"
echo
echo "🔧 后续操作建议:"
echo "   1. 检查更新后的文件内容"
echo "   2. 运行测试确保功能正常"
echo "   3. 构建和部署新版本"
echo "   4. 更新部署文档"