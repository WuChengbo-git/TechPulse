<div align="center">
  <img src="assets/logo.svg" alt="TechPulse Logo" width="200" height="200">

  # TechPulse

  ### 🚀 智能技术情报聚合平台 - 让技术洞察更加精准

  **语言**: [English](README.en.md) | [中文](README.md) | [日本語](README.ja.md)
</div>

<br>

[![Version](https://img.shields.io/badge/version-0.1.8-blue.svg)](https://github.com/WuChengbo-git/TechPulse)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)

## 🎯 项目概述

TechPulse 是一个集成多源技术情报的智能聚合平台，整合 GitHub、arXiv、Hugging Face、Zenn 等优质数据源，通过 AI 增强和可视化分析，帮助开发者和研究者快速捕捉技术趋势，提升信息获取效率。

### 核心特性

- 🌐 **多源数据整合** - GitHub Trending、arXiv 论文、HuggingFace 模型、Zenn 技术文章
- 🤖 **AI 智能增强** - OpenAI GPT 驱动的内容摘要和标签翻译
- 🌍 **完整国际化** - 中文、English、日本語三语言支持
- 📊 **趋势分析** - 编程语言活跃度、AI 领域热度、技术栈分析
- 🔐 **用户认证** - JWT 安全认证系统
- 📱 **响应式设计** - 适配桌面和移动设备

## ✨ 核心功能

### 数据源管理
- **GitHub Trending** - 追踪热门开源项目和代码仓库
- **arXiv Papers** - 聚合最新学术论文和研究成果
- **Hugging Face** - AI 模型和数据集探索
- **Zenn Articles** - 日本技术社区优质内容

### 智能分析
- **趋势可视化** - 多维度数据图表展示
- **热点追踪** - 识别新兴技术和流行趋势
- **标签分类** - AI 自动提取和翻译技术标签
- **智能推荐** - 基于用户偏好的内容推荐

### 用户体验
- **多语言界面** - 中英日三语言无缝切换
- **自定义筛选** - 灵活的数据源和内容过滤
- **实时更新** - 定时自动抓取最新技术情报
- **个性化配置** - 可定制的数据源和显示设置

## 🏗️ 项目结构

```
TechPulse/
├── backend/              # Python FastAPI 后端
│   ├── app/
│   │   ├── api/          # RESTful API 路由
│   │   ├── core/         # 核心配置和数据库
│   │   ├── models/       # SQLAlchemy 数据模型
│   │   ├── services/     # 业务逻辑服务
│   │   └── utils/        # 工具函数
│   ├── tests/            # 单元测试
│   └── requirements.txt  # Python 依赖
├── frontend/             # React + TypeScript 前端
│   ├── src/
│   │   ├── components/   # React 组件
│   │   ├── pages/        # 页面组件
│   │   ├── contexts/     # Context API
│   │   ├── utils/        # 工具函数
│   │   └── translations/ # 国际化翻译
│   └── package.json      # Node.js 依赖
├── scripts/              # 自动化脚本
│   ├── dev.sh            # 开发环境启动
│   ├── start.sh          # 生产环境启动
│   ├── stop.sh           # 停止服务
│   └── version-manager.py # 版本管理
├── docs/                 # 项目文档
│   ├── FUTURE_FEATURES.md     # 待开发功能
│   ├── DEVELOPMENT_LOG.md     # 开发日志
│   ├── RELEASE.md             # 版本发布记录
│   ├── SETUP_GUIDE.md         # 安装配置指南
│   ├── DEPLOYMENT_GUIDE.md    # 部署指南
│   └── ...                    # 其他文档
├── logs/                 # 日志文件
├── .gitignore
├── LICENSE
└── README.md
```

## 🚀 快速开始

### 环境要求

- **Python** 3.9+
- **Node.js** 16+
- **npm** 或 **yarn**
- **SQLite** (开发) / **PostgreSQL** (生产)

### 一键启动（开发环境）

```bash
# 克隆项目
git clone https://github.com/WuChengbo-git/TechPulse.git
cd TechPulse

# 启动开发环境（前端 + 后端）
chmod +x scripts/dev.sh
./scripts/dev.sh
```

### 手动安装

#### 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置必要的 API 密钥

# 启动后端服务
uvicorn app.main:app --reload --port 8000
```

#### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 访问应用

- **前端界面**: http://localhost:3000
- **后端 API 文档**: http://localhost:8000/docs
- **后端健康检查**: http://localhost:8000/health

## 📊 主要功能展示

### 数据源页面
- **Overview** - 综合概览，展示所有数据源的最新内容
- **GitHub** - GitHub Trending 仓库和项目
- **arXiv** - 最新学术论文和研究
- **Hugging Face** - AI 模型和数据集
- **Zenn** - 日本技术社区文章

### 智能分析
- **Trends** - 技术趋势分析和可视化
- **Analytics** - 数据统计和洞察报告
- **AI Chat** - AI 助手问答（计划中）

### 系统管理
- **Data Sources** - 数据源配置和管理
- **Settings** - 个人偏好和系统设置

## 🛠️ 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Ant Design 5** - UI 组件库
- **@ant-design/charts** - 数据可视化
- **React Router** - 路由管理
- **Axios** - HTTP 客户端

### 后端
- **FastAPI** - 高性能 Web 框架
- **SQLAlchemy** - ORM 数据库操作
- **Pydantic** - 数据验证
- **JWT** - 身份认证
- **bcrypt** - 密码加密
- **OpenAI API** - AI 翻译服务

### 数据库
- **SQLite** - 开发环境
- **PostgreSQL** - 生产环境（推荐）

### 工具与服务
- **OpenAI GPT-3.5** - 智能翻译和摘要
- **GitHub API** - 开源项目数据
- **arXiv API** - 学术论文数据
- **Hugging Face API** - AI 模型信息

## 📖 文档索引

### 用户文档
- [安装配置指南](docs/SETUP_GUIDE.md) - 详细的环境配置说明
- [部署指南](docs/DEPLOYMENT_GUIDE.md) - 生产环境部署步骤
- [用户认证系统](docs/AUTH_SYSTEM_COMPLETE.md) - 认证功能说明

### 开发文档
- [开发日志](docs/DEVELOPMENT_LOG.md) - 开发历程和技术决策
- [版本发布记录](docs/RELEASE.md) - 详细的版本更新历史
- [待开发功能](docs/FUTURE_FEATURES.md) - 未来规划和功能路线图
- [项目结构说明](docs/project-structure.md) - 代码组织架构
- [优化指南](docs/OPTIMIZATION_GUIDE.md) - 性能优化建议

### 技术文档
- [语言系统](docs/LANGUAGE_AUTO_DETECTION_GUIDE.md) - 多语言实现方案
- [翻译系统](docs/TRANSLATION_GENERATION_PLAN.md) - AI 翻译架构
- [版本管理](docs/VERSION_MANAGEMENT.md) - 版本控制流程

## 🎯 版本历史

### 最新版本 - v0.1.8 (2025-10-04)
- ✨ 完整的中英日三语言支持
- 🤖 AI 驱动的实时标签翻译
- 🔐 JWT 用户认证系统
- 🎨 180+ 翻译键值全覆盖
- ⚡ 双层缓存优化性能

查看 [完整版本历史](docs/RELEASE.md)

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 贡献方式

1. **Fork 本仓库**
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送到分支** (`git push origin feature/AmazingFeature`)
5. **创建 Pull Request**

### 代码规范

- 遵循 ESLint 和 Prettier 配置
- 编写清晰的提交信息
- 添加必要的单元测试
- 更新相关文档

### 报告问题

发现 Bug？有功能建议？请通过 [GitHub Issues](https://github.com/WuChengbo-git/TechPulse/issues) 告诉我们。

## 📋 待开发功能

查看 [FUTURE_FEATURES.md](docs/FUTURE_FEATURES.md) 了解详细规划。

### 高优先级
- 🔑 忘记密码功能（邮箱验证码重置）
- 🌐 多语言翻译完善

### 中优先级
- 📦 数据源批量导入/导出
- 🔍 高级搜索和筛选

### 低优先级
- 🔔 实时通知系统
- 📊 高级数据分析仪表板

## 📄 许可证

本项目采用 [MIT License](LICENSE) - 自由使用、修改和分发。

## 🙏 致谢

- **Ant Design** - 优秀的 React UI 组件库
- **FastAPI** - 现代化的 Python Web 框架
- **OpenAI** - 强大的 AI API 服务
- **所有贡献者** - 感谢每一位参与者

## 📞 联系方式

- **项目主页**: https://github.com/WuChengbo-git/TechPulse
- **Issues**: https://github.com/WuChengbo-git/TechPulse/issues
- **Discussions**: https://github.com/WuChengbo-git/TechPulse/discussions

---

**TechPulse Team** - 让技术洞察更加精准 🎯

