# TechPulse
每日技术情报可视化仪表盘 + 结构化尝试记录系统

## 🎯 项目概述

TechPulse 是一个集成 GitHub Trending、arXiv、Hugging Face 等来源的技术情报收集系统，通过结构化摘要 + 中文显示 + Notion保存 + 试用建议 + 项目尝试记录，构建一个个人或团队的技术情报中枢。

## ✨ 核心功能

- **多源数据收集**: 自动抓取 GitHub Trending、arXiv 论文、HuggingFace 模型
- **AI 智能摘要**: 使用 Azure OpenAI 生成中文摘要和试用建议
- **标签分类**: 自动提取技术标签，便于分类和搜索
- **Notion 同步**: 将情报卡片同步到 Notion 数据库
- **试用记录**: 记录项目试用过程和结果
- **可视化仪表盘**: Web 界面展示和管理技术情报

## 🏗️ 项目结构

```
TechPulse/
├── backend/          # Python FastAPI 后端
│   ├── app/          # 应用核心代码
│   │   ├── api/      # API路由
│   │   ├── core/     # 核心配置
│   │   ├── models/   # 数据模型
│   │   ├── services/ # 业务逻辑
│   │   └── utils/    # 工具函数
│   ├── tests/        # 测试文件
│   └── pyproject.toml # Poetry 依赖管理
├── frontend/         # React + TypeScript 前端（计划中）
├── docs/            # 项目文档
└── README.md        # 项目说明
```

## 🚀 快速开始

### 后端设置

1. **安装依赖**
   ```bash
   cd backend
   poetry install
   ```

2. **环境配置**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，配置API密钥
   ```

3. **启动服务**
   ```bash
   poetry run python run.py
   ```

4. **访问API文档**
   ```
   http://localhost:8000/docs
   ```

### 主要API端点

- **数据收集**: `POST /api/v1/sources/collect`
- **卡片管理**: `GET /api/v1/cards`
- **AI增强**: `POST /api/v1/ai/enhance-all`
- **Notion同步**: `POST /api/v1/notion/sync-all`

## 📊 当前进度

### ✅ 已完成
- [x] 后端 FastAPI 架构设计
- [x] 数据库模型和API接口
- [x] GitHub/arXiv/HuggingFace 数据抓取
- [x] Azure OpenAI 摘要生成
- [x] Notion 同步功能
- [x] 完整的后端API服务

### 🚧 进行中
- [ ] 前端 React 应用开发
- [ ] 仪表盘界面设计
- [ ] 前后端集成

### 📋 计划中
- [ ] 用户认证系统
- [ ] 数据可视化图表
- [ ] 移动端适配
- [ ] Docker 部署配置

## 🛠️ 技术栈

### 后端
- **框架**: FastAPI + Python 3.9+
- **数据库**: SQLAlchemy + SQLite/PostgreSQL
- **AI服务**: Azure OpenAI
- **任务管理**: 异步后台任务
- **依赖管理**: Poetry

### 前端（计划）
- **框架**: React + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design
- **状态管理**: Zustand

### 集成服务
- **Azure OpenAI**: 智能摘要生成
- **Notion API**: 数据同步
- **GitHub API**: 开源项目信息
- **arXiv API**: 学术论文数据
- **HuggingFace API**: 模型和数据集

## 📖 详细文档

- [项目结构说明](docs/project-structure.md)
- [后端设置指南](docs/backend-setup.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔧 环境要求

- Python 3.9+
- Poetry
- Azure OpenAI API 访问权限（可选）
- Notion API Token（可选）

## 📞 联系方式

如有问题或建议，请创建 Issue 或联系项目维护者。
