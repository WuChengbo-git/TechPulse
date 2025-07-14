# TechPulse 部署指南

## 🎯 概述

TechPulse 是一个智能技术情报收集系统，可以：
- 收集GitHub trending项目（重点关注AI/Python项目）
- 收集Hugging Face热门模型和数据集
- 收集arXiv最新论文
- 使用Azure OpenAI进行智能摘要和翻译（支持中文、日语、英语）
- 提供可视化界面查看和管理技术情报

## 📋 前置要求

- Python 3.9+
- Node.js 16+
- Poetry (Python包管理器)
- Azure OpenAI服务（可选，用于AI功能）

## 🚀 快速开始

### 1. 配置后端

```bash
cd backend
cp .env.template .env
```

### 2. 配置 .env 文件

打开 `backend/.env` 文件，填入以下信息：

```env
# Azure OpenAI配置
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# 语言设置
DEFAULT_LANGUAGE=zh  # zh=中文, ja=日语, en=英语

# 可选：GitHub Token（提高API限制）
GITHUB_TOKEN=your-github-token

# 可选：Notion集成
NOTION_TOKEN=your-notion-token
NOTION_DATABASE_ID=your-notion-database-id
```

### 3. 安装依赖并启动

```bash
# 使用现有的启动脚本
./start.sh
```

或者手动启动：

```bash
# 后端
cd backend
poetry install
poetry run python run.py

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 4. 访问系统

- 前端界面：http://localhost:5173
- 后端API：http://localhost:8000
- API文档：http://localhost:8000/docs

## 🎛️ 功能特性

### 数据收集
- **GitHub trending**：每日Python项目，AI相关项目
- **Hugging Face**：热门模型和数据集
- **arXiv**：最新AI/ML论文

### AI增强功能
- **智能摘要**：使用GPT-4o生成项目摘要
- **多语言翻译**：支持中文、日语、英语
- **标签提取**：自动提取技术标签
- **试用建议**：生成项目试用建议

### 界面功能
- **语言切换**：右上角可切换显示语言
- **翻译功能**：点击卡片"翻译"按钮查看翻译内容
- **AI服务状态**：显示AI服务连接状态
- **试用建议**：卡片底部显示AI生成的试用建议

## 📊 API端点

### 数据收集
- `POST /api/v1/sources/collect` - 收集新数据
- `GET /api/v1/cards/` - 获取技术情报卡片

### 语言和翻译
- `GET /api/v1/languages` - 获取支持的语言
- `POST /api/v1/language/switch` - 切换语言
- `POST /api/v1/translate/card` - 翻译单个卡片
- `POST /api/v1/translate/batch` - 批量翻译

### 系统状态
- `GET /api/v1/status` - 获取服务状态
- `GET /api/v1/health` - 健康检查

## 🔧 配置选项

### 数据收集设置
```env
COLLECTION_INTERVAL_HOURS=6    # 收集间隔（小时）
MAX_ITEMS_PER_SOURCE=50       # 每个源最大收集数量
```

### AI关键词配置
```env
AI_KEYWORDS=machine learning,deep learning,neural network,artificial intelligence,tensorflow,pytorch,keras,scikit-learn,transformers,llm,gpt,bert,stable diffusion,generative ai,chatbot,computer vision,nlp,data science
```

## 🎨 界面说明

### 主界面功能
1. **语言切换器**：右上角下拉菜单，支持中文🇨🇳、日语🇯🇵、英语🇺🇸
2. **AI服务状态**：显示AI服务连接状态（绿色=已连接，红色=未配置）
3. **刷新按钮**：重新加载技术情报卡片
4. **收集新数据**：触发数据收集任务

### 卡片功能
1. **查看原文**：跳转到原始项目/论文页面
2. **翻译按钮**：使用AI翻译内容到选定语言
3. **试用建议**：AI生成的项目试用建议（灰色框）
4. **技术标签**：AI提取的技术标签

## 📝 使用建议

1. **首次使用**：
   - 先配置Azure OpenAI以获得最佳体验
   - 点击"收集新数据"获取初始数据
   - 切换到你偏好的语言

2. **日常使用**：
   - 系统会自动收集新内容
   - 可以手动点击"收集新数据"获取最新信息
   - 使用翻译功能了解不同语言的内容

3. **性能优化**：
   - 如果数据量大，建议调整`MAX_ITEMS_PER_SOURCE`
   - 可以配置GitHub Token提高API限制
   - 定期清理老旧数据

## 🐛 问题排查

### 常见问题

1. **AI服务显示"未配置"**
   - 检查 `.env` 文件中的 `AZURE_OPENAI_API_KEY` 和 `AZURE_OPENAI_ENDPOINT`
   - 确保Azure OpenAI服务正常运行

2. **数据收集失败**
   - 检查网络连接
   - 确认GitHub/Hugging Face API可访问
   - 查看后端日志 `logs/backend.log`

3. **翻译功能不工作**
   - 确认AI服务已正确配置
   - 检查Azure OpenAI部署名称是否正确

### 日志查看
```bash
# 后端日志
tail -f logs/backend.log

# 前端日志
tail -f logs/frontend.log
```

## 🔄 更新系统

```bash
# 停止系统
./stop.sh

# 拉取最新代码
git pull

# 重新启动
./start.sh
```

## 🎉 完成！

现在你可以：
1. 访问 http://localhost:5173 查看技术情报
2. 点击"收集新数据"获取最新内容
3. 使用AI翻译和摘要功能
4. 切换不同语言查看内容

享受你的智能技术情报系统！🚀