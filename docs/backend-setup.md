# TechPulse 后端设置指南

## 快速开始

### 1. 安装依赖
```bash
cd backend
poetry install
```

### 2. 环境配置
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的API密钥
```

### 3. 启动服务
```bash
poetry run python run.py
```

## 环境变量配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | 数据库连接URL | `sqlite:///./techpulse.db` |
| `OPENAI_API_KEY` | Azure OpenAI API密钥 | `your_api_key` |
| `OPENAI_API_BASE` | Azure OpenAI API端点 | `https://your-resource.openai.azure.com/` |
| `NOTION_TOKEN` | Notion集成令牌 | `secret_xxx` |
| `NOTION_DATABASE_ID` | Notion数据库ID | `xxx-xxx-xxx` |
| `SECRET_KEY` | JWT密钥 | `your_secret_key` |

## API接口

### 卡片管理 (`/api/v1/cards`)
- `GET /` - 获取卡片列表（支持分页、过滤）
- `GET /{card_id}` - 获取单个卡片详情
- `POST /` - 创建新卡片
- `PUT /{card_id}` - 更新卡片
- `DELETE /{card_id}` - 删除卡片

### 数据源管理 (`/api/v1/sources`)
- `POST /collect` - 触发数据收集（后台任务）
- `GET /collect/sync` - 同步数据收集（测试用）
- `GET /` - 获取数据源状态
- `PUT /{source_id}/toggle` - 切换数据源开关

### AI服务 (`/api/v1/ai`)
- `POST /generate-summary` - 生成摘要和标签
- `POST /enhance-card/{card_id}` - AI增强单个卡片
- `POST /enhance-all` - AI增强所有卡片

### Notion同步 (`/api/v1/notion`)
- `GET /test` - 测试Notion连接
- `POST /sync-card/{card_id}` - 同步单个卡片到Notion
- `POST /sync-all` - 同步所有卡片到Notion
- `GET /status` - 获取同步状态

## 数据收集流程

1. **GitHub Trending**: 获取热门仓库
2. **arXiv**: 获取最新AI论文
3. **HuggingFace**: 获取热门模型和数据集
4. **AI增强**: 自动生成中文摘要和试用建议
5. **Notion同步**: 将卡片同步到Notion数据库

## 开发说明

### 数据库模型
- `TechCard`: 技术情报卡片
- `UserConfig`: 用户配置
- `DataSource`: 数据源配置

### 服务模块
- `scrapers/`: 数据抓取器（GitHub、arXiv、HuggingFace）
- `ai/`: AI服务（摘要生成、标签提取）
- `notion.py`: Notion同步服务
- `data_collector.py`: 数据收集管理器

### 测试命令
```bash
# 运行测试
poetry run pytest

# 代码格式化
poetry run black .
poetry run isort .

# 代码检查
poetry run flake8
```

## 部署建议

1. **数据库**: 生产环境建议使用PostgreSQL
2. **任务队列**: 建议使用Celery+Redis处理后台任务
3. **日志**: 配置适当的日志级别和输出
4. **监控**: 建议添加健康检查和性能监控

## 常见问题

### Q: OpenAI API调用失败？
A: 检查API密钥和端点配置，确保Azure OpenAI服务可用。

### Q: Notion同步失败？
A: 检查Notion Token和数据库ID，确保集成有适当权限。

### Q: 数据抓取不工作？
A: 检查网络连接和API限制，某些服务可能有请求频率限制。