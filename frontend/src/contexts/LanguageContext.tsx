import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// 支持的语言
export type Language = 'zh' | 'ja'

// 语言配置
export const languages = {
  zh: {
    code: 'zh',
    name: '中文',
    flag: '🇨🇳'
  },
  ja: {
    code: 'ja', 
    name: '日本語',
    flag: '🇯🇵'
  }
} as const

// 多语言文本定义
export const translations = {
  zh: {
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
    'overview.viewDetails': '查看详情',
    'overview.tagCloud': '标签云',
    'overview.viewAll': '查看全部',
    'overview.noTagData': '暂无标签数据',
    'overview.loading': '加载中...',
    'overview.count': '条',
    'overview.unit': '个',

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
    'chat.title': '📄 标题：',
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
    'github.title': 'GitHub リポジトリ管理',
    'github.subtitle': 'オープンソースプロジェクトとトレンドリポジトリを管理',
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
  },
  ja: {
    // App.tsx
    'app.title': 'TechPulse',
    'app.subtitle': 'テクノロジー情報ダッシュボード',
    'app.description': 'リアルタイムでテック動向を把握',
    'app.copyright': 'TechPulse ©2025',

    // 導航パンくずリスト
    'nav.home': 'ホーム',
    'nav.dashboard': 'データ概要',
    'nav.trending': '本日のトレンド',
    'nav.dataSources': 'データソース',
    'nav.github': 'GitHub',
    'nav.arxiv': 'arXiv',
    'nav.huggingface': 'Hugging Face',
    'nav.zenn': 'Zenn',
    'nav.analytics': 'インテリジェント分析',
    'nav.dataAnalysis': 'データ分析',
    'nav.aiAssistant': 'AI アシスタント',
    'nav.smartSearch': 'スマート検索',
    'nav.trendAnalysis': 'トレンド分析',
    'nav.tagCloud': 'タグクラウド',
    'nav.systemManagement': 'システム管理',
    'nav.notionIntegration': 'Notion 連携',
    'nav.apiConfig': 'API 設定',
    'nav.taskManagement': 'タスク管理',
    'nav.systemStatus': 'システム状態',

    // Sidebar
    'sidebar.homeDashboard': 'ホームダッシュボード',
    'sidebar.dataSourceManagement': 'データソース管理',
    'sidebar.intelligentAnalysis': 'インテリジェント分析',
    'sidebar.systemManagement': 'システム管理',

    // Overview
    'overview.title': '🏠 テクノロジー情報概要',
    'overview.subtitle': '最新の技術動向とトレンドをリアルタイムで把握',
    'overview.totalData': '総データ量',
    'overview.todayNew': '本日の新規',
    'overview.hotProjects': '人気プロジェクト',
    'overview.dataSources': 'データソース',
    'overview.dataSourceDistribution': '📊 データソース分散',
    'overview.hotTags': '🔥 人気タグ',
    'overview.latestContent': '⏰ 最新コンテンツ',
    'overview.hotProjectsRank': '🌟 人気プロジェクト',
    'overview.viewDetails': '詳細を表示',
    'overview.tagCloud': 'タグクラウド',
    'overview.viewAll': '全て表示',
    'overview.noTagData': 'タグデータがありません',
    'overview.loading': '読み込み中...',
    'overview.count': '件',
    'overview.unit': '個',

    // Dashboard
    'dashboard.title': '🚀 TechPulse テクノロジー情報ダッシュボード',
    'dashboard.selectLanguage': '言語を選択',
    'dashboard.aiService': 'AIサービス',
    'dashboard.connected': '接続済み',
    'dashboard.notConfigured': '未設定',
    'dashboard.searchPlaceholder': 'プロジェクト、技術スタック、タグを検索...',
    'dashboard.refresh': '更新',
    'dashboard.collectNewData': '新しいデータを収集',
    'dashboard.error': 'エラー',
    'dashboard.noData': 'データがありません',
    'dashboard.noDataDescription1': '「新しいデータを収集」ボタンをクリックしてテクノロジー情報の収集を開始',
    'dashboard.noDataDescription2': '一致するコンテンツが見つかりません。検索条件を調整してみてください',
    'dashboard.all': '全て',
    'dashboard.details': '詳細',
    'dashboard.original': '元文',
    'dashboard.translate': '翻訳',
    'dashboard.aiCategory': 'AI分類',
    'dashboard.techStack': '技術スタック',
    'dashboard.tags': 'タグ',
    'dashboard.close': '閉じる',
    'dashboard.viewOriginal': '元文を表示',
    'dashboard.saveToNotion': 'Notionに保存',
    'dashboard.projectSummary': '📝 プロジェクト概要',
    'dashboard.aiClassification': '🤖 AI分類',
    'dashboard.technologyStack': '⚙️ 技術スタック',
    'dashboard.projectTags': '🏷️ タグ',
    'dashboard.trialSuggestion': '💡 試用推奨',
    'dashboard.createTime': '作成日時',

    // Analytics
    'analytics.title': '📊 技術トレンド分析',
    'analytics.subtitle': 'リアルタイム技術情報データ分析と可視化',
    'analytics.last7Days': '直近7日間',
    'analytics.last14Days': '直近14日間',
    'analytics.last30Days': '直近30日間',
    'analytics.refreshData': 'データを更新',
    'analytics.totalProjects': '総プロジェクト数',
    'analytics.hotTech': '人気技術',
    'analytics.mainSource': '主要ソース',
    'analytics.techTags': '技術タグ',
    'analytics.dataSourceDistribution': 'データソース分散',
    'analytics.dailyNewTrend': '日別新規トレンド',
    'analytics.techPopularityRanking': '技術人気ランキング',
    'analytics.techKeywordCloud': '技術キーワードクラウド',
    'analytics.hotProjectsRanking': '人気プロジェクトランキング',
    'analytics.loading': 'データ分析を読み込み中...',
    'analytics.noData': 'データがありません',
    'analytics.noDataDescription': '分析できるデータが見つかりません',
    'analytics.projects': 'プロジェクト',

    // Chat
    'chat.title': 'TechPulse AI アシスタント',
    'chat.subtitle': 'インテリジェントウェブページ分析と技術Q&A',
    'chat.currentPage': '現在分析中のウェブページ',
    'chat.clearChat': 'チャットをクリア',
    'chat.welcome': '👋 TechPulse AI アシスタントへようこそ！\n\n私にできること：\n• 📎 任意のウェブページリンクのコンテンツを分析\n• 💬 ウェブページの内容をベースにしたQ&A\n• 🔍 技術的な質問の解答\n\nウェブページリンクを入力して分析を開始するか、直接質問してください！',
    'chat.analysisComplete': '🔍 ウェブページ分析完了！クリックして詳細な分析結果を表示。',
    'chat.suggestions.techStack': 'このコンテンツの主要な技術スタックは何ですか？',
    'chat.suggestions.quickStart': 'このプロジェクトを素早く始めるにはどうすればいいですか？',
    'chat.suggestions.practicalValue': 'このコンテンツの実用的な価値はどうですか？',
    'chat.suggestions.attention': '注意すべき点はありますか？',
    'chat.aiThinking': 'AI が考えています...',
    'chat.suggestedQuestions': '💡 推奨質問：',
    'chat.inputPlaceholder': 'ウェブページリンクを入力して分析するか、技術的な質問をしてください...',
    'chat.send': '送信',
    'chat.hint': '💡 ヒント：URLを入力して自動分析、Shift+Enterで改行、Enterで送信',
    'chat.detailAnalysis': '詳細分析を表示',
    'chat.copySummary': '概要をコピー',
    'chat.detailAnalysisTitle': '詳細ウェブページ分析',
    'chat.copyAnalysis': '分析をコピー',
    'chat.title': '📄 タイトル：',
    'chat.link': '🔗 リンク：',
    'chat.contentType': '🏷️ コンテンツタイプ：',
    'chat.keyPoints': '🔍 キーポイント：',
    'chat.detailedAnalysis': '📊 詳細分析：',
    'chat.relatedTags': '🏷️ 関連タグ：',

    // DataSources
    'dataSources.title': '📊 データソース管理',
    'dataSources.updateAll': '全て更新',
    'dataSources.previewGithubTrending': 'GitHub Trendingプレビュー',
    'dataSources.updateByNeed': '必要に応じた更新の説明',
    'dataSources.updateDescription': '各データソースを個別に更新できるようになり、不要なリソースの無駄を避けられます。ニーズに応じて特定のデータソースを選択的に更新することを推奨します。',
    'dataSources.github.description': '最新のオープンソースプロジェクトとトレンドリポジトリを取得',
    'dataSources.arxiv.description': '最新の学術論文と研究成果を取得',
    'dataSources.huggingface.description': '最新のAIモデルとデータセットを取得',
    'dataSources.zenn.description': '日本の技術コミュニティの高品質な記事を取得',
    'dataSources.updating': '更新中',
    'dataSources.updated': '更新済み',
    'dataSources.updateFailed': '更新失敗',
    'dataSources.pendingUpdate': '更新待ち',
    'dataSources.update': '更新',
    'dataSources.totalData': '総データ',
    'dataSources.todayNew': '本日新規',
    'dataSources.lastUpdate': '前回更新',
    'dataSources.dataStatistics': '📈 データ統計概要',
    'dataSources.totalAmount': '総データ量',
    'dataSources.activeSources': 'アクティブデータソース',
    'dataSources.updateHistory': '⏱️ 更新履歴',
    'dataSources.noUpdateRecords': '更新記録がありません',
    'dataSources.previewTitle': '🔥 GitHub Trending プレビュー',
    'dataSources.close': '閉じる',
    'dataSources.saveData': 'これらのデータを保存',
    'dataSources.pythonProjects': 'Python プロジェクト',
    'dataSources.allLanguageProjects': '全言語プロジェクト',
    'dataSources.score': 'スコア',

    // GitHub页面
    'github.title': 'GitHub リポジトリ管理',
    'github.subtitle': 'オープンソースプロジェクトとトレンドリポジトリを管理',
    'github.totalRepos': '総リポジトリ数',
    'github.todayNew': '本日新規',
    'github.trendingRepos': 'トレンドリポジトリ',
    'github.topLanguage': '人気言語',
    'github.updateData': 'データを更新',
    'github.trendingPreview': 'Trending プレビュー',
    'github.searchPlaceholder': 'リポジトリ名、説明文で検索...',
    'github.languageFilter': '言語フィルタ',
    'github.allLanguages': '全言語',
    'github.all': '全て',
    'github.trending': 'トレンド',
    'github.popular': '人気',
    'github.recent': '最近',
    'github.repositories': 'GitHub リポジトリ',
    'github.updateHistory': '更新履歴',
    'github.languageStats': '言語統計',
    'github.noUpdateRecords': '更新記録がありません',

    // arXiv页面  
    'arxiv.title': 'arXiv 論文管理',
    'arxiv.subtitle': '最新の学術論文と研究成果を管理',
    'arxiv.totalPapers': '総論文数',
    'arxiv.todayNew': '本日新規',
    'arxiv.aiRelated': 'AI関連論文',
    'arxiv.mainCategory': '主要カテゴリ',
    'arxiv.updateData': 'データを更新',
    'arxiv.searchPlaceholder': '論文タイトル、概要、著者名で検索...',
    'arxiv.categoryFilter': 'カテゴリフィルタ',
    'arxiv.allCategories': '全カテゴリ',
    'arxiv.papers': 'arXiv 論文',
    'arxiv.categoryStats': 'カテゴリ統計',
    'arxiv.researchTrends': '研究トレンド',
    'arxiv.abstract': '概要',
    'arxiv.pdf': 'PDF',
    'arxiv.published': '公開',
    'arxiv.updated': '更新',

    // HuggingFace页面
    'huggingface.title': 'Hugging Face モデル管理', 
    'huggingface.subtitle': '最新のAIモデルとデータセットを管理',
    'huggingface.totalModels': '総モデル数',
    'huggingface.totalDatasets': 'データセット数',
    'huggingface.todayNew': '本日新規',
    'huggingface.popularTask': '人気タスク',
    'huggingface.updateData': 'データを更新',
    'huggingface.searchPlaceholder': 'モデル名、説明、作成者で検索...',
    'huggingface.taskFilter': 'タスクフィルタ',
    'huggingface.allTasks': '全タスク',
    'huggingface.models': 'Hugging Face モデル',
    'huggingface.taskDistribution': 'タスク分布',
    'huggingface.trends': 'トレンド',
    'huggingface.downloads': 'ダウンロード',
    'huggingface.likes': 'いいね',
    'huggingface.author': '作成者',
    'huggingface.created': '作成',

    // Zenn页面
    'zenn.title': 'Zenn 記事管理',
    'zenn.subtitle': '日本の技術コミュニティの高品質な記事を管理', 
    'zenn.totalArticles': '総記事数',
    'zenn.todayNew': '本日新規',
    'zenn.totalLikes': '総いいね数',
    'zenn.activeAuthors': 'アクティブ作成者',
    'zenn.updateData': 'データを更新',
    'zenn.searchPlaceholder': '記事タイトル、内容、作成者で検索...',
    'zenn.typeFilter': 'タイプフィルタ',
    'zenn.allTypes': '全タイプ',
    'zenn.article': '記事',
    'zenn.book': '本',
    'zenn.scrap': 'スクラップ',
    'zenn.articles': 'Zenn 記事',
    'zenn.popularAuthors': '人気作成者',
    'zenn.popularTags': '人気タグ',
    'zenn.readArticle': '記事を読む',
    'zenn.premium': '有料',
    'zenn.comments': 'コメント',

    // API配置页面
    'apiConfig.title': 'データソース API 設定',
    'apiConfig.subtitle': '各データソースの収集条件と詳細設定を管理',
    'apiConfig.reloadSettings': '設定を再読み込み',
    'apiConfig.saveSettings': '設定を保存',
    'apiConfig.schedule': 'スケジュール',

    // 共通
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.confirm': '確認',
    'common.cancel': 'キャンセル',
    'common.save': '保存',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.view': '表示',
    'common.close': '閉じる',
    'common.back': '戻る',
    'common.all': '全て',
    'common.popular': '人気',
    'common.recent': '最近',
    'common.trending': 'トレンド',
    'common.search': '検索',
    'common.filter': 'フィルタ',
    'common.update': '更新',
    'common.preview': 'プレビュー'
  }
} as const

// 语言上下文类型
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: keyof typeof translations.zh) => string
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // 从 localStorage 获取保存的语言设置，默认为中文
    const saved = localStorage.getItem('techpulse-language')
    return (saved as Language) || 'zh'
  })

  // 翻译函数
  const t = (key: keyof typeof translations.zh): string => {
    return translations[language][key] || key
  }

  // 保存语言设置到 localStorage
  useEffect(() => {
    localStorage.setItem('techpulse-language', language)
    // 设置 HTML lang 属性
    document.documentElement.lang = language
  }, [language])

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