import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 支持的语言（仅中文）
export type Language = 'zh'

// 语言配置（仅中文）
export const languages = {
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳'
  }
} as const

// 多语言文本定义
export const translations = {
    // App.tsx
    'app.title': 'TechPulse',
    'app.subtitle': '技术情报仪表盘',
    'app.description': '实时掌握技术动态',
    'app.copyright': 'TechPulse ©2025',

    // 导航面包屑
    'nav.home': '首页',
    'nav.dashboard': '数据概览',
    'nav.trending': '今日热门',
    'nav.dataSources': '数据源',
    'nav.github': 'GitHub',
    'nav.arxiv': 'arXiv',
    'nav.huggingface': 'Hugging Face',
    'nav.zenn': 'Zenn',
    'nav.analytics': '智能分析',
    'nav.dataAnalysis': '数据分析',
    'nav.aiAssistant': 'AI 智能助手',
    'nav.smartSearch': '智能搜索',
    'nav.trendAnalysis': '趋势分析',
    'nav.tagCloud': '标签云',
    'nav.systemManagement': '系统管理',
    'nav.notionIntegration': 'Notion 集成',
    'nav.apiConfig': 'API 配置',
    'nav.taskManagement': '任务管理',
    'nav.systemStatus': '系统状态',

    // Sidebar
    'sidebar.homeDashboard': '首页仪表盘',
    'sidebar.dataSourceManagement': '数据源管理',
    'sidebar.intelligentAnalysis': '智能分析',
    'sidebar.systemManagement': '系统管理',

    // Overview
    'overview.title': '🏠 技术情报概览',
    'overview.subtitle': '实时掌握最新的技术动态和趋势',
    'overview.totalData': '总数据量',
    'overview.todayNew': '今日新增',
    'overview.hotProjects': '热门项目',
    'overview.dataSources': '数据源',
    'overview.dataSourceDistribution': '📊 数据源分布',
    'overview.hotTags': '🔥 热门标签',
    'overview.latestContent': '⏰ 最新内容',
    'overview.hotProjectsRank': '🌟 热门项目',
    'overview.tagCloud': '标签云',
    'overview.viewAll': '查看全部',
    'overview.noTagData': '暂无标签数据',
    'overview.loading': '加载中...',
    'overview.count': '条',
    'overview.unit': '个',
    'overview.viewOriginal': '查看原文',
    'overview.summary': '项目摘要',
    'overview.noSummary': '暂无摘要信息',
    'overview.tags': '相关标签',
    'overview.source': '数据源',
    'overview.viewDetails': '查看详情',

    // Dashboard
    'dashboard.title': '🚀 TechPulse 技术情报仪表盘',
    'dashboard.selectLanguage': '选择语言',
    'dashboard.aiService': 'AI服务',
    'dashboard.connected': '已连接',
    'dashboard.notConfigured': '未配置',
    'dashboard.searchPlaceholder': '搜索项目、技术栈、标签...',
    'dashboard.refresh': '刷新',
    'dashboard.collectNewData': '收集新数据',
    'dashboard.error': '错误',
    'dashboard.noData': '暂无数据',
    'dashboard.noDataDescription1': '点击「收集新数据」按钮开始抓取技术情报',
    'dashboard.noDataDescription2': '没有找到匹配的内容，尝试调整搜索条件',
    'dashboard.all': '全部',
    'dashboard.details': '详情',
    'dashboard.original': '原文',
    'dashboard.translate': '翻译',
    'dashboard.aiCategory': 'AI分类',
    'dashboard.techStack': '技术栈',
    'dashboard.tags': '标签',
    'dashboard.close': '关闭',
    'dashboard.viewOriginal': '查看原文',
    'dashboard.saveToNotion': '保存到Notion',
    'dashboard.projectSummary': '📝 项目摘要',
    'dashboard.aiClassification': '🤖 AI分类',
    'dashboard.technologyStack': '⚙️ 技术栈',
    'dashboard.projectTags': '🏷️ 标签',
    'dashboard.trialSuggestion': '💡 试用建议',
    'dashboard.createTime': '创建时间',

    // Analytics  
    'analytics.title': '📊 技术趋势分析',
    'analytics.subtitle': '实时技术情报数据分析和可视化',
    'analytics.last7Days': '最近7天',
    'analytics.last14Days': '最近14天', 
    'analytics.last30Days': '最近30天',
    'analytics.refreshData': '刷新数据',
    'analytics.totalProjects': '总项目数',
    'analytics.hotTech': '热门技术',
    'analytics.mainSource': '主要来源',
    'analytics.techTags': '技术标签',
    'analytics.dataSourceDistribution': '数据源分布',
    'analytics.dailyNewTrend': '每日新增趋势',
    'analytics.techPopularityRanking': '技术热门度排行',
    'analytics.techKeywordCloud': '技术关键词云',
    'analytics.hotProjectsRanking': '热门项目排行',
    'analytics.loading': '正在加载数据分析...',
    'analytics.noData': '暂无数据',
    'analytics.noDataDescription': '没有找到可分析的数据',
    'analytics.projects': '项目',

    // Chat
    'chat.title': 'TechPulse AI 助手',
    'chat.subtitle': '智能网页分析和技术问答',
    'chat.currentPage': '当前分析的网页',
    'chat.clearChat': '清空聊天',
    'chat.welcome': '👋 欢迎使用 TechPulse AI 助手！\n\n我可以帮你：\n• 📎 分析任何网页链接的内容\n• 💬 基于网页内容进行问答\n• 🔍 解答技术问题\n\n请输入网页链接开始分析，或直接提问！',
    'chat.analysisComplete': '🔍 网页分析完成！点击查看详细分析结果。',
    'chat.suggestions.techStack': '这个内容的主要技术栈是什么？',
    'chat.suggestions.quickStart': '如何快速上手这个项目？',
    'chat.suggestions.practicalValue': '这个内容的实用价值如何？',
    'chat.suggestions.attention': '有什么需要注意的地方？',
    'chat.aiThinking': 'AI 正在思考...',
    'chat.suggestedQuestions': '💡 建议问题：',
    'chat.inputPlaceholder': '输入网页链接进行分析，或提出技术问题...',
    'chat.send': '发送',
    'chat.hint': '💡 提示：输入URL自动分析，Shift+Enter换行，Enter发送',
    'chat.detailAnalysis': '查看详细分析',
    'chat.copySummary': '复制摘要',
    'chat.detailAnalysisTitle': '详细网页分析',
    'chat.copyAnalysis': '复制分析',
    'chat.titleLabel': '📄 标题：',
    'chat.link': '🔗 链接：',
    'chat.contentType': '🏷️ 内容类型：',
    'chat.keyPoints': '🔍 关键要点：',
    'chat.detailedAnalysis': '📊 详细分析：',
    'chat.relatedTags': '🏷️ 相关标签：',

    // DataSources
    'dataSources.title': '📊 数据源管理',
    'dataSources.updateAll': '全部更新',
    'dataSources.previewGithubTrending': '预览GitHub Trending',
    'dataSources.updateByNeed': '按需更新说明',
    'dataSources.updateDescription': '现在可以单独更新每个数据源，避免不必要的资源浪费。建议根据需求选择性更新特定数据源。',
    'dataSources.github.description': '获取最新的开源项目和trending仓库',
    'dataSources.arxiv.description': '获取最新的学术论文和研究成果',
    'dataSources.huggingface.description': '获取最新的AI模型和数据集',
    'dataSources.zenn.description': '获取日本技术社区的优质文章',
    'dataSources.updating': '更新中',
    'dataSources.updated': '已更新',
    'dataSources.updateFailed': '更新失败',
    'dataSources.pendingUpdate': '待更新',
    'dataSources.update': '更新',
    'dataSources.totalData': '总数据',
    'dataSources.todayNew': '今日新增',
    'dataSources.lastUpdate': '上次更新',
    'dataSources.dataStatistics': '📈 数据统计总览',
    'dataSources.totalAmount': '总数据量',
    'dataSources.activeSources': '活跃数据源',
    'dataSources.updateHistory': '⏱️ 更新历史',
    'dataSources.noUpdateRecords': '暂无更新记录',
    'dataSources.previewTitle': '🔥 GitHub Trending 预览',
    'dataSources.close': '关闭',
    'dataSources.saveData': '保存这些数据',
    'dataSources.pythonProjects': 'Python 项目',
    'dataSources.allLanguageProjects': '全语言项目',
    'dataSources.score': '得分',

    // GitHub页面
    'github.title': 'GitHub 仓库管理',
    'github.subtitle': '开源项目和热门仓库管理',
    'github.totalRepos': '总仓库数',
    'github.todayNew': '本日新增',
    'github.trendingRepos': '热门仓库',
    'github.topLanguage': '主要语言',
    'github.updateData': '更新数据',
    'github.trendingPreview': '热门预览',
    'github.searchPlaceholder': '搜索仓库名、描述...',
    'github.languageFilter': '语言筛选',
    'github.allLanguages': '全部语言',
    'github.all': '全部',
    'github.trending': '热门',
    'github.popular': '流行',
    'github.recent': '最新',
    'github.repositories': 'GitHub 仓库',
    'github.updateHistory': '更新历史',
    'github.languageStats': '语言统计',
    'github.noUpdateRecords': '暂无更新记录',

    // arXiv页面  
    'arxiv.title': 'arXiv 论文管理',
    'arxiv.subtitle': '最新的学术论文和研究成果管理',
    'arxiv.totalPapers': '总论文数',
    'arxiv.todayNew': '本日新增',
    'arxiv.aiRelated': 'AI相关论文',
    'arxiv.mainCategory': '主要类别',
    'arxiv.updateData': '更新数据',
    'arxiv.searchPlaceholder': '搜索论文标题、摘要、作者...',
    'arxiv.categoryFilter': '类别筛选',
    'arxiv.allCategories': '全部类别',
    'arxiv.papers': 'arXiv 论文',
    'arxiv.categoryStats': '类别统计',
    'arxiv.researchTrends': '研究趋势',
    'arxiv.abstract': '摘要',
    'arxiv.pdf': 'PDF',
    'arxiv.published': '发布',
    'arxiv.updated': '更新',

    // HuggingFace页面
    'huggingface.title': 'Hugging Face 模型管理', 
    'huggingface.subtitle': '最新的AI模型和数据集管理',
    'huggingface.totalModels': '总模型数',
    'huggingface.totalDatasets': '数据集数',
    'huggingface.todayNew': '本日新增',
    'huggingface.popularTask': '热门任务',
    'huggingface.updateData': '更新数据',
    'huggingface.searchPlaceholder': '搜索模型名、描述、作者...',
    'huggingface.taskFilter': '任务筛选',
    'huggingface.allTasks': '全部任务',
    'huggingface.models': 'Hugging Face 模型',
    'huggingface.taskDistribution': '任务分布',
    'huggingface.trends': '趋势',
    'huggingface.downloads': '下载',
    'huggingface.likes': '点赞',
    'huggingface.author': '作者',
    'huggingface.created': '创建',

    // Zenn页面
    'zenn.title': 'Zenn 文章管理',
    'zenn.subtitle': '日本技术社区的高质量文章管理', 
    'zenn.totalArticles': '总文章数',
    'zenn.todayNew': '本日新增',
    'zenn.totalLikes': '总点赞数',
    'zenn.activeAuthors': '活跃作者',
    'zenn.updateData': '更新数据',
    'zenn.searchPlaceholder': '搜索文章标题、内容、作者...',
    'zenn.typeFilter': '类型筛选',
    'zenn.allTypes': '全部类型',
    'zenn.article': '文章',
    'zenn.book': '书籍',
    'zenn.scrap': '片段',
    'zenn.articles': 'Zenn 文章',
    'zenn.popularAuthors': '热门作者',
    'zenn.popularTags': '热门标签',
    'zenn.readArticle': '阅读文章',
    'zenn.premium': '付费',
    'zenn.comments': '评论',
    'zenn.likes': '点赞',

    // API配置页面
    'apiConfig.title': '数据源 API 设置',
    'apiConfig.subtitle': '管理各数据源的收集条件和详细设置',
    'apiConfig.reloadSettings': '重新加载设置',
    'apiConfig.saveSettings': '保存设置',
    'apiConfig.schedule': '调度',

    // 通用
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.confirm': '确认',
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.view': '查看',
    'common.close': '关闭',
    'common.back': '返回',
    'common.all': '全部',
    'common.popular': '热门',
    'common.recent': '最新',
    'common.trending': '趋势',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.update': '更新',
    'common.preview': '预览'
} as const

// 语言上下文类型
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: keyof typeof translations) => string
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 固定为中文
  const [language] = useState<Language>('zh')
  const setLanguage = () => {} // 空函数，保持接口兼容

  // 翻译函数
  const t = (key: keyof typeof translations): string => {
    return translations[key] || key
  }

  // 设置 HTML lang 属性为中文
  useEffect(() => {
    document.documentElement.lang = 'zh'
  }, [])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// 自定义 Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}