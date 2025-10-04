# TechPulse 翻译文件生成计划

## 当前状态
- ✅ Login (完整)
- ✅ Overview (完整)
- ✅ Sidebar (完整)
- ✅ Nav (完整)
- ⚠️ Dashboard (使用中但未定义)
- ⚠️ GitHub (使用中但未定义)
- ⚠️ ArXiv (使用中但未定义)
- ⚠️ HuggingFace (使用中但未定义)
- ⚠️ Zenn (使用中但未定义)
- ⚠️ DataSources (使用中但未定义)
- ⚠️ Chat (使用中但未定义)
- ⚠️ Analytics (使用中但未定义)
- ⚠️ ApiConfig (使用中但未定义)
- ❌ Trends (完全未使用翻译系统)

## 需要添加的翻译类别

由于翻译键数量非常多（超过500个），建议采用以下策略：

### 方案A: 批量自动生成（推荐）
创建一个 Python 脚本自动生成所有翻译键的 TypeScript 定义和值

### 方案B: 手动逐步添加
按优先级逐个添加翻译类别

## 推荐执行步骤

1. 先添加最常用的5个页面的翻译（Dashboard, GitHub, ArXiv, HuggingFace, Zenn）
2. 然后添加 DataSources, Chat, Analytics
3. 最后处理 Trends（需要完全重构）

## 估计工作量
- 每个页面平均 20-30 个翻译键
- 每个键需要中/英/日 三种翻译
- 总计约 600-800 个翻译值需要添加
