# TechPulse 功能路线图

> **版本**: v2.0
> **最后更新**: 2025-10-10
> **维护者**: TechPulse Team

---

## 📑 目录

1. [版本规划概览](#版本规划概览)
2. [P0 - 紧急重要（本周）](#p0---紧急重要本周)
3. [P1 - 高优先级（2周内）](#p1---高优先级2周内)
4. [P2 - 中优先级（3-4周）](#p2---中优先级3-4周)
5. [P3 - 低优先级（长期）](#p3---低优先级长期)
6. [功能详细设计](#功能详细设计)
7. [技术债务清单](#技术债务清单)

---

## 🎯 版本规划概览

### v0.2.0 (当前版本) ✅
**完成时间**: 2025-10-10
**主题**: AI配置管理 + Zenn修复

#### 已完成
- ✅ Azure OpenAI配置UI界面
- ✅ 数据库配置优先级系统
- ✅ AI配置测试功能
- ✅ Zenn API重写（从475行精简到213行）
- ✅ Zenn数据采集修复（1052篇文章）
- ✅ 文档整理（22→13个文件）
- ✅ 翻译文件补全（Zenn标签中文化）

---

### v0.3.0 (计划中) 🎯
**预计时间**: 2周（2025-10-11 ~ 2025-10-24）
**主题**: 智能搜索 + 个性化推荐

#### 核心功能
1. **智能搜索栏** (P1)
   - 支持关键词搜索
   - 支持AI问答
   - 意图识别（查询/分析）

2. **基于标签的推荐** (P1)
   - 根据用户偏好筛选
   - "为你推荐"模块
   - 推荐理由显示

3. **用户行为日志** (P1)
   - 点击/收藏/搜索记录
   - 为协同过滤做准备

---

### v0.4.0 (规划中) 🔮
**预计时间**: 3-4周（2025-10-25 ~ 2025-11-21）
**主题**: RAG问答系统 + 高级推荐

#### 核心功能
1. **RAG问答系统** (P2)
   - Qdrant向量数据库
   - BGE Embedding模型
   - 深度问答支持

2. **协同过滤推荐** (P2)
   - 基于用户行为的推荐
   - 相似用户发现
   - 推荐精度优化

3. **新数据源** (P2)
   - HuggingFace Daily Papers
   - Papers with Code（可选）

---

### v1.0.0 (长期目标) 🚀
**预计时间**: 2-3个月
**主题**: 商业化功能 + 企业级特性

#### 核心功能
- 订阅推送系统
- PDF报告导出
- Notion/飞书集成
- 团队协作功能
- API开放平台

---

## 🔥 P0 - 紧急重要（本周）

> **截止日期**: 2025-10-13
> **预计总工时**: 12小时

### 1. 数据质量优化 🎯
**状态**: ⏳ 待开始
**预计时间**: 4小时
**负责人**: 待分配

#### 需求描述
当前质量评分系统已实现，但需要优化评分算法，提高区分度。

#### 具体任务
- [ ] 分析当前评分分布（统计0-10分的分布）
- [ ] 调整GitHub评分权重（考虑fork率、issue活跃度）
- [ ] 调整arXiv评分权重（考虑作者影响力）
- [ ] 调整HuggingFace评分权重（下载增速）
- [ ] 调整Zenn评分权重（评论/点赞比）
- [ ] 重新评分所有历史数据
- [ ] 验证评分效果（高质量内容是否准确）

#### 技术方案
```python
# backend/app/services/quality_scorer.py
class EnhancedQualityScorer:
    def score_github(self, repo):
        score = 0
        # 基础分：Star数（最高5分）
        score += min(math.log10(repo.stars + 1), 5)

        # 活跃度分：最近30天commit（最高2分）
        score += min(repo.recent_commits / 50, 2)

        # 社区分：fork率和issue活跃度（最高2分）
        fork_rate = repo.forks / max(repo.stars, 1)
        score += min(fork_rate * 10, 1)
        score += min(repo.open_issues / 100, 1)

        # 增速分：Star增长率（最高1分）
        score += min(repo.star_growth_rate * 100, 1)

        return round(score, 1)
```

#### 验收标准
- ✅ 高质量内容（评分≥7.0）占比在15-25%之间
- ✅ 低质量内容（评分<5.0）占比在20-30%之间
- ✅ 手动抽查10条高分内容，至少8条确实是高质量

---

### 2. 数据源稳定性监控 🛡️
**状态**: ⏳ 待开始
**预计时间**: 3小时
**负责人**: 待分配

#### 需求描述
增加数据源健康监控和告警机制，确保数据采集稳定。

#### 具体任务
- [ ] 创建数据源健康检查API
- [ ] 记录每次采集的成功/失败状态
- [ ] 添加采集统计页面（成功率、平均耗时）
- [ ] 采集失败时发送告警（日志）
- [ ] 添加手动重试采集功能

#### 技术方案
```python
# backend/app/models/data_source_health.py
class DataSourceHealth(Base):
    __tablename__ = "data_source_health"

    id = Column(Integer, primary_key=True)
    source_name = Column(String(50))  # github, arxiv, etc.
    check_time = Column(DateTime, default=datetime.now)
    status = Column(String(20))  # success, failed, timeout
    items_collected = Column(Integer, default=0)
    error_message = Column(Text)
    duration_seconds = Column(Float)
```

#### 验收标准
- ✅ 系统状态页面显示数据源健康状态
- ✅ 采集失败时记录详细错误信息
- ✅ 手动触发重试可以正常工作

---

### 3. 前端性能优化 ⚡
**状态**: ⏳ 待开始
**预计时间**: 3小时
**负责人**: 待分配

#### 需求描述
Dashboard加载速度较慢，需要优化首屏加载时间。

#### 具体任务
- [ ] 实现分页加载（当前一次加载50条）
- [ ] 添加骨架屏加载状态
- [ ] 优化图片懒加载
- [ ] 减少不必要的API调用
- [ ] 添加数据缓存（React Query或SWR）

#### 技术方案
```tsx
// 使用React Query优化数据获取
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['cards', activeTab, page],
  queryFn: () => fetchCards(activeTab, page),
  staleTime: 5 * 60 * 1000,  // 5分钟内使用缓存
  cacheTime: 10 * 60 * 1000  // 缓存保留10分钟
})
```

#### 验收标准
- ✅ 首屏加载时间 < 2秒（在3G网络下）
- ✅ 滚动加载流畅，无明显卡顿
- ✅ 切换Tab时优先显示缓存数据

---

### 4. 移动端适配优化 📱
**状态**: ⏳ 待开始
**预计时间**: 2小时
**负责人**: 待分配

#### 需求描述
当前移动端布局有些问题，需要优化响应式设计。

#### 具体任务
- [ ] 检查所有页面在移动端的显示效果
- [ ] 优化Dashboard两栏布局（移动端单栏）
- [ ] 优化数据源页面卡片布局
- [ ] 优化统计卡片在小屏幕的显示
- [ ] 测试横屏和竖屏切换

#### 验收标准
- ✅ 在iPhone SE（375px）上正常显示
- ✅ 在iPad（768px）上正常显示
- ✅ 横竖屏切换无布局错乱

---

## ⭐ P1 - 高优先级（2周内）

> **截止日期**: 2025-10-24
> **预计总工时**: 30小时

### 5. 智能搜索栏 + AI问答 🔍
**状态**: ⏳ 待开始
**预计时间**: 8小时
**负责人**: 待分配

#### 需求描述
在顶部搜索栏支持关键词搜索和AI问答，解决用户快速查找信息的需求。

#### 具体任务
- [ ] 设计搜索栏UI（支持切换搜索/问答模式）
- [ ] 实现关键词搜索（标题、标签、摘要）
- [ ] 实现意图识别（查询类 vs 分析类）
- [ ] 查询类问题直接查数据库（无需LLM）
- [ ] 分析类问题使用LLM总结
- [ ] 添加搜索历史记录
- [ ] 添加热门搜索词推荐

#### 技术方案
```python
# backend/app/services/search_engine.py
class SearchEngine:
    def detect_intent(self, query: str) -> str:
        """识别用户意图"""
        query_keywords = ["有哪些", "列出", "显示", "查找", "最新"]
        analysis_keywords = ["为什么", "如何", "趋势", "对比", "分析"]

        if any(kw in query for kw in query_keywords):
            return "query"  # 查询类
        elif any(kw in query for kw in analysis_keywords):
            return "analysis"  # 分析类
        else:
            return "search"  # 关键词搜索

    def search(self, query: str, intent: str):
        if intent == "query":
            return self.query_database(query)
        elif intent == "analysis":
            return self.rag_analysis(query)
        else:
            return self.keyword_search(query)
```

#### UI设计
```
┌────────────────────────────────────────┐
│ 🔍 搜索关键词，或问问TechPulse...       │
│                                [问答模式]│
│ 💡 试试问：                             │
│ • 今天LLM有什么新突破？                 │
│ • 推荐一些AI Agent框架                  │
│ • 什么是LoRA量化技术？                  │
└────────────────────────────────────────┘
```

#### 验收标准
- ✅ 支持中文关键词搜索
- ✅ 查询类问题（如"今天有什么新项目"）响应时间<500ms
- ✅ 分析类问题（如"LLM发展趋势"）响应时间<5s
- ✅ 搜索结果高亮显示匹配关键词

---

### 6. 基于标签的智能推荐 🎯
**状态**: ⏳ 待开始
**预计时间**: 6小时
**负责人**: 待分配

#### 需求描述
根据用户在兴趣问卷中选择的标签，智能推荐相关内容。

#### 具体任务
- [ ] 设计推荐算法（标签匹配 + 质量评分）
- [ ] 创建推荐API（GET /api/v1/recommendations）
- [ ] 前端添加"为你推荐"模块
- [ ] 显示推荐理由（"基于你关注的：LLM"）
- [ ] 添加"不感兴趣"反馈按钮
- [ ] 记录推荐点击率

#### 技术方案
```python
# backend/app/services/recommender.py
class TagBasedRecommender:
    def recommend(self, user_preferences: dict, limit: int = 10):
        """基于标签的推荐"""
        interested_domains = user_preferences.get('domains', [])
        interested_types = user_preferences.get('types', [])

        # 标签映射
        domain_tags = {
            'llm': ['大语言模型', 'LLM', 'GPT', 'transformer'],
            'cv': ['计算机视觉', 'CV', 'YOLO', 'detection'],
            'rl': ['强化学习', 'RL', 'RLHF'],
            # ...
        }

        # 构建用户兴趣标签集合
        user_tags = set()
        for domain in interested_domains:
            user_tags.update(domain_tags.get(domain, []))

        # 查询匹配的高质量内容
        cards = db.query(TechCard).filter(
            TechCard.quality_score >= 6.0,
            TechCard.created_at >= datetime.now() - timedelta(days=7)
        ).all()

        # 计算匹配度
        scored_cards = []
        for card in cards:
            card_tags = set(card.chinese_tags or [])
            match_score = len(user_tags & card_tags) / len(user_tags)

            if match_score > 0:
                total_score = match_score * 0.6 + (card.quality_score / 10) * 0.4
                scored_cards.append((card, total_score, list(user_tags & card_tags)))

        # 按总分排序
        scored_cards.sort(key=lambda x: x[1], reverse=True)

        return scored_cards[:limit]
```

#### 验收标准
- ✅ 推荐内容与用户兴趣高度相关（手动验证）
- ✅ 推荐理由清晰显示
- ✅ 每日更新推荐内容
- ✅ 推荐点击率>15%

---

### 7. 用户行为日志系统 📊
**状态**: ⏳ 待开始
**预计时间**: 4小时
**负责人**: 待分配

#### 需求描述
记录用户的点击、收藏、搜索等行为，为后续协同过滤推荐做准备。

#### 具体任务
- [ ] 创建用户行为日志表
- [ ] 前端埋点（点击卡片、收藏、搜索）
- [ ] 后端API（POST /api/v1/logs/action）
- [ ] 行为数据分析页面（管理员用）
- [ ] 定期清理旧日志（保留90天）

#### 数据库设计
```python
class UserAction(Base):
    __tablename__ = "user_actions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    action_type = Column(String(50))  # click, bookmark, search, share
    target_type = Column(String(50))  # card, tag, search_query
    target_id = Column(Integer, nullable=True)  # 卡片ID或None
    metadata = Column(JSON)  # 额外信息（搜索词、来源页面等）
    created_at = Column(DateTime, default=datetime.now)
```

#### 埋点示例
```tsx
// 前端卡片点击埋点
const handleCardClick = (card: TechCard) => {
  // 记录行为
  logAction({
    action_type: 'click',
    target_type: 'card',
    target_id: card.id,
    metadata: {
      source: card.source,
      quality_score: card.quality_score,
      page: 'dashboard'
    }
  })

  // 打开详情
  showDetail(card)
}
```

#### 验收标准
- ✅ 所有关键行为都有埋点
- ✅ 日志记录不影响用户体验（异步）
- ✅ 可以查询用户的行为历史

---

### 8. 标签云交互优化 🏷️
**状态**: ⏳ 待开始
**预计时间**: 2小时
**负责人**: 待分配

#### 需求描述
优化热门标签云的交互，点击标签可以过滤内容。

#### 具体任务
- [ ] 标签点击后触发搜索
- [ ] 添加标签hover效果
- [ ] 支持多标签组合过滤（AND逻辑）
- [ ] 显示当前已选标签
- [ ] 一键清除所有标签筛选

#### 验收标准
- ✅ 点击标签立即过滤内容
- ✅ 多标签组合过滤正常工作
- ✅ 交互流畅，无延迟

---

### 9. 内容分享功能 📤
**状态**: ⏳ 待开始
**预计时间**: 3小时
**负责人**: 待分配

#### 需求描述
允许用户分享感兴趣的内容到社交媒体或通过链接分享。

#### 具体任务
- [ ] 卡片详情页添加分享按钮
- [ ] 生成分享链接（带参数）
- [ ] 支持分享到Twitter、LinkedIn
- [ ] 支持复制链接
- [ ] 记录分享次数（统计）

#### UI设计
```
┌─────────────────────────────┐
│ 分享此内容                   │
├─────────────────────────────┤
│ 🐦 Twitter                  │
│ 💼 LinkedIn                 │
│ 🔗 复制链接                  │
└─────────────────────────────┘
```

#### 验收标准
- ✅ 分享链接可正常打开并定位到对应内容
- ✅ 社交媒体预览图正常显示
- ✅ 记录分享次数

---

### 10. 批量操作功能 ✅
**状态**: ⏳ 待开始
**预计时间**: 3小时
**负责人**: 待分配

#### 需求描述
支持批量收藏、导出、标记等操作。

#### 具体任务
- [ ] 添加多选模式
- [ ] 批量收藏到Notion
- [ ] 批量导出为Markdown
- [ ] 批量标记为已读
- [ ] 批量删除（管理员）

#### 验收标准
- ✅ 可以选择多个卡片
- ✅ 批量操作正常工作
- ✅ 操作有确认提示

---

### 11. 数据导出功能 💾
**状态**: ⏳ 待开始
**预计时间**: 4小时
**负责人**: 待分配

#### 需求描述
允许用户导出收藏的内容为多种格式。

#### 具体任务
- [ ] 导出为Markdown格式
- [ ] 导出为JSON格式
- [ ] 导出为CSV格式（Excel可读）
- [ ] 支持按日期范围导出
- [ ] 支持按数据源导出

#### 技术方案
```python
# backend/app/services/exporter.py
class ContentExporter:
    def export_markdown(self, cards: List[TechCard]) -> str:
        md = "# TechPulse 导出\n\n"
        md += f"导出时间: {datetime.now()}\n"
        md += f"总数: {len(cards)}\n\n"

        for card in cards:
            md += f"## {card.title}\n\n"
            md += f"**来源**: {card.source}\n"
            md += f"**质量评分**: {card.quality_score}/10\n"
            md += f"**链接**: {card.original_url}\n\n"
            md += f"{card.summary}\n\n"
            if card.chinese_tags:
                md += f"**标签**: {', '.join(card.chinese_tags)}\n\n"
            md += "---\n\n"

        return md
```

#### 验收标准
- ✅ 导出的文件格式正确
- ✅ 导出速度快（1000条<3秒）
- ✅ 支持大文件下载

---

## 🔮 P2 - 中优先级（3-4周）

> **截止日期**: 2025-11-21
> **预计总工时**: 40小时

### 12. RAG问答系统 🧠
**状态**: ⏳ 待开始
**预计时间**: 12小时
**负责人**: 待分配

#### 需求描述
集成向量数据库和RAG系统，支持深度问答。

#### 具体任务
- [ ] 集成Qdrant向量数据库
- [ ] 集成BGE Embedding模型
- [ ] 为所有内容生成向量
- [ ] 实现语义检索
- [ ] 实现RAG问答流程
- [ ] 添加引用来源显示

#### 技术栈
```yaml
向量数据库: Qdrant (Docker部署)
Embedding模型: bge-large-zh-v1.5
Reranker: bge-reranker-large
LLM: 使用现有Azure OpenAI配置
```

#### 架构设计
```
用户提问
   ↓
意图识别 → [查询类] → 数据库查询
   ↓
[分析类]
   ↓
语义检索 (Qdrant)
   ↓
相关性重排 (Reranker)
   ↓
提取Top 5相关内容
   ↓
LLM总结 (带引用来源)
   ↓
返回答案 + 引用卡片
```

#### 验收标准
- ✅ 支持深度问答（如"为什么LoRA突然火了？"）
- ✅ 答案质量高（准确率>85%）
- ✅ 显示引用来源
- ✅ 响应时间<5秒

---

### 13. 协同过滤推荐算法 🤝
**状态**: ⏳ 待开始
**预计时间**: 10小时
**负责人**: 待分配

#### 需求描述
基于用户行为数据，实现协同过滤推荐，提升推荐精度。

#### 具体任务
- [ ] 收集用户行为矩阵
- [ ] 计算用户相似度
- [ ] 计算物品相似度
- [ ] 实现User-based CF
- [ ] 实现Item-based CF
- [ ] 混合推荐策略
- [ ] A/B测试框架

#### 技术方案
```python
# backend/app/services/collaborative_filter.py
class CollaborativeFilter:
    def recommend_user_based(self, user_id: int, k: int = 10):
        """基于用户的协同过滤"""
        # 1. 找到相似用户（基于行为相似度）
        similar_users = self.find_similar_users(user_id, top_k=20)

        # 2. 收集相似用户喜欢的内容
        recommendations = []
        for similar_user, similarity in similar_users:
            liked_cards = self.get_user_liked_cards(similar_user)
            for card in liked_cards:
                if not self.user_has_seen(user_id, card.id):
                    score = similarity * card.quality_score
                    recommendations.append((card, score))

        # 3. 按分数排序
        recommendations.sort(key=lambda x: x[1], reverse=True)
        return recommendations[:k]

    def find_similar_users(self, user_id: int, top_k: int = 20):
        """找到相似用户（余弦相似度）"""
        # 获取用户-物品交互矩阵
        user_actions = db.query(UserAction).all()

        # 构建稀疏矩阵
        user_item_matrix = self.build_matrix(user_actions)

        # 计算余弦相似度
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(user_item_matrix)

        # 返回最相似的K个用户
        user_idx = self.get_user_index(user_id)
        similar_indices = similarities[user_idx].argsort()[-top_k-1:-1][::-1]

        return [(idx, similarities[user_idx][idx]) for idx in similar_indices]
```

#### 验收标准
- ✅ 推荐精度提升30%（相比基于标签的推荐）
- ✅ 冷启动用户仍有合理推荐
- ✅ 推荐多样性（避免只推荐相似内容）

---

### 14. 新增数据源：HuggingFace Daily Papers 📚
**状态**: ⏳ 待开始
**预计时间**: 6小时
**负责人**: 待分配

#### 需求描述
集成HuggingFace Daily Papers，每天自动抓取精选论文。

#### 具体任务
- [ ] 调研HuggingFace Papers API
- [ ] 实现采集器
- [ ] 添加质量评分
- [ ] 前端添加Daily Papers页面
- [ ] 添加到定时任务

#### API文档
```python
# HuggingFace Daily Papers API
# https://huggingface.co/api/daily_papers

async def fetch_daily_papers():
    url = "https://huggingface.co/api/daily_papers"
    response = await client.get(url)
    papers = response.json()

    for paper in papers:
        # paper['title']
        # paper['arxiv_id']
        # paper['upvotes']
        # paper['authors']
        # paper['summary']
        pass
```

#### 验收标准
- ✅ 每天自动采集Daily Papers
- ✅ 数据质量高（精选论文）
- ✅ 前端页面展示美观

---

### 15. 批量摘要生成优化 💡
**状态**: ⏳ 待开始
**预计时间**: 4小时
**负责人**: 待分配

#### 需求描述
优化AI摘要生成，降低成本，提升效率。

#### 具体任务
- [ ] 实现批量摘要生成（一次处理10条）
- [ ] 添加摘要缓存机制
- [ ] 只为高质量内容生成摘要（评分≥6.0）
- [ ] 添加摘要质量评估
- [ ] 凌晨定时批量生成

#### 成本对比
```
方案A：逐条生成
100条/天 × 300 tokens = 30K tokens/天
月成本: ~$2 (GPT-4o-mini)

方案B：批量生成
100条/天 ÷ 10条/批 × 500 tokens = 5K tokens/天
月成本: ~$0.3 (降低85%)
```

#### 验收标准
- ✅ AI成本降低80%以上
- ✅ 摘要质量不下降
- ✅ 处理速度提升3倍

---

### 16. 内容聚类和主题发现 🧩
**状态**: ⏳ 待开始
**预计时间**: 8小时
**负责人**: 待分配

#### 需求描述
自动将每日内容聚类，发现热门主题。

#### 具体任务
- [ ] 实现K-means聚类
- [ ] 自动发现主题关键词
- [ ] 生成"今日热点"模块
- [ ] 添加主题趋势分析
- [ ] 主题订阅功能

#### 技术方案
```python
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer

class TopicDiscovery:
    def discover_topics(self, cards: List[TechCard], n_clusters: int = 5):
        # 1. 提取文本特征
        texts = [f"{card.title} {card.summary}" for card in cards]
        vectorizer = TfidfVectorizer(max_features=100)
        features = vectorizer.fit_transform(texts)

        # 2. K-means聚类
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        clusters = kmeans.fit_predict(features)

        # 3. 提取每个主题的关键词
        topics = []
        for i in range(n_clusters):
            cluster_cards = [cards[j] for j in range(len(cards)) if clusters[j] == i]
            keywords = self.extract_keywords(cluster_cards)
            topics.append({
                'id': i,
                'keywords': keywords,
                'cards': cluster_cards,
                'count': len(cluster_cards)
            })

        return topics
```

#### 验收标准
- ✅ 主题划分合理（手动验证）
- ✅ 关键词准确（覆盖主题核心内容）
- ✅ 每日自动更新

---

## 🌟 P3 - 低优先级（长期）

> **时间规划**: 2-3个月
> **预计总工时**: 50小时

### 17. 订阅推送系统 📧
**预计时间**: 8小时

#### 功能点
- [ ] 邮件订阅功能
- [ ] 每日简报推送
- [ ] 主题订阅（只推送感兴趣的）
- [ ] 推送时间自定义
- [ ] 推送频率控制

---

### 18. PDF报告导出 📄
**预计时间**: 6小时

#### 功能点
- [ ] 生成精美PDF报告
- [ ] 包含图表和统计
- [ ] 自定义封面
- [ ] 按日/周/月生成
- [ ] 自动发送到邮箱

---

### 19. Notion/飞书集成 🔗
**预计时间**: 10小时

#### 功能点
- [ ] Notion双向同步
- [ ] 飞书多维表格集成
- [ ] 自动保存到知识库
- [ ] 标签同步
- [ ] Webhook通知

---

### 20. 团队协作功能 👥
**预计时间**: 12小时

#### 功能点
- [ ] 团队空间
- [ ] 内容共享
- [ ] 协作标注
- [ ] 团队统计
- [ ] 权限管理

---

### 21. 新数据源：Papers with Code 📊
**预计时间**: 8小时

#### 功能点
- [ ] 论文+代码采集
- [ ] Benchmark排行榜
- [ ] 任务分类
- [ ] 代码质量评分
- [ ] 前端展示页面

---

### 22. API开放平台 🔌
**预计时间**: 6小时

#### 功能点
- [ ] API Key管理
- [ ] 调用限流
- [ ] API文档（Swagger）
- [ ] Webhook回调
- [ ] 使用统计

---

## 📐 功能详细设计

### 智能搜索栏详细设计

#### 1. UI交互流程
```
用户输入 → 实时建议
           ↓
        回车/点击
           ↓
      意图识别
     /         \
[关键词]      [问答]
    ↓            ↓
 搜索结果    AI回答
    ↓            ↓
  列表展示   答案+引用
```

#### 2. 意图识别规则
```python
QUERY_PATTERNS = [
    r'有哪些.*',
    r'列出.*',
    r'显示.*',
    r'查找.*',
    r'.*的项目',
]

ANALYSIS_PATTERNS = [
    r'为什么.*',
    r'如何.*',
    r'.*趋势',
    r'.*区别',
    r'.*原理',
]
```

#### 3. 搜索建议算法
```python
def get_suggestions(query: str) -> List[str]:
    suggestions = []

    # 1. 历史搜索匹配
    history = get_user_search_history(current_user)
    suggestions.extend([h for h in history if query in h])

    # 2. 热门标签匹配
    tags = get_popular_tags()
    suggestions.extend([t for t in tags if query in t])

    # 3. 热门搜索匹配
    popular = get_popular_searches()
    suggestions.extend([p for p in popular if query in p])

    return suggestions[:5]
```

---

### 推荐系统详细设计

#### 1. 推荐算法混合策略
```
最终推荐 = 标签推荐(40%) + 协同过滤(30%) + 热度推荐(20%) + 随机探索(10%)
```

#### 2. 推荐理由生成
```python
def generate_reason(card: TechCard, user: User) -> str:
    reasons = []

    # 标签匹配
    matched_tags = set(card.chinese_tags) & set(user.interest_tags)
    if matched_tags:
        reasons.append(f"基于你关注的: {', '.join(list(matched_tags)[:2])}")

    # 相似用户
    if card in similar_users_liked:
        reasons.append("相似用户也喜欢")

    # 高质量
    if card.quality_score >= 8.0:
        reasons.append("高质量内容")

    # 热门
    if card.star_growth_rate > 0.1:
        reasons.append("正在快速增长")

    return " · ".join(reasons)
```

---

## 🛠️ 技术债务清单

### 高优先级技术债
1. **数据库性能优化**
   - 添加索引（source, quality_score, created_at）
   - 查询优化（避免N+1问题）
   - 分页优化

2. **代码质量提升**
   - 添加单元测试（覆盖率目标80%）
   - 添加集成测试
   - 代码lint和格式化

3. **错误处理完善**
   - 统一错误码
   - 错误日志记录
   - 用户友好的错误提示

### 中优先级技术债
4. **API文档完善**
   - OpenAPI/Swagger文档
   - 请求/响应示例
   - 错误码说明

5. **安全性加固**
   - CSRF保护
   - SQL注入防护
   - XSS防护
   - Rate limiting

6. **监控和日志**
   - 应用性能监控（APM）
   - 错误追踪（Sentry）
   - 访问日志分析

---

## 📝 版本发布检查清单

### 发布前检查
- [ ] 所有测试通过
- [ ] 代码review完成
- [ ] 文档更新完成
- [ ] 数据库迁移脚本准备
- [ ] 回滚方案准备

### 发布步骤
1. 合并到main分支
2. 打tag（v0.x.x）
3. 运行数据库迁移
4. 部署后端服务
5. 部署前端服务
6. 烟雾测试
7. 发布公告

---

**最后更新**: 2025-10-10
**下次评审**: 2025-10-17
