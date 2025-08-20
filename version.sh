#!/bin/bash

# TechPulse Version Management Script
# 便捷的版本管理脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_MANAGER="$SCRIPT_DIR/scripts/version-manager.py"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏷️  TechPulse Version Manager${NC}"
echo

# 检查Python脚本是否存在
if [ ! -f "$VERSION_MANAGER" ]; then
    echo -e "${RED}❌ Version manager script not found: $VERSION_MANAGER${NC}"
    exit 1
fi

# 如果没有参数，显示帮助
if [ $# -eq 0 ]; then
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  show                    - Show current version"
    echo "  bump [patch|minor|major] - Bump version (default: patch)"
    echo "  set <version>           - Set specific version"
    echo "  release                 - Prepare for release"
    echo
    echo "Examples:"
    echo "  $0 show"
    echo "  $0 bump patch"
    echo "  $0 bump minor --codename 'Feature Update'"
    echo "  $0 set 2.1.0 --codename 'Major Release'"
    echo "  $0 release"
    exit 0
fi

COMMAND=$1
shift

case $COMMAND in
    "show")
        echo -e "${BLUE}📋 Current Version Information:${NC}"
        python3 "$VERSION_MANAGER" show
        ;;
    "bump")
        TYPE=${1:-patch}
        echo -e "${YELLOW}⬆️  Bumping version ($TYPE)...${NC}"
        python3 "$VERSION_MANAGER" bump --type "$TYPE" "$@"
        echo -e "${GREEN}✅ Version updated successfully!${NC}"
        ;;
    "set")
        if [ -z "$1" ]; then
            echo "Error: Version number required"
            echo "Usage: $0 set <version> [--codename 'name'] [--description 'desc']"
            exit 1
        fi
        echo -e "${YELLOW}🔧 Setting version to $1...${NC}"
        python3 "$VERSION_MANAGER" set --version "$1" "${@:2}"
        echo -e "${GREEN}✅ Version set successfully!${NC}"
        ;;
    "release")
        echo -e "${YELLOW}🚀 Preparing release...${NC}"
        python3 "$VERSION_MANAGER" release "$@"
        echo -e "${GREEN}✅ Release prepared!${NC}"
        ;;
    *)
        echo "Unknown command: $COMMAND"
        echo "Run '$0' without arguments to see usage help."
        exit 1
        ;;
esac

echo
echo -e "${BLUE}💡 Next steps:${NC}"
echo "  - Update RELEASE.md with new version details"
echo "  - Test the application thoroughly"
echo "  - Commit changes and create git tag"
echo "  - Deploy to production"