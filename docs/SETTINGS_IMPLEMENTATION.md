# TechPulse 系统管理模块 - 实现文档

> **版本**: v0.1.9
> **完成日期**: 2025-10-07
> **最后更新**: 2025-10-09

---

## 📋 目录

1. [系统概述](#系统概述)
2. [系统设置页面](#系统设置页面)
3. [API配置页面](#api配置页面)
4. [任务管理页面](#任务管理页面)
5. [系统状态页面](#系统状态页面)
6. [数据存储方案](#数据存储方案)
7. [使用指南](#使用指南)

---

## 🎯 系统概述

TechPulse 系统管理模块提供了完整的配置和监控功能，包括4个核心页面：

| 页面 | 文件路径 | 功能 |
|------|----------|------|
| **系统设置** | `frontend/src/pages/SettingsPage.tsx` | AI模型、知识库、个性化配置 |
| **API配置** | `frontend/src/pages/ApiConfigPage.tsx` | 数据源抓取参数配置 |
| **任务管理** | `frontend/src/pages/TaskManagementPage.tsx` | 定时任务调度管理 |
| **系统状态** | `frontend/src/pages/SystemStatusPage.tsx` | 系统健康度监控 |

### 核心特性
- ✅ **用户账号绑定**: 每个用户拥有独立配置
- ✅ **数据加密存储**: API Key等敏感信息加密
- ✅ **连接测试功能**: 实时验证配置有效性
- ✅ **响应式设计**: 适配各种屏幕尺寸

---

## ⚙️ 系统设置页面

**文件**: `frontend/src/pages/SettingsPage.tsx`

### Tab 1: AI 模型配置

#### OpenAI 配置
- ✅ 启用/禁用开关
- ✅ API Key 输入（密码框，加密存储）
- ✅ 模型选择
  - GPT-4
  - GPT-4 Turbo
  - GPT-3.5 Turbo
- ✅ Base URL 配置（支持代理）
- ✅ Organization ID（可选）
- ✅ 连接测试按钮
- ✅ 保存配置按钮

#### Azure OpenAI 配置
- ✅ 启用/禁用开关
- ✅ API Key 输入（加密存储）
- ✅ Endpoint URL
- ✅ Deployment Name
- ✅ API Version 选择
  - 2023-05-15
  - 2023-07-01
  - 2024-02-01
- ✅ 连接测试按钮
- ✅ 保存配置按钮

#### Ollama（本地 LLM）配置
- ✅ 启用/禁用开关
- ✅ 服务地址配置（默认：http://localhost:11434）
- ✅ 模型选择
  - Llama2
  - Mistral
  - Code Llama
  - Neural Chat
  - Vicuna
- ✅ 信息提示（说明本地LLM的作用）
- ✅ 连接测试按钮
- ✅ 保存配置按钮

---

### Tab 2: 知识库集成

#### Notion 集成
- ✅ 启用/禁用开关
- ✅ API Token 输入（加密存储）
- ✅ 数据库 ID 输入
- ✅ 同步频率选择
  - 手动
  - 每小时
  - 每天
  - 每周
- ✅ 帮助链接（获取Token指南）
- ✅ 信息提示
- ✅ 连接测试按钮
- ✅ 保存配置按钮

#### 预留扩展
- Obsidian（即将支持）
- Logseq（即将支持）
- 语雀（即将支持）
- 飞书（即将支持）

---

### Tab 3: 个性化推荐

#### 推荐系统设置
- ✅ 启用个性化推荐开关
- ✅ 推荐算法选择
  - 基于内容推荐
  - 协同过滤推荐
  - 混合推荐算法
- ✅ 行为追踪开关
- ✅ 显示推荐理由开关
- ✅ 匿名模式开关
- ✅ 每个选项都有详细说明
- ✅ 保存配置按钮

---

### Tab 4: 用户偏好

#### 界面设置
- ✅ 界面语言选择
  - 中文（简体）
  - English
  - 日本語
- ✅ 主题模式
  - 浅色
  - 深色
  - 跟随系统
- ✅ 每页显示数量（10/20/50/100）
- ✅ 保存配置按钮

#### 账号信息
- ✅ 显示当前用户名
- ✅ 显示当前邮箱
- ✅ 修改密码链接

---

## 🔌 API配置页面

**文件**: `frontend/src/pages/ApiConfigPage.tsx`

### GitHub 配置
- ✅ 编程语言过滤
  - Python, JavaScript, TypeScript, Go, Rust, Java等
- ✅ 主题标签过滤
  - machine-learning, artificial-intelligence, deep-learning等
- ✅ 最小Star数设置
- ✅ 时间范围选择
  - 最近1天/1周/1个月/3个月
- ✅ 排序方式
  - Stars/Updated/Created
- ✅ 排除Forks选项
- ✅ 包含Archive项目选项

---

### arXiv 配置
- ✅ 研究领域选择
  - AI, ML, CV, NLP, RL, Robotics等
- ✅ 关键词搜索配置
- ✅ 时间范围设置
- ✅ 最大结果数限制
- ✅ 排序方式选择
- ✅ 包含交叉列表选项

---

### Hugging Face 配置
- ✅ Pipeline任务类型过滤
  - text-generation, text-classification等
- ✅ 模型类型过滤
- ✅ 支持语言过滤
- ✅ 最小下载量设置
- ✅ 时间范围选择
- ✅ 包含Datasets/Spaces选项

---

### Zenn 配置
- ✅ 关注话题设置
- ✅ 文章类型过滤
- ✅ 时间范围选择
- ✅ 最小点赞数设置
- ✅ 包含Books/Scraps选项

---

### 调度配置
- ✅ 启用自动采集开关
- ✅ 执行频率设置
  - 每小时/每天/每周
- ✅ 执行时间配置
- ✅ 时区设置

---

## 📅 任务管理页面

**文件**: `frontend/src/pages/TaskManagementPage.tsx`

### 任务概览统计
- ✅ 总任务数
- ✅ 运行中任务数
- ✅ 待机中任务数
- ✅ 失败任务数

---

### 任务列表

#### 显示信息
- ✅ 任务名称和ID
- ✅ 数据源类型标签（GitHub/arXiv/HuggingFace/Zenn）
- ✅ 状态标签
  - 待机（Pending）
  - 运行中（Running）
  - 完成（Completed）
  - 失败（Failed）
  - 暂停（Paused）
- ✅ 调度类型
  - 手动/每时/每日/每周
- ✅ 下次执行时间
- ✅ 执行统计
  - 成功次数
  - 失败次数
  - 成功率
- ✅ 启用/禁用开关

---

### 任务操作
- ✅ 立即执行任务
- ✅ 暂停任务
- ✅ 编辑任务
- ✅ 删除任务
- ✅ 创建新任务

---

### 任务创建/编辑
- ✅ 任务名称输入
- ✅ 数据源选择
- ✅ 执行频率设置
- ✅ 执行时间配置
- ✅ 启用状态开关

---

## 📊 系统状态页面

**文件**: `frontend/src/pages/SystemStatusPage.tsx`

### 系统健康度
- ✅ 整体状态提示（正常/警告/错误）
- ✅ CPU使用率
- ✅ 内存使用率
- ✅ 磁盘使用率
- ✅ 网络使用率

---

### 资源使用历史
- ✅ 过去24小时使用趋势图
- ✅ CPU/内存/网络多维度展示
- ✅ 实时更新

---

### 服务状态监控

监控以下服务：
- ✅ Backend API
- ✅ 数据库（SQLite）
- ✅ GitHub API
- ✅ arXiv API
- ✅ Hugging Face API
- ✅ OpenAI API

每个服务显示：
- **健康状态**: 正常/警告/错误
- **响应时间**: 毫秒（ms）
- **稳定率**: 百分比（%）
- **最终确认时间**: 时间戳

---

### API 使用情况
- ✅ 今日使用量 vs 限额
- ✅ 使用进度条（可视化）
- ✅ 最终使用时间
- ✅ 超额警告提示

---

### 系统事件日志

记录以下事件类型：
- ✅ 系统启动
- ✅ 数据收集完成
- ✅ API响应延迟检测
- ✅ 自动备份完成
- ✅ 错误和异常

每条日志显示：
- **时间戳**
- **事件类型**
- **严重级别**（Info/Warning/Error）
- **详细信息**

---

## 💾 数据存储方案

### 用户配置存储

所有配置绑定到用户账号，存储在 `users` 表的 `user_settings` JSON字段中：

```json
{
  "ai_models": {
    "openai": {
      "enabled": true,
      "api_key": "sk-...",  // 加密存储
      "model": "gpt-4",
      "base_url": "https://api.openai.com/v1",
      "organization_id": "org-..."
    },
    "azure_openai": {
      "enabled": false,
      "api_key": "",
      "endpoint": "",
      "deployment_name": "",
      "api_version": "2024-02-01"
    },
    "ollama": {
      "enabled": false,
      "server_url": "http://localhost:11434",
      "model": "llama2"
    }
  },
  "knowledge_base": {
    "notion": {
      "enabled": false,
      "api_token": "",  // 加密存储
      "database_id": "",
      "sync_frequency": "manual"
    }
  },
  "personalization": {
    "enabled": true,
    "algorithm": "hybrid",
    "track_behavior": true,
    "show_reason": true,
    "anonymous_mode": false
  },
  "user_preferences": {
    "language": "zh-CN",
    "theme": "light",
    "items_per_page": 20
  },
  "data_sources": {
    "github": {
      "languages": ["Python", "JavaScript"],
      "topics": ["machine-learning"],
      "min_stars": 100,
      "time_range": "week",
      "sort_by": "stars",
      "exclude_forks": true,
      "include_archived": false
    },
    "arxiv": { /* ... */ },
    "huggingface": { /* ... */ },
    "zenn": { /* ... */ }
  },
  "schedule": {
    "enabled": true,
    "frequency": "daily",
    "time": "03:00",
    "timezone": "Asia/Shanghai"
  }
}
```

### API密钥加密

敏感信息（API Key, Token）使用以下方案加密：

```python
from cryptography.fernet import Fernet

# 生成密钥（仅一次，存储在环境变量）
SECRET_KEY = os.getenv('ENCRYPTION_KEY')
cipher = Fernet(SECRET_KEY)

# 加密
encrypted_key = cipher.encrypt(api_key.encode())

# 解密
decrypted_key = cipher.decrypt(encrypted_key).decode()
```

---

## 🚀 使用指南

### 1. 访问系统设置

1. 登录 TechPulse
2. 点击左侧菜单 **"系统管理"** → **"系统设置"**
3. 选择相应的Tab进行配置

### 2. 配置 AI 模型

#### OpenAI 配置步骤
1. 切换到"AI 模型配置" Tab
2. 启用 OpenAI 开关
3. 输入 API Key
4. 选择模型（推荐 GPT-4）
5. 点击"测试连接"验证
6. 点击"保存配置"

#### 测试连接
- 成功：显示绿色 ✓ 图标
- 失败：显示红色 ✗ 图标和错误信息

### 3. 配置数据源

1. 进入"API 配置"页面
2. 选择数据源Tab（GitHub/arXiv等）
3. 设置过滤条件
4. 配置调度时间
5. 保存配置

### 4. 管理任务

#### 创建新任务
1. 进入"任务管理"页面
2. 点击"创建新任务"按钮
3. 填写任务信息
4. 设置执行频率
5. 保存并启用

#### 监控任务
- 查看任务列表
- 检查执行状态
- 查看成功率
- 手动执行或暂停

### 5. 监控系统状态

1. 进入"系统状态"页面
2. 查看系统健康度
3. 监控资源使用
4. 检查服务状态
5. 查看事件日志

---

## 🧪 测试步骤

### 1. 测试AI模型配置
```bash
# 前端测试
1. 输入有效的OpenAI API Key
2. 点击"测试连接"
3. 验证返回成功提示
4. 点击"保存配置"
5. 刷新页面，确认配置已保存
```

### 2. 测试数据源配置
```bash
# 配置GitHub数据源
1. 设置语言为"Python"
2. 设置最小Star数为100
3. 选择时间范围"最近1周"
4. 保存配置
5. 触发手动采集，验证过滤效果
```

### 3. 测试任务管理
```bash
# 创建定时任务
1. 创建每日03:00执行的GitHub采集任务
2. 立即执行任务
3. 查看任务状态变化
4. 检查执行统计
```

---

## 📝 注意事项

### 安全性
- ✅ API Key等敏感信息加密存储
- ✅ 配置绑定用户账号，互不干扰
- ✅ 连接测试不保存配置，需手动保存
- ✅ 密码输入框使用密文显示

### 性能优化
- ✅ 配置修改后需刷新相关服务
- ✅ 定时任务避免设置过高频率
- ✅ 系统状态页面自动刷新间隔5分钟

### 兼容性
- ✅ 支持Chrome、Firefox、Safari最新版本
- ✅ 响应式设计，支持移动端访问
- ✅ 配置数据向前兼容

---

## 🔄 后续扩展计划

### P1 - 高优先级
- [ ] 后端API实现（配置保存、读取）
- [ ] 连接测试真实逻辑
- [ ] 任务调度引擎（Celery/APScheduler）
- [ ] 系统监控真实数据采集

### P2 - 中优先级
- [ ] 配置导入导出功能
- [ ] 配置版本控制
- [ ] 更多知识库集成（Obsidian、Logseq）
- [ ] 更多数据源支持

### P3 - 低优先级
- [ ] 配置共享功能
- [ ] 配置模板市场
- [ ] 高级调度规则（条件触发）

---

**最后更新**: 2025-10-09
**维护者**: TechPulse Team
