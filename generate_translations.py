#!/usr/bin/env python3
"""
自动生成 TechPulse 完整翻译文件
根据 Agent 分析报告生成所有需要的翻译键
"""

# 翻译键定义
translations_structure = {
    "login": [
        ("title", "TechPulse", "TechPulse", "TechPulse"),
        ("subtitle", "科技脉搏 · 洞察未来", "Tech Pulse · Insight Future", "テックパルス · 未来を洞察"),
        ("username", "用户名", "Username", "ユーザー名"),
        ("email", "邮箱", "Email", "メールアドレス"),
        ("password", "密码", "Password", "パスワード"),
        ("confirmPassword", "确认密码", "Confirm Password", "パスワード確認"),
        ("remember", "记住我", "Remember me", "ログイン状態を保持"),
        ("forgotPassword", "忘记密码？", "Forgot password?", "パスワードを忘れた？"),
        ("loginButton", "登录", "Login", "ログイン"),
        ("registerButton", "注册", "Register", "登録"),
        ("switchToRegister", "还没有账号？立即注册", "Don't have an account? Register", "アカウントをお持ちでない方 登録"),
        ("switchToLogin", "已有账号？立即登录", "Already have an account? Login", "アカウントをお持ちの方 ログイン"),
        ("loginSuccess", "登录成功！", "Login successful!", "ログイン成功！"),
        ("registerSuccess", "注册成功！请登录", "Registration successful! Please login", "登録成功！ログインしてください"),
        ("loginFailed", "登录失败", "Login failed", "ログイン失敗"),
        ("registerFailed", "注册失败", "Registration failed", "登録失敗"),
        ("thirdPartyLogin", "或使用第三方登录", "Or login with", "他のログイン方法"),
        ("usernamePlaceholder", "请输入用户名", "Enter username", "ユーザー名を入力"),
        ("emailPlaceholder", "请输入邮箱地址", "Enter email address", "メールアドレスを入力"),
        ("passwordPlaceholder", "请输入密码", "Enter password", "パスワードを入力"),
        ("confirmPasswordPlaceholder", "请再次输入密码", "Re-enter password", "パスワードを再入力"),
        ("usernameRequired", "请输入用户名！", "Please enter username!", "ユーザー名を入力してください！"),
        ("emailRequired", "请输入邮箱地址！", "Please enter email address!", "メールアドレスを入力してください！"),
        ("passwordRequired", "请输入密码！", "Please enter password!", "パスワードを入力してください！"),
        ("confirmPasswordRequired", "请确认密码！", "Please confirm password!", "パスワードを確認してください！"),
        ("emailInvalid", "请输入有效的邮箱地址！", "Please enter a valid email address!", "有効なメールアドレスを入力してください！"),
        ("passwordMismatch", "两次输入的密码不一致！", "Passwords do not match!", "パスワードが一致しません！"),
    ],

    "dashboard": [
        ("title", "仪表板", "Dashboard", "ダッシュボード"),
        ("aiService", "AI 服务", "AI Service", "AIサービス"),
        ("connected", "已连接", "Connected", "接続済み"),
        ("notConfigured", "未配置", "Not Configured", "未設定"),
        ("searchPlaceholder", "搜索项目、论文、模型...", "Search projects, papers, models...", "プロジェクト、論文、モデルを検索..."),
        ("refresh", "刷新", "Refresh", "更新"),
        ("collectNewData", "采集新数据", "Collect New Data", "新しいデータを収集"),
        ("error", "错误", "Error", "エラー"),
        ("all", "全部", "All", "すべて"),
        ("noData", "暂无数据", "No Data", "データなし"),
        ("noDataDescription1", "还没有收集到任何技术情报", "No technical intelligence collected yet", "まだ技術情報が収集されていません"),
        ("noDataDescription2", "点击「采集新数据」按钮开始收集", "Click 'Collect New Data' button to start", "「新しいデータを収集」ボタンをクリックして開始"),
        ("details", "详情", "Details", "詳細"),
        ("viewOriginal", "查看原文", "View Original", "原文を見る"),
        ("translate", "翻译", "Translate", "翻訳"),
        ("aiCategory", "AI 分类", "AI Category", "AI分類"),
        ("techStack", "技术栈", "Tech Stack", "技術スタック"),
        ("tags", "标签", "Tags", "タグ"),
        ("close", "关闭", "Close", "閉じる"),
        ("saveToNotion", "保存到 Notion", "Save to Notion", "Notionに保存"),
        ("projectSummary", "项目概要", "Project Summary", "プロジェクト概要"),
        ("aiClassification", "AI 分类", "AI Classification", "AI分類"),
        ("technologyStack", "技术栈", "Technology Stack", "技術スタック"),
        ("projectTags", "项目标签", "Project Tags", "プロジェクトタグ"),
        ("trialSuggestion", "试用建议", "Trial Suggestion", "試用提案"),
        ("createTime", "创建时间", "Create Time", "作成時間"),
        ("dataCollectionStarted", "数据采集已开始。请稍后刷新页面查看新内容", "Data collection started. Please refresh the page after a moment to see new content", "データ収集が開始されました。しばらくしてからページを更新して新しいコンテンツを確認してください"),
        ("languageSwitched", "语言已切换为", "Language switched to", "言語が切り替わりました"),
        ("translationResult", "翻译结果", "Translation Result", "翻訳結果"),
        ("originalSummary", "原文概要：", "Original summary:", "原文概要："),
        ("translatedSummary", "翻译概要：", "Translated summary:", "翻訳概要："),
        ("savedToNotion", "已保存到Notion！", "Saved to Notion!", "Notionに保存されました！"),
    ],

    "github": [
        ("title", "GitHub", "GitHub", "GitHub"),
        ("subtitle", "开源项目仓库", "Open Source Repositories", "オープンソースリポジトリ"),
        ("updateData", "更新数据", "Update Data", "データを更新"),
        ("trendingPreview", "趋势预览", "Trending Preview", "トレンドプレビュー"),
        ("totalRepos", "仓库总数", "Total Repositories", "総リポジトリ数"),
        ("todayNew", "今日新增", "Today New", "本日の新着"),
        ("trendingRepos", "趋势仓库", "Trending Repos", "トレンドリポジトリ"),
        ("topLanguage", "热门语言", "Top Language", "人気言語"),
        ("searchPlaceholder", "搜索仓库...", "Search repositories...", "リポジトリを検索..."),
        ("languageFilter", "语言筛选", "Language Filter", "言語フィルタ"),
        ("allLanguages", "所有语言", "All Languages", "すべての言語"),
        ("all", "全部", "All", "すべて"),
        ("trending", "趋势", "Trending", "トレンド"),
        ("popular", "热门", "Popular", "人気"),
        ("recent", "最新", "Recent", "最新"),
        ("repositories", "个仓库", "repositories", "リポジトリ"),
        ("updateHistory", "更新历史", "Update History", "更新履歴"),
        ("noUpdateRecords", "暂无更新记录", "No update records", "更新記録なし"),
        ("languageStats", "语言统计", "Language Stats", "言語統計"),
        ("about", "关于这个GitHub仓库", "About this GitHub repository", "このGitHubリポジトリについて"),
        ("sorryCannotAnswer", "抱歉，我无法回答这个问题。", "Sorry, I can't answer this question.", "申し訳ございません。この質問には回答できません。"),
        ("sendMessageFailed", "发送消息失败", "Failed to send message", "メッセージの送信に失敗しました"),
        ("viewDetails", "详细查看", "View Details", "詳細を見る"),
        ("repoLinkUnavailable", "仓库链接不可用", "Repository link unavailable", "リポジトリリンクが利用できません"),
        ("repoDetails", "仓库详细信息", "Repository Details", "リポジトリ詳細"),
        ("creationTime", "创建时间:", "Creation time:", "作成時間:"),
        ("unknown", "未知", "Unknown", "不明"),
        ("fullDescription", "完整描述", "Full Description", "完全な説明"),
        ("noDescription", "暂无描述", "No description", "説明なし"),
        ("viewRepo", "查看仓库", "View Repository", "リポジトリを見る"),
        ("qaAboutRepo", "关于这个仓库的问答", "Q&A about this repository", "このリポジトリに関するQ&A"),
        ("askAboutRepo", "您可以问我关于这个GitHub仓库的任何问题", "You can ask me anything about this GitHub repository", "このGitHubリポジトリについて何でも質問できます"),
        ("you", "您:", "You:", "あなた:"),
        ("askQuestion", "问一下关于这个仓库的问题...", "Ask a question about this repository...", "このリポジトリについて質問してください..."),
        ("send", "发送", "Send", "送信"),
    ],

    "arxiv": [
        ("title", "arXiv", "arXiv", "arXiv"),
        ("subtitle", "学术论文", "Academic Papers", "学術論文"),
        ("updateData", "更新数据", "Update Data", "データを更新"),
        ("totalPapers", "论文总数", "Total Papers", "総論文数"),
        ("todayNew", "今日新增", "Today New", "本日の新着"),
        ("topCategory", "热门分类", "Top Category", "人気カテゴリ"),
        ("citationAvg", "平均引用", "Citation Avg", "平均引用数"),
        ("searchPlaceholder", "搜索论文...", "Search papers...", "論文を検索..."),
        ("categoryFilter", "分类筛选", "Category Filter", "カテゴリフィルタ"),
        ("allCategories", "所有分类", "All Categories", "すべてのカテゴリ"),
        ("all", "全部", "All", "すべて"),
        ("recent", "最新", "Recent", "最新"),
        ("highCitation", "高引用", "High Citation", "高引用"),
        ("papers", "篇论文", "papers", "論文"),
        ("readPaper", "阅读论文", "Read Paper", "論文を読む"),
        ("downloadPDF", "下载 PDF", "Download PDF", "PDFをダウンロード"),
        ("viewAbstract", "查看摘要", "View Abstract", "概要を見る"),
        ("category", "分类", "Category", "カテゴリ"),
        ("authors", "作者", "Authors", "著者"),
        ("topAuthors", "高产作者", "Top Authors", "多作の著者"),
        ("categoryDistribution", "分类分布", "Category Distribution", "カテゴリ分布"),
    ],

    "huggingface": [
        ("title", "Hugging Face", "Hugging Face", "Hugging Face"),
        ("subtitle", "AI 模型和数据集", "AI Models and Datasets", "AIモデルとデータセット"),
        ("updateData", "更新数据", "Update Data", "データを更新"),
        ("totalModels", "模型总数", "Total Models", "総モデル数"),
        ("totalDatasets", "数据集总数", "Total Datasets", "総データセット数"),
        ("todayNew", "今日新增", "Today New", "本日の新着"),
        ("topPipeline", "热门任务", "Top Pipeline", "人気タスク"),
        ("searchPlaceholder", "搜索模型...", "Search models...", "モデルを検索..."),
        ("pipelineFilter", "任务筛选", "Pipeline Filter", "タスクフィルタ"),
        ("allPipelines", "所有任务", "All Pipelines", "すべてのタスク"),
        ("all", "全部", "All", "すべて"),
        ("popular", "热门", "Popular", "人気"),
        ("recent", "最新", "Recent", "最新"),
        ("models", "个模型", "models", "モデル"),
        ("downloads", "下载量", "Downloads", "ダウンロード数"),
        ("likes", "点赞", "Likes", "いいね"),
        ("pipelineDistribution", "任务分布", "Pipeline Distribution", "タスク分布"),
        ("popularTags", "热门标签", "Popular Tags", "人気タグ"),
        ("about", "关于这个HuggingFace模型", "About this HuggingFace model", "このHuggingFaceモデルについて"),
        ("modelDetails", "模型详细信息", "Model Details", "モデル詳細"),
        ("author", "作者:", "Author:", "著者:"),
        ("viewModel", "查看模型", "View Model", "モデルを見る"),
        ("qaAboutModel", "关于这个模型的问答", "Q&A about this model", "このモデルに関するQ&A"),
        ("askAboutModel", "您可以问我关于这个HuggingFace模型的任何问题", "You can ask me anything about this HuggingFace model", "このHuggingFaceモデルについて何でも質問できます"),
    ],

    "zenn": [
        ("title", "Zenn", "Zenn", "Zenn"),
        ("subtitle", "技术文章", "Tech Articles", "技術記事"),
        ("updateData", "更新数据", "Update Data", "データを更新"),
        ("totalArticles", "文章总数", "Total Articles", "総記事数"),
        ("todayNew", "今日新増", "Today New", "本日の新着"),
        ("totalLikes", "总点赞数", "Total Likes", "総いいね数"),
        ("activeAuthors", "活跃作者", "Active Authors", "アクティブな著者"),
        ("searchPlaceholder", "搜索文章...", "Search articles...", "記事を検索..."),
        ("typeFilter", "类型筛选", "Type Filter", "タイプフィルタ"),
        ("allTypes", "所有类型", "All Types", "すべてのタイプ"),
        ("article", "文章", "Article", "記事"),
        ("book", "书籍", "Book", "本"),
        ("scrap", "片段", "Scrap", "スクラップ"),
        ("articles", "篇文章", "articles", "記事"),
        ("readArticle", "阅读文章", "Read Article", "記事を読む"),
        ("premium", "付费", "Premium", "有料"),
        ("likes", "点赞", "Likes", "いいね"),
        ("comments", "评论", "Comments", "コメント"),
        ("popularAuthors", "热门作者", "Popular Authors", "人気著者"),
        ("popularTags", "热门标签", "Popular Tags", "人気タグ"),
        ("anonymous", "匿名", "Anonymous", "匿名"),
        ("articleLinkUnavailable", "文章链接不可用", "Article link unavailable", "記事リンクが利用できません"),
        ("noTitle", "无标题", "No title", "タイトルなし"),
        ("noSummary", "暂无摘要", "No summary", "概要なし"),
    ],

    "dataSources": [
        ("title", "数据源管理", "Data Source Management", "データソース管理"),
        ("updateAll", "更新全部", "Update All", "すべて更新"),
        ("previewGithubTrending", "预览 GitHub 趋势", "Preview GitHub Trending", "GitHubトレンドをプレビュー"),
        ("updateByNeed", "按需更新", "Update by Need", "必要に応じて更新"),
        ("updateDescription", "点击上方按钮手动触发数据更新", "Click the button above to manually trigger data update", "上のボタンをクリックして手動でデータ更新をトリガー"),
        ("updating", "更新中...", "Updating...", "更新中..."),
        ("update", "更新", "Update", "更新"),
        ("updated", "已更新", "Updated", "更新済み"),
        ("updateFailed", "更新失败", "Update Failed", "更新失敗"),
        ("pendingUpdate", "待更新", "Pending Update", "更新待ち"),
        ("totalData", "数据总量", "Total Data", "総データ量"),
        ("todayNew", "今日新增", "Today New", "本日の新着"),
        ("lastUpdate", "最后更新", "Last Update", "最終更新"),
        ("dataStatistics", "数据统计", "Data Statistics", "データ統計"),
        ("totalAmount", "总数据量", "Total Amount", "総データ量"),
        ("activeSources", "活跃数据源", "Active Sources", "アクティブなデータソース"),
        ("updateHistory", "更新历史", "Update History", "更新履歴"),
        ("noUpdateRecords", "暂无更新记录", "No update records", "更新記録なし"),
        ("previewTitle", "GitHub 趋势预览", "GitHub Trending Preview", "GitHubトレンドプレビュー"),
        ("close", "关闭", "Close", "閉じる"),
        ("saveData", "保存数据", "Save Data", "データを保存"),
        ("pythonProjects", "Python 项目", "Python Projects", "Pythonプロジェクト"),
        ("score", "评分", "Score", "スコア"),
        ("allLanguageProjects", "所有语言项目", "All Language Projects", "すべての言語プロジェクト"),
    ],

    "chat": [
        ("title", "AI 助手", "AI Assistant", "AIアシスタント"),
        ("subtitle", "技术内容分析", "Tech Content Analysis", "技術コンテンツ分析"),
        ("welcome", "欢迎", "Welcome", "ようこそ"),
        ("analysisComplete", "分析完成！", "Analysis complete!", "分析完了！"),
        ("detailAnalysis", "详细分析", "Detailed Analysis", "詳細分析"),
        ("copySummary", "复制摘要", "Copy Summary", "概要をコピー"),
        ("currentPage", "当前页面", "Current Page", "現在のページ"),
        ("clearChat", "清空对话", "Clear Chat", "チャットをクリア"),
        ("aiThinking", "AI 思考中...", "AI thinking...", "AI思考中..."),
        ("suggestedQuestions", "建议的问题", "Suggested Questions", "推奨される質問"),
        ("inputPlaceholder", "输入消息...", "Enter message...", "メッセージを入力..."),
        ("send", "发送", "Send", "送信"),
        ("hint", "提示", "Hint", "ヒント"),
        ("detailAnalysisTitle", "详细分析", "Detailed Analysis", "詳細分析"),
        ("copyAnalysis", "复制分析", "Copy Analysis", "分析をコピー"),
        ("titleLabel", "标题", "Title", "タイトル"),
        ("link", "链接", "Link", "リンク"),
        ("contentType", "内容类型", "Content Type", "コンテンツタイプ"),
        ("keyPoints", "关键点", "Key Points", "キーポイント"),
        ("detailedAnalysis", "详细分析", "Detailed Analysis", "詳細分析"),
        ("relatedTags", "相关标签", "Related Tags", "関連タグ"),
        ("analysisFailed", "分析失败", "Analysis failed", "分析失敗"),
        ("messageSendFailed", "消息发送失败", "Message send failed", "メッセージ送信失敗"),
        ("chatCleared", "对话已清空。您可以开始新的对话！", "Chat cleared. You can start a new conversation!", "チャットがクリアされました。新しい会話を開始できます！"),
        ("copiedToClipboard", "已复制到剪贴板", "Copied to clipboard", "クリップボードにコピーされました"),
    ],

    "analytics": [
        ("title", "数据分析", "Data Analysis", "データ分析"),
        ("subtitle", "技术趋势洞察", "Tech Trend Insights", "技術トレンドの洞察"),
        ("loading", "加载中...", "Loading...", "読み込み中..."),
        ("noData", "暂无数据", "No Data", "データなし"),
        ("noDataDescription", "暂无分析数据", "No analysis data", "分析データなし"),
        ("refreshData", "刷新数据", "Refresh Data", "データを更新"),
        ("totalProjects", "项目总数", "Total Projects", "総プロジェクト数"),
        ("projects", "个项目", "projects", "プロジェクト"),
        ("mainSource", "主要来源", "Main Source", "主なソース"),
        ("techTags", "个技术标签", "tech tags", "技術タグ"),
        ("dataSourceDistribution", "数据源分布", "Data Source Distribution", "データソース分布"),
        ("dailyNewTrend", "每日新增趋势", "Daily New Trend", "日次新規トレンド"),
        ("techPopularityRanking", "技术热度排行", "Tech Popularity Ranking", "技術人気ランキング"),
        ("techKeywordCloud", "技术关键词云", "Tech Keyword Cloud", "技術キーワードクラウド"),
        ("hotProjectsRanking", "热门项目排行", "Hot Projects Ranking", "人気プロジェクトランキング"),
        ("last7Days", "直近7日間", "Last 7 Days", "過去7日間"),
        ("last14Days", "直近14日間", "Last 14 Days", "過去14日間"),
        ("last30Days", "直近30日間", "Last 30 Days", "過去30日間"),
        ("quantity", "数量", "Quantity", "数量"),
        ("date", "日付", "Date", "日付"),
        ("popularTech", "人気技術", "Popular Tech", "人気技術"),
    ],

    "apiConfig": [
        ("title", "API 配置", "API Configuration", "API設定"),
        ("subtitle", "管理外部服务密钥", "Manage External Service Keys", "外部サービスキーの管理"),
        ("reloadSettings", "重新加载配置", "Reload Settings", "設定を再読み込み"),
        ("saveSettings", "保存配置", "Save Settings", "設定を保存"),
        ("schedule", "定时任务", "Schedule", "スケジュール"),
    ],

    "common": [
        ("save", "保存", "Save", "保存"),
        ("cancel", "取消", "Cancel", "キャンセル"),
        ("delete", "删除", "Delete", "削除"),
        ("edit", "编辑", "Edit", "編集"),
        ("confirm", "确认", "Confirm", "確認"),
        ("search", "搜索", "Search", "検索"),
        ("filter", "筛选", "Filter", "フィルタ"),
        ("export", "导出", "Export", "エクスポート"),
        ("import", "导入", "Import", "インポート"),
        ("refresh", "刷新", "Refresh", "更新"),
        ("loading", "加载中...", "Loading...", "読み込み中..."),
        ("noData", "暂无数据", "No Data", "データなし"),
        ("success", "成功", "Success", "成功"),
        ("error", "错误", "Error", "エラー"),
        ("warning", "警告", "Warning", "警告"),
        ("info", "提示", "Info", "情報"),
        ("logout", "退出登录", "Logout", "ログアウト"),
        ("view", "查看", "View", "表示"),
        ("close", "关闭", "Close", "閉じる"),
    ],
}

def generate_typescript_interface():
    """生成 TypeScript 接口定义"""
    lines = ["export interface Translations {"]

    for category, keys in translations_structure.items():
        lines.append(f"  // {category}")
        lines.append(f"  {category}: {{")
        for key_data in keys:
            key_name = key_data[0]
            lines.append(f"    {key_name}: string;")
        lines.append("  };")
        lines.append("")

    lines.append("}")
    return "\n".join(lines)

def generate_translations(lang_index):
    """生成指定语言的翻译值
    lang_index: 1=中文, 2=英文, 3=日文
    """
    lines = []
    for category, keys in translations_structure.items():
        lines.append(f"    {category}: {{")
        for key_data in keys:
            key_name = key_data[0]
            value = key_data[lang_index]
            # 转义引号
            escaped_value = value.replace("'", "\\'")
            lines.append(f"      {key_name}: '{escaped_value}',")
        lines.append("    },")
        lines.append("")
    return "\n".join(lines)

def main():
    print("生成 TypeScript 接口定义...")
    interface = generate_typescript_interface()

    print("生成中文翻译...")
    zh_translations = generate_translations(1)

    print("生成英文翻译...")
    en_translations = generate_translations(2)

    print("生成日文翻译...")
    ja_translations = generate_translations(3)

    # 输出到文件
    with open("/home/AI/TechPulse/translations_generated.txt", "w", encoding="utf-8") as f:
        f.write("=== TypeScript Interface ===\n\n")
        f.write(interface)
        f.write("\n\n=== Chinese (zh-CN) ===\n\n")
        f.write(zh_translations)
        f.write("\n\n=== English (en-US) ===\n\n")
        f.write(en_translations)
        f.write("\n\n=== Japanese (ja-JP) ===\n\n")
        f.write(ja_translations)

    print("\n✅ 翻译文件已生成: /home/AI/TechPulse/translations_generated.txt")
    print(f"总计: {sum(len(keys) for keys in translations_structure.values())} 个翻译键")
    print(f"分类: {len(translations_structure)} 个")

if __name__ == "__main__":
    main()
