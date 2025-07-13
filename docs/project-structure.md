# TechPulse 项目结构

## 总体架构
```
TechPulse/
├── backend/          # Python FastAPI 后端
├── frontend/         # React + TypeScript 前端
├── docs/            # 项目文档
└── README.md        # 项目说明
```

## 后端结构 (Python + FastAPI + Poetry)
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 应用入口
│   ├── api/                 # API 路由
│   │   ├── __init__.py
│   │   ├── auth.py          # 认证相关
│   │   ├── cards.py         # 情报卡片接口
│   │   ├── sources.py       # 数据源接口
│   │   └── trials.py        # 试用记录接口
│   ├── core/                # 核心配置
│   │   ├── __init__.py
│   │   ├── config.py        # 配置管理
│   │   ├── database.py      # 数据库连接
│   │   └── security.py      # 安全相关
│   ├── models/              # 数据模型
│   │   ├── __init__.py
│   │   ├── card.py          # 情报卡片模型
│   │   ├── source.py        # 数据源模型
│   │   └── trial.py         # 试用记录模型
│   ├── services/            # 业务逻辑
│   │   ├── __init__.py
│   │   ├── scrapers/        # 数据抓取
│   │   │   ├── github.py    # GitHub Trending
│   │   │   ├── arxiv.py     # arXiv 论文
│   │   │   └── huggingface.py # HF 模型
│   │   ├── ai/              # AI 服务
│   │   │   ├── summarizer.py # 摘要生成
│   │   │   └── translator.py # 翻译服务
│   │   ├── notion.py        # Notion 同步
│   │   └── scheduler.py     # 定时任务
│   └── utils/               # 工具函数
│       ├── __init__.py
│       └── helpers.py
├── tests/                   # 测试文件
├── alembic/                 # 数据库迁移
├── pyproject.toml           # Poetry 依赖管理
└── .env.example             # 环境变量示例
```

## 前端结构 (React + TypeScript + Vite)
```
frontend/
├── src/
│   ├── components/          # 通用组件
│   │   ├── CardList.tsx     # 卡片列表
│   │   ├── CardDetail.tsx   # 卡片详情
│   │   ├── FilterBar.tsx    # 过滤栏
│   │   └── TrialRecord.tsx  # 试用记录
│   ├── pages/               # 页面组件
│   │   ├── Dashboard.tsx    # 仪表盘
│   │   ├── Detail.tsx       # 详情页
│   │   ├── Trials.tsx       # 试用记录页
│   │   └── Settings.tsx     # 设置页
│   ├── services/            # API 调用
│   │   ├── api.ts           # API 基础配置
│   │   ├── cards.ts         # 卡片相关接口
│   │   └── trials.ts        # 试用记录接口
│   ├── stores/              # 状态管理 (Zustand)
│   │   ├── useCardStore.ts  # 卡片状态
│   │   └── useTrialStore.ts # 试用记录状态
│   ├── types/               # TypeScript 类型
│   │   ├── card.ts          # 卡片类型
│   │   └── trial.ts         # 试用记录类型
│   ├── utils/               # 工具函数
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源
├── package.json             # NPM 依赖
├── tsconfig.json            # TypeScript 配置
└── vite.config.ts           # Vite 配置
```

## 技术栈选择
- **后端**: Python + FastAPI + SQLAlchemy + Poetry
- **前端**: React + TypeScript + Vite + Ant Design
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **AI服务**: Azure OpenAI / Local LLM
- **第三方集成**: Notion API
- **状态管理**: Zustand
- **样式**: Ant Design + CSS Modules