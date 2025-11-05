# P1功能设计：智能搜索 + 推荐系统

> **版本**: v1.0
> **创建时间**: 2025-10-11
> **预计工期**: 2周

---

## 📋 功能概览

### 1. 智能搜索栏 ⭐
**目标**: 统一的搜索入口，支持关键词查询和AI问答

**功能特性**:
- 🔍 关键词搜索（标题、标签、技术栈）
- 🤖 AI智能问答（"推荐学习深度学习的资源"）
- 🎯 意图识别（查询 vs 分析）
- 📊 搜索结果高亮和排序

---

### 2. 基于标签的推荐 ⭐
**目标**: 根据用户兴趣标签推荐相关内容

**功能特性**:
- 💡 "为你推荐"模块
- 🏷️ 基于用户偏好标签筛选
- 📈 推荐理由显示
- 🔄 智能刷新推荐

---

### 3. 用户行为日志 ⭐
**目标**: 记录用户行为，为协同过滤做准备

**功能特性**:
- 👆 点击记录
- ⭐ 收藏记录
- 🔍 搜索历史
- 👀 浏览时长

---

## 🎨 UI设计

### 智能搜索栏设计

```
┌─────────────────────────────────────────────────────────┐
│  🔍  搜索技术内容...                    [🤖 AI问答]    │
│                                                          │
│  💡 试试这些：深度学习  Transformer  FastAPI           │
└─────────────────────────────────────────────────────────┘
```

**交互流程**:
1. 用户输入关键词 → 实时搜索建议
2. 用户点击"AI问答" → 切换到问答模式
3. 显示搜索结果 + 推荐理由

---

### 推荐模块设计

```
┌──────────────────────────────────────┐
│  💡 为你推荐                          │
│                                       │
│  🤖 [GPT-4实战项目]                  │
│     基于你的兴趣：深度学习、NLP       │
│     ⭐ 9.2分 | GitHub 25k+ stars     │
│                                       │
│  📚 [Transformer详解]                │
│     基于你的兴趣：Transformer         │
│     ⭐ 8.5分 | arXiv新论文            │
│                                       │
│  [🔄 换一批]                          │
└──────────────────────────────────────┘
```

---

## 🏗️ 技术架构

### 后端API设计

#### 1. 搜索API
```python
# 智能搜索
POST /api/v1/search
{
  "query": "深度学习推荐",
  "mode": "keyword" | "ai",  # 搜索模式
  "limit": 20
}

Response:
{
  "results": [
    {
      "card": {...},
      "score": 0.95,  # 相关度分数
      "highlights": ["深度学习", "推荐系统"],
      "reason": "匹配你的搜索: 深度学习"
    }
  ],
  "intent": "query" | "analyze",  # 意图识别
  "suggestions": ["深度学习框架", "推荐算法"]
}
```

#### 2. 推荐API
```python
# 基于标签推荐
GET /api/v1/recommendations
?user_id=123&tags=深度学习,NLP&limit=10

Response:
{
  "recommendations": [
    {
      "card": {...},
      "score": 0.88,
      "reason": "基于你的兴趣：深度学习、NLP",
      "matched_tags": ["深度学习", "Transformer"]
    }
  ]
}
```

#### 3. 行为日志API
```python
# 记录用户行为
POST /api/v1/behavior/log
{
  "user_id": 123,
  "action": "click" | "favorite" | "search",
  "card_id": 456,
  "query": "深度学习",  # 仅搜索时
  "duration": 120  # 浏览时长（秒）
}
```

---

### 数据库设计

#### 1. 用户行为表
```sql
CREATE TABLE user_behaviors (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR(20),  -- click, favorite, search, view
    card_id INTEGER,
    query TEXT,  -- 搜索关键词
    duration INTEGER,  -- 浏览时长
    created_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_behaviors_user ON user_behaviors(user_id);
CREATE INDEX idx_user_behaviors_card ON user_behaviors(card_id);
CREATE INDEX idx_user_behaviors_action ON user_behaviors(action);
```

#### 2. 搜索历史表
```sql
CREATE TABLE search_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    query TEXT,
    mode VARCHAR(20),  -- keyword, ai
    results_count INTEGER,
    created_at TIMESTAMP
);
```

---

### 前端组件设计

#### 1. SmartSearch组件
```tsx
interface SmartSearchProps {
  mode: 'keyword' | 'ai'
  onSearch: (query: string) => void
  onModeChange: (mode: 'keyword' | 'ai') => void
}

// 文件: src/components/SmartSearch.tsx
```

#### 2. RecommendationCard组件
```tsx
interface RecommendationCardProps {
  card: TechCard
  reason: string
  score: number
  onRefresh: () => void
}

// 文件: src/components/RecommendationCard.tsx
```

#### 3. SearchResultList组件
```tsx
interface SearchResult {
  card: TechCard
  score: number
  highlights: string[]
  reason: string
}

// 文件: src/components/SearchResultList.tsx
```

---

## 🔧 实现步骤

### Phase 1: 后端基础 (3天)

**Day 1: 数据库和模型**
- [ ] 创建UserBehavior模型
- [ ] 创建SearchHistory模型
- [ ] 数据库迁移脚本

**Day 2: 搜索API**
- [ ] 实现关键词搜索逻辑
- [ ] 实现意图识别（规则基础）
- [ ] 搜索结果高亮

**Day 3: 推荐和日志API**
- [ ] 实现基于标签的推荐算法
- [ ] 实现行为日志记录API
- [ ] 推荐理由生成

---

### Phase 2: 前端实现 (4天)

**Day 4-5: 智能搜索组件**
- [ ] 创建SmartSearch组件
- [ ] 实现搜索建议
- [ ] 实现模式切换（关键词/AI）
- [ ] 搜索结果展示

**Day 6-7: 推荐系统UI**
- [ ] 创建RecommendationCard组件
- [ ] 实现"为你推荐"模块
- [ ] 集成到Dashboard右侧栏
- [ ] 刷新推荐功能

---

### Phase 3: AI增强 (3天)

**Day 8-9: AI问答集成**
- [ ] 集成Azure OpenAI API
- [ ] 实现问答模式
- [ ] 意图识别优化

**Day 10: 优化和测试**
- [ ] 性能优化
- [ ] 用户体验测试
- [ ] Bug修复

---

## 🎯 推荐算法设计

### 基于标签的协同过滤

```python
def calculate_recommendation_score(card, user_preferences):
    """
    计算推荐分数

    考虑因素：
    1. 标签匹配度 (40%)
    2. 质量分数 (30%)
    3. 新鲜度 (20%)
    4. 用户历史行为 (10%)
    """

    # 1. 标签匹配
    user_tags = set(user_preferences.get('tags', []))
    card_tags = set(card.chinese_tags or [])
    tag_match = len(user_tags & card_tags) / max(len(user_tags), 1)

    # 2. 质量分数归一化
    quality_score = card.quality_score / 10.0

    # 3. 新鲜度（7天内加分）
    days_old = (datetime.now() - card.created_at).days
    recency_score = max(0, 1 - days_old / 30)

    # 4. 用户行为（点击过的降权）
    behavior_score = 1.0 if not clicked_before else 0.5

    # 加权求和
    total_score = (
        tag_match * 0.4 +
        quality_score * 0.3 +
        recency_score * 0.2 +
        behavior_score * 0.1
    )

    return total_score
```

---

## 📊 意图识别规则

### 关键词模式
```python
INTENT_PATTERNS = {
    'query': [
        r'搜索|查找|找|有没有',
        r'关于.*的|.*方面的',
        r'.*资源|.*教程|.*项目'
    ],
    'analyze': [
        r'分析|比较|对比',
        r'推荐|建议|适合',
        r'如何|怎么|怎样',
        r'为什么|原因'
    ]
}
```

### AI增强意图
当用户输入包含问句时，自动切换到AI模式：
- "推荐学习深度学习的资源" → AI模式
- "深度学习" → 关键词模式

---

## 🔐 隐私和安全

### 数据隐私
- ✅ 用户行为数据仅用于推荐
- ✅ 搜索历史可选择清除
- ✅ 不记录敏感信息

### 性能考虑
- ✅ 搜索结果缓存（5分钟）
- ✅ 推荐结果缓存（30分钟）
- ✅ 行为日志异步写入

---

## 📈 成功指标

### 搜索功能
- 搜索响应时间 < 500ms
- 搜索准确率 > 80%
- 用户使用率 > 50%

### 推荐功能
- 推荐点击率 > 15%
- 推荐相关度 > 70%
- 用户满意度 > 4/5

---

## 🚀 未来扩展

### v0.4.0 (协同过滤)
- 基于用户相似度的推荐
- 个性化排序算法
- A/B测试框架

### v1.0.0 (深度学习)
- BERT语义搜索
- 神经网络推荐模型
- 实时个性化

---

## 📝 技术栈

**后端**:
- FastAPI - API框架
- SQLAlchemy - ORM
- Azure OpenAI - AI能力
- jieba - 中文分词

**前端**:
- React + TypeScript
- Ant Design
- React Query
- Intersection Observer

---

## ✅ Checklist

### 准备工作
- [ ] 设计文档审查
- [ ] 技术栈确认
- [ ] 依赖安装

### 开发阶段
- [ ] 数据库设计
- [ ] 后端API开发
- [ ] 前端组件开发
- [ ] AI集成

### 测试和部署
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 上线部署

---

**下一步**: 开始实现数据库模型和行为日志系统 →
