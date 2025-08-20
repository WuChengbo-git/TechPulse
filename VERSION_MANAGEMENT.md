# 版本管理指南

## 概述
TechPulse 使用语义化版本控制 (Semantic Versioning)，版本号格式为 `MAJOR.MINOR.PATCH`：
- **MAJOR**: 不兼容的API修改
- **MINOR**: 向下兼容的功能性新增  
- **PATCH**: 向下兼容的问题修正

## 版本管理工具

### 快速使用
```bash
# 显示当前版本
./version.sh show

# 升级补丁版本 (2.0.0 -> 2.0.1)
./version.sh bump patch

# 升级小版本 (2.0.1 -> 2.1.0)
./version.sh bump minor

# 升级大版本 (2.1.0 -> 3.0.0)
./version.sh bump major

# 设置特定版本
./version.sh set 2.0.0 --codename "TechPulse Core"

# 准备发布
./version.sh release
```

### 高级用法
```bash
# 带描述的版本升级
./version.sh bump minor \
  --codename "Analytics Update" \
  --description "Enhanced data visualization and AI analysis features"

# 设置完整版本信息
./version.sh set 2.1.0 \
  --codename "Feature Enhancement" \
  --description "Added real-time chat and improved performance"
```

## 发布流程

### 1. 开发阶段
```bash
# 开发新功能时，升级小版本
./version.sh bump minor --codename "New Features"

# 修复问题时，升级补丁版本  
./version.sh bump patch --description "Bug fixes and improvements"
```

### 2. 发布准备
```bash
# 准备发布
./version.sh release

# 更新发布文档
# 编辑 RELEASE.md，添加新版本的详细信息
```

### 3. 版本发布
```bash
# 1. 提交所有更改
git add .
git commit -m "Release v2.0.0: TechPulse Core"

# 2. 创建版本标签
git tag -a v2.0.0 -m "Release v2.0.0: TechPulse Core"

# 3. 推送到远程
git push origin main --tags

# 4. 部署到生产环境
./start.sh
```

## 文件结构
```
TechPulse/
├── version.json                     # 版本配置文件
├── version.sh                       # 版本管理脚本  
├── scripts/version-manager.py       # Python版本管理器
├── frontend/src/components/         
│   └── VersionInfo.tsx             # 前端版本显示组件
├── RELEASE.md                      # 发布说明
└── VERSION_MANAGEMENT.md           # 版本管理文档
```

## 版本配置文件 (version.json)
```json
{
  "version": "1.0.2",
  "build": "20250820", 
  "codename": "TechPulse Core",
  "releaseDate": "2025-08-20",
  "description": "Major feature update with AI-driven analysis"
}
```

## 前端版本显示
版本信息会自动显示在页面底部，包含：
- 版本号 (Version 1.0.2)
- 构建号 (Build 20250820)

## 自动化流程
版本管理工具会自动：
1. ✅ 更新 `version.json` 配置文件
2. ✅ 生成新的构建号 (YYYYMMDD格式)
3. ✅ 同步更新前端 `VersionInfo.tsx` 组件
4. ✅ 设置发布日期为当前日期

## 版本历史示例
```
v1.0.2 (2025-08-20) - TechPulse Core
  - 🚀 AI驱动的内容分析系统
  - 📊 数据可视化分析平台
  - 🤖 智能聊天助手
  - 🔄 自动化任务调度

v1.0.1 (2025-07-01) - Initial Release  
  - 🎯 基础数据收集功能
  - 📱 简单的Web界面
  - 🔧 基本配置管理
```

## 最佳实践

### 何时升级版本
- **补丁版本 (Patch)**: 
  - 错误修复
  - 安全补丁
  - 小的UI改进
  - 性能优化

- **小版本 (Minor)**:
  - 新功能添加
  - 新的API端点
  - 向下兼容的改进
  - 新的数据源支持

- **大版本 (Major)**:
  - 破坏性更改
  - 架构重大调整
  - 不兼容的API变更
  - 重新设计的用户界面

### 版本命名约定
- **Codename**: 简短、有意义的名称，反映版本特色
- **Description**: 详细说明主要变更和改进
- **Build**: 自动生成的构建日期标识

### 发布检查清单
- [ ] 所有测试通过
- [ ] 更新文档
- [ ] 更新RELEASE.md
- [ ] 创建git标签
- [ ] 部署测试
- [ ] 通知相关团队

## 故障排除

### 常见问题
1. **脚本权限错误**
   ```bash
   chmod +x version.sh
   chmod +x scripts/version-manager.py
   ```

2. **Python环境问题**
   ```bash
   python3 scripts/version-manager.py show
   ```

3. **前端组件未更新**
   ```bash
   # 手动重新生成前端组件
   python3 scripts/version-manager.py set --version $(cat version.json | grep version | cut -d'"' -f4)
   ```

## 支持和反馈
如有版本管理相关问题，请：
1. 查看本文档的故障排除部分
2. 检查 `version.json` 文件格式
3. 确认脚本执行权限
4. 提交Issue到项目仓库