# TechPulse 版本管理工具

TechPulse 项目的版本管理工具，用于统一管理项目中所有文件的版本号，确保版本信息的一致性。

## 📋 当前版本

- **版本号**: `0.1.3`
- **构建日期**: `20250901`
- **代号**: `TechPulse Enhanced`
- **发布日期**: `2025-09-01`

## 🛠 工具介绍

### 核心文件

1. **version-manager.js** - 主版本管理工具
2. **update-version.sh** - 简化的Shell脚本
3. **version-config.json** - 版本管理配置
4. **version.json** - 主版本信息文件

### 管理的文件

版本管理工具会自动更新以下文件中的版本信息：

| 文件 | 类型 | 更新内容 | 说明 |
|------|------|----------|------|
| `version.json` | JSON | version, build, releaseDate | 主版本配置 |
| `frontend/package.json` | JSON | version | 前端包版本 |
| `frontend/src/components/VersionInfo.tsx` | TypeScript | version, build | UI版本显示 |
| `RELEASE.md` | Markdown | 完整发布说明 | 版本更新记录 |

## 🚀 使用方法

### 方法1: 使用Shell脚本 (推荐)

```bash
# 更新到默认版本 0.1.3
./update-version.sh

# 更新到指定版本
./update-version.sh 0.2.0
```

### 方法2: 直接使用Node.js工具

```bash
# 更新到默认版本
node version-manager.js

# 更新到指定版本
node version-manager.js 0.2.0

# 查看帮助
node version-manager.js --help
```

## ⚙️ 配置说明

### version-config.json

```json
{
  "name": "TechPulse",
  "currentVersion": "0.1.3",
  "versionFormat": "semantic",
  "autoIncrement": {
    "enabled": true,
    "type": "patch"
  },
  "validation": {
    "semver": true,
    "required": ["version.json", "frontend/package.json"]
  }
}
```

### version.json

```json
{
  "version": "0.1.3",
  "build": "20250901", 
  "codename": "TechPulse Enhanced",
  "releaseDate": "2025-09-01",
  "description": "Enhanced UI improvements with multi-language support"
}
```

## 📚 版本命名规范

### 语义化版本 (Semantic Versioning)

采用 `x.y.z` 格式：

- **x (主版本号)**: 不兼容的API修改
- **y (次版本号)**: 向下兼容的功能性新增  
- **z (修订版本号)**: 向下兼容的问题修正

### 版本示例

```
0.1.0 - 初始版本
0.1.1 - 修复bug
0.1.2 - 小功能改进
0.1.3 - UI优化和多语言支持
0.2.0 - 新增重要功能
1.0.0 - 正式发布版本
```

## 🔄 版本更新流程

### 手动流程

1. **规划版本号** - 确定新版本号
2. **运行工具** - 执行版本更新工具
3. **验证更改** - 检查所有文件是否正确更新
4. **测试功能** - 确保新版本功能正常
5. **提交代码** - Git提交版本更改
6. **创建标签** - 创建版本Git标签
7. **发布版本** - 部署新版本

## 📝 发布说明管理

### RELEASE.md 结构

版本管理工具会自动生成详细的发布说明，包含：

- 版本号和发布日期
- 功能更新概览
- 技术改进说明
- 界面优化内容
- 问题修复记录
- 性能优化详情

## 🚨 注意事项

### 使用前检查

1. **Node.js环境** - 确保安装了Node.js
2. **文件权限** - 确保脚本有执行权限
3. **Git状态** - 提交当前工作区更改
4. **备份文件** - 重要文件建议备份

### 常见错误

| 错误 | 原因 | 解决方法 |
|------|------|----------|
| 版本格式错误 | 不符合x.y.z格式 | 使用正确的版本号格式 |
| 文件不存在 | 配置文件路径错误 | 检查文件路径是否正确 |
| 权限不足 | 脚本没有执行权限 | 使用chmod +x设置权限 |

## 📊 版本历史

| 版本 | 发布日期 | 主要更新 |
|------|----------|----------|
| 0.1.3 | 2025-09-01 | UI优化、多语言支持、API配置管理 |
| 0.1.2 | 2025-08-25 | 前端组件完善 |
| 0.1.1 | 2025-08-20 | 基础功能实现 |
| 0.1.0 | 2025-08-15 | 项目初始化 |

---

**TechPulse Team**  
版本管理，让发布更规范 📦