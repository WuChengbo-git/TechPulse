# 国际化迁移详细计划

## 📊 总体情况

- **需要翻译的文本总数**: 363
- **涉及文件数**: 22
- **需要新增的翻译模块**: 16

## 🎯 迁移优先级

根据影响范围和使用频率,建议按以下优先级进行迁移:

### 第一优先级 (P0 - 核心页面)

这些是用户最常访问的页面,应最先完成:

- [ ] `pages/LLMProvidersPage.tsx` (71 处硬编码)
- [ ] `pages/SettingsPage.tsx` (48 处硬编码)
- [ ] `components/InterestSurvey.tsx` (20 处硬编码)

### 第二优先级 (P1 - 功能页面)

- [ ] `pages/TrendsPage.tsx` (60 处硬编码)
- [ ] `pages/TaskManagementPage.tsx` (47 处硬编码)
- [ ] `pages/SystemConfig.tsx` (43 处硬编码)
- [ ] `pages/SystemStatusPage.tsx` (23 处硬编码)
- [ ] `pages/ArxivPage.tsx` (23 处硬编码)
- [ ] `pages/HuggingFacePage.tsx` (22 处硬编码)
- [ ] `pages/ZennPage.tsx` (16 处硬编码)
- [ ] `pages/GitHubPage.tsx` (8 处硬编码)
- [ ] `pages/Login.tsx` (6 处硬编码)

### 第三优先级 (P2 - 组件和工具)

- [ ] `components/InterestSurvey.tsx` (20 处硬编码)
- [ ] `components/SmartSearch.tsx` (12 处硬编码)
- [ ] `components/RecommendationPanel.tsx` (11 处硬编码)
- [ ] `components/SearchResultList.tsx` (7 处硬编码)

## 📝 详细翻译清单

按模块分类的所有需要翻译的文本:

### analytics (3 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 数量 | `analytics.short_216941` | Analytics.tsx |
| 日付 | `analytics.short_712802` | Analytics.tsx |
| 人気技術 | `analytics.short_888032` | Analytics.tsx |

### arxiv (16 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| AI・Machine Learning | `arxiv.message_254814` | ArxivPage.tsx |
| 获取arXiv数据失败 | `arxiv.failedMessage` | ArxivPage.tsx |
| 关于这篇arXiv论文  | `arxiv.message_488480` | ArxivPage.tsx |
| 抱歉，我无法回答这个问题。 | `arxiv.message_019074` | ArxivPage.tsx |
| 发送消息失败 | `arxiv.failedMessage` | ArxivPage.tsx |
| 机器学习 | `arxiv.short_676723` | ArxivPage.tsx |
| 人工智能 | `arxiv.short_940505` | ArxivPage.tsx |
| 计算机视觉 | `arxiv.short_179700` | ArxivPage.tsx |
| 视觉 | `arxiv.short_115535` | ArxivPage.tsx |
| 摘要链接不可用 | `arxiv.message_536310` | ArxivPage.tsx |
| PDF链接不可用 | `arxiv.message_456719` | ArxivPage.tsx |
| 无标题 | `arxiv.short_343226` | ArxivPage.tsx |
| 暂无摘要 | `arxiv.short_429306` | ArxivPage.tsx |
| 未知 | `arxiv.short_638003` | ArxivPage.tsx |
| ${range[0]}-${range[1]} / ${to | `arxiv.message_659875` | ArxivPage.tsx |
| 问一下关于这篇论文的问题... | `arxiv.message_679351` | ArxivPage.tsx |

### common (24 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 欢迎使用 TechPulse！我们将根据你的偏好推荐内容 🎉 | `common.successMessage` | App.tsx |
| 你可以随时在个人中心完成偏好设置 | `common.message_441402` | App.tsx |
| LLM模型管理 | `common.modelMessage` | App.tsx |
| 简体中文 | `common.short_605109` | App.tsx |
| 日本語 | `common.short_916985` | App.tsx |
| 优秀 | `common.short_843926` | QualityBadge.tsx |
| 良好 | `common.short_157824` | QualityBadge.tsx |
| 中等 | `common.short_581451` | QualityBadge.tsx |
| 一般 | `common.short_965800` | QualityBadge.tsx |
| 较低 | `common.short_045312` | QualityBadge.tsx |
| 没有找到相关内容 | `common.message_182402` | SearchResultList.tsx |
| 找到 | `common.short_649260` | SearchResultList.tsx |
| 条结果 | `common.short_495007` | SearchResultList.tsx |
| 🧠 分析模式 | `common.message_963774` | SearchResultList.tsx |
| 🔍 查询模式 | `common.message_005640` | SearchResultList.tsx |
| 相关度 | `common.short_835839` | SearchResultList.tsx |
| 更多 | `common.short_566517` | SearchResultList.tsx |
| 认证错误: | `common.errorMessage` | Login.tsx |
| 错误响应: | `common.errorMessage` | Login.tsx |
| 用户名或密码错误 | `common.errorMessage` | Login.tsx |
| 请求参数错误 | `common.errorMessage` | Login.tsx |
| 服务器错误，请稍后重试 | `common.errorMessage` | Login.tsx |
| 网络错误: ${error.message} | `common.errorMessage` | Login.tsx |
| 翻译失败: | `common.failedMessage` | translateTags.ts |

### dashboard (3 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 语言已切换为${languages[language]?.n | `dashboard.alreadyMessage` | Dashboard.tsx |
| 翻译结果 | `dashboard.short_686679` | Dashboard.tsx |
| 已保存到Notion！ | `dashboard.saveMessage` | Dashboard.tsx |

### github (4 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 关于这个GitHub仓库  | `github.message_692620` | GitHubPage.tsx |
| 仓库链接不可用 | `github.message_318195` | GitHubPage.tsx |
| 暂无描述 | `github.short_264852` | GitHubPage.tsx |
| 问一下关于这个仓库的问题... | `github.message_279618` | GitHubPage.tsx |

### huggingface (16 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 文本生成 | `huggingface.short_744738` | HuggingFacePage.tsx |
| 文本分类 | `huggingface.short_336499` | HuggingFacePage.tsx |
| 标记分类 | `huggingface.short_964702` | HuggingFacePage.tsx |
| 问答系统 | `huggingface.short_665609` | HuggingFacePage.tsx |
| 填充遮罩 | `huggingface.short_161846` | HuggingFacePage.tsx |
| 文本摘要 | `huggingface.short_964226` | HuggingFacePage.tsx |
| 机器翻译 | `huggingface.short_145405` | HuggingFacePage.tsx |
| 文本到文本生成 | `huggingface.message_626435` | HuggingFacePage.tsx |
| 对话系统 | `huggingface.short_077225` | HuggingFacePage.tsx |
| 图像分类 | `huggingface.short_550151` | HuggingFacePage.tsx |
| 目标检测 | `huggingface.short_913260` | HuggingFacePage.tsx |
| 图像分割 | `huggingface.short_175246` | HuggingFacePage.tsx |
| 语音识别 | `huggingface.short_759520` | HuggingFacePage.tsx |
| 文本转语音 | `huggingface.short_255590` | HuggingFacePage.tsx |
| 关于这个HuggingFace模型  | `huggingface.modelMessage` | HuggingFacePage.tsx |
| 问一下关于这个模型的问题... | `huggingface.modelMessage` | HuggingFacePage.tsx |

### llmProviders (52 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 加载提供商列表失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 加载模型列表失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 请先选择提供商类型 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 测试连接失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 无法找到提供商模板 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 提供商更新成功 | `llmProviders.successMessage` | LLMProvidersPage.tsx |
| 提供商创建成功 | `llmProviders.successMessage` | LLMProvidersPage.tsx |
| 请填写必填字段 | `llmProviders.pleaseMessage` | LLMProvidersPage.tsx |
| 保存失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 提供商删除成功 | `llmProviders.successMessage` | LLMProvidersPage.tsx |
| 删除失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 模型添加成功 | `llmProviders.successMessage` | LLMProvidersPage.tsx |
| 保存模型失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 模型删除成功 | `llmProviders.successMessage` | LLMProvidersPage.tsx |
| 删除模型失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 提供商名称 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 类型 | `llmProviders.short_716402` | LLMProvidersPage.tsx |
| 自定义 | `llmProviders.short_811145` | LLMProvidersPage.tsx |
| 状态 | `llmProviders.short_064507` | LLMProvidersPage.tsx |
| 启用 | `llmProviders.short_084369` | LLMProvidersPage.tsx |
| 禁用 | `llmProviders.short_416523` | LLMProvidersPage.tsx |
| 连接正常 | `llmProviders.connectionMessage` | LLMProvidersPage.tsx |
| 连接失败 | `llmProviders.failedMessage` | LLMProvidersPage.tsx |
| 确定删除此提供商吗？ | `llmProviders.deleteMessage` | LLMProvidersPage.tsx |
| 删除后将同时删除该提供商下的所有模型配置 | `llmProviders.deleteMessage` | LLMProvidersPage.tsx |
| 最大Token | `llmProviders.message_327342` | LLMProvidersPage.tsx |
| 上下文窗口 | `llmProviders.short_515508` | LLMProvidersPage.tsx |
| 确定删除此模型吗？ | `llmProviders.deleteMessage` | LLMProvidersPage.tsx |
| 暂无提供商，点击 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 开始配置 | `llmProviders.configMessage` | LLMProvidersPage.tsx |
| 编辑提供商 | `llmProviders.editMessage` | LLMProvidersPage.tsx |
| 添加提供商 | `llmProviders.addMessage` | LLMProvidersPage.tsx |
| 保存 | `llmProviders.saveMessage` | LLMProvidersPage.tsx |
| 提供商类型 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 请选择提供商类型 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 选择提供商类型 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 云端提供商 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 本地提供商 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 请输入提供商名称 | `llmProviders.providerMessage` | LLMProvidersPage.tsx |
| 例如：我的OpenAI | `llmProviders.message_737008` | LLMProvidersPage.tsx |
| 请输入${field.label} | `llmProviders.pleaseMessage` | LLMProvidersPage.tsx |
| 快速添加 | `llmProviders.addMessage` | LLMProvidersPage.tsx |
| 暂无模型，点击 | `llmProviders.modelMessage` | LLMProvidersPage.tsx |
| 或使用快速添加 | `llmProviders.addMessage` | LLMProvidersPage.tsx |
| 添加模型 | `llmProviders.addMessage` | LLMProvidersPage.tsx |
| 请输入模型名称 | `llmProviders.modelMessage` | LLMProvidersPage.tsx |
| 例如：gpt-4o | `llmProviders.message_004109` | LLMProvidersPage.tsx |
| 显示名称 | `llmProviders.short_350012` | LLMProvidersPage.tsx |
| 例如：GPT-4o | `llmProviders.message_610828` | LLMProvidersPage.tsx |
| 最大Token数 | `llmProviders.message_502026` | LLMProvidersPage.tsx |

_...还有 2 项_

### onboarding (20 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 大语言模型 (LLM) | `onboarding.modelMessage` | InterestSurvey.tsx |
| 计算机视觉 (CV) | `onboarding.message_063271` | InterestSurvey.tsx |
| 强化学习 (RL) | `onboarding.message_114189` | InterestSurvey.tsx |
| 多模态 (Multimodal) | `onboarding.message_951632` | InterestSurvey.tsx |
| 模型量化 (Quantization) | `onboarding.modelMessage` | InterestSurvey.tsx |
| 开源工具 | `onboarding.short_072968` | InterestSurvey.tsx |
| 自然语言处理 (NLP) | `onboarding.message_586502` | InterestSurvey.tsx |
| 研究员 | `onboarding.short_363748` | InterestSurvey.tsx |
| 工程师 | `onboarding.short_490668` | InterestSurvey.tsx |
| 产品经理 | `onboarding.short_240108` | InterestSurvey.tsx |
| 学生 | `onboarding.short_104892` | InterestSurvey.tsx |
| 前沿论文 | `onboarding.short_958323` | InterestSurvey.tsx |
| 开源项目 | `onboarding.short_396825` | InterestSurvey.tsx |
| 实用工具 | `onboarding.short_966248` | InterestSurvey.tsx |
| 行业趋势 | `onboarding.short_349141` | InterestSurvey.tsx |
| 偏好设置保存成功！ | `onboarding.successMessage` | InterestSurvey.tsx |
| 保存失败，请重试 | `onboarding.failedMessage` | InterestSurvey.tsx |
| 请至少选择一个领域 | `onboarding.pleaseMessage` | InterestSurvey.tsx |
| 请选择你的角色 | `onboarding.pleaseMessage` | InterestSurvey.tsx |
| 请至少选择一种内容类型 | `onboarding.pleaseMessage` | InterestSurvey.tsx |

### recommendation (10 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 加载推荐失败 | `recommendation.failedMessage` | RecommendationPanel.tsx |
| 已收藏 | `recommendation.alreadyMessage` | RecommendationPanel.tsx |
| 收藏失败 | `recommendation.failedMessage` | RecommendationPanel.tsx |
| 为你推荐 | `recommendation.short_629679` | RecommendationPanel.tsx |
| 还没有设置兴趣标签 | `recommendation.message_338218` | RecommendationPanel.tsx |
| 请前往设置页面设置兴趣标签 | `recommendation.pleaseMessage` | RecommendationPanel.tsx |
| 设置兴趣 | `recommendation.short_660574` | RecommendationPanel.tsx |
| 换一批 | `recommendation.short_706577` | RecommendationPanel.tsx |
| 你的兴趣 | `recommendation.short_668332` | RecommendationPanel.tsx |
| 推荐基于你的兴趣标签和历史行为 | `recommendation.message_423509` | RecommendationPanel.tsx |

### search (12 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 深度学习 | `search.short_815879` | SmartSearch.tsx |
| 大语言模型 | `search.modelMessage` | SmartSearch.tsx |
| 关键词 | `search.short_550906` | SmartSearch.tsx |
| AI问答 | `search.short_400811` | SmartSearch.tsx |
| 清除历史 | `search.short_150711` | SmartSearch.tsx |
| 搜索技术内容... | `search.message_158355` | SmartSearch.tsx |
| 问我任何技术问题... | `search.message_730504` | SmartSearch.tsx |
| 试试这些 | `search.short_273066` | SmartSearch.tsx |
| AI模式示例 | `search.message_186153` | SmartSearch.tsx |
| 今天LLM有什么新突破？ | `search.promptMessage` | SmartSearch.tsx |
| 推荐一些AI Agent框架 | `search.message_687914` | SmartSearch.tsx |
| 什么是LoRA量化技术？ | `search.promptMessage` | SmartSearch.tsx |

### settings (46 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| OpenAI 连接测试成功！ | `settings.successMessage` | SettingsPage.tsx |
| OpenAI 连接测试失败，请检查配置 | `settings.failedMessage` | SettingsPage.tsx |
| 连接测试成功！模型：${result.model} | `settings.successMessage` | SettingsPage.tsx |
| Azure OpenAI 连接测试失败 | `settings.failedMessage` | SettingsPage.tsx |
| Ollama 连接测试成功！ | `settings.successMessage` | SettingsPage.tsx |
| Ollama 连接测试失败 | `settings.failedMessage` | SettingsPage.tsx |
| Notion 连接测试成功！ | `settings.successMessage` | SettingsPage.tsx |
| Notion 连接测试失败 | `settings.failedMessage` | SettingsPage.tsx |
| 配置保存成功！${result.validation.mes | `settings.successMessage` | SettingsPage.tsx |
| 配置保存成功！ | `settings.successMessage` | SettingsPage.tsx |
| 配置保存失败 | `settings.failedMessage` | SettingsPage.tsx |
| OpenAI 配置 | `settings.configMessage` | SettingsPage.tsx |
| 请输入 API Key | `settings.pleaseMessage` | SettingsPage.tsx |
| 模型 | `settings.modelMessage` | SettingsPage.tsx |
| Base URL（可选） | `settings.message_995057` | SettingsPage.tsx |
| 自定义 API 地址，用于代理或兼容服务 | `settings.message_835160` | SettingsPage.tsx |
| Organization ID（可选） | `settings.message_149332` | SettingsPage.tsx |
| Azure OpenAI 配置 | `settings.configMessage` | SettingsPage.tsx |
| 请输入 Endpoint | `settings.pleaseMessage` | SettingsPage.tsx |
| 请输入部署名称 | `settings.pleaseMessage` | SettingsPage.tsx |
| Ollama（本地 LLM）配置 | `settings.configMessage` | SettingsPage.tsx |
| 本地 LLM 服务 | `settings.message_569491` | SettingsPage.tsx |
| Ollama 允许您在本地运行开源大语言模型，无需调用云端  | `settings.modelMessage` | SettingsPage.tsx |
| 服务地址 | `settings.short_059828` | SettingsPage.tsx |
| 请输入服务地址 | `settings.pleaseMessage` | SettingsPage.tsx |
| 确保模型已在 Ollama 中下载 | `settings.modelMessage` | SettingsPage.tsx |
| Notion 集成 | `settings.message_560524` | SettingsPage.tsx |
| Notion 数据库同步 | `settings.message_422664` | SettingsPage.tsx |
| 将技术情报自动同步到您的 Notion 数据库，方便管理和分 | `settings.message_555795` | SettingsPage.tsx |
| 请输入 Notion API Token | `settings.pleaseMessage` | SettingsPage.tsx |
| 数据库 ID | `settings.message_387336` | SettingsPage.tsx |
| 请输入数据库 ID | `settings.pleaseMessage` | SettingsPage.tsx |
| 从 Notion 数据库 URL 中获取 ID | `settings.message_791700` | SettingsPage.tsx |
| 同步频率 | `settings.short_295387` | SettingsPage.tsx |
| 其他知识库（即将支持） | `settings.message_058363` | SettingsPage.tsx |
| 推荐系统设置 | `settings.message_776323` | SettingsPage.tsx |
| 个性化推荐功能 | `settings.message_608118` | SettingsPage.tsx |
| 系统会根据您的浏览、收藏等行为，智能推荐您可能感兴趣的技术内 | `settings.message_594249` | SettingsPage.tsx |
| 推荐算法 | `settings.short_977628` | SettingsPage.tsx |
| 界面设置 | `settings.short_608763` | SettingsPage.tsx |
| 界面语言 | `settings.short_934659` | SettingsPage.tsx |
| 主题模式 | `settings.short_583181` | SettingsPage.tsx |
| 每页显示数量 | `settings.message_044564` | SettingsPage.tsx |
| 账号信息 | `settings.short_898264` | SettingsPage.tsx |
| 用户名 | `settings.short_460773` | SettingsPage.tsx |
| 邮箱 | `settings.short_711365` | SettingsPage.tsx |

### systemConfig (39 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 加载配置失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 配置验证通过 | `systemConfig.configMessage` | SystemConfig.tsx |
| 配置存在 ${result.errors.length} 个 | `systemConfig.errorMessage` | SystemConfig.tsx |
| 验证失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 没有修改需要保存 | `systemConfig.saveMessage` | SystemConfig.tsx |
| 成功更新 ${result.updated_keys.len | `systemConfig.successMessage` | SystemConfig.tsx |
| 保存失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 配置已重新加载 | `systemConfig.loadingMessage` | SystemConfig.tsx |
| 重载失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 已恢复默认配置 | `systemConfig.configMessage` | SystemConfig.tsx |
| 恢复失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 加载备份失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 配置已从备份恢复 | `systemConfig.configMessage` | SystemConfig.tsx |
| 配置已导出 | `systemConfig.configMessage` | SystemConfig.tsx |
| 导出失败: ${error.message} | `systemConfig.failedMessage` | SystemConfig.tsx |
| 配置键 | `systemConfig.configMessage` | SystemConfig.tsx |
| 配置值 | `systemConfig.configMessage` | SystemConfig.tsx |
| ${record.key} 的值 | `systemConfig.message_852939` | SystemConfig.tsx |
| 操作 | `systemConfig.short_167366` | SystemConfig.tsx |
| 配置有效 | `systemConfig.configMessage` | SystemConfig.tsx |
| 配置有误 | `systemConfig.configMessage` | SystemConfig.tsx |
| 隐藏 | `systemConfig.short_822766` | SystemConfig.tsx |
| 显示 | `systemConfig.short_713776` | SystemConfig.tsx |
| 配置项总数 | `systemConfig.configMessage` | SystemConfig.tsx |
| 已修改项 | `systemConfig.alreadyMessage` | SystemConfig.tsx |
| 验证错误 | `systemConfig.errorMessage` | SystemConfig.tsx |
| 验证警告 | `systemConfig.warningMessage` | SystemConfig.tsx |
| 配置验证失败 | `systemConfig.failedMessage` | SystemConfig.tsx |
| 配置警告 | `systemConfig.warningMessage` | SystemConfig.tsx |
| 确定要恢复默认配置吗？ | `systemConfig.configMessage` | SystemConfig.tsx |
| 这将覆盖当前所有配置，无法撤销。 | `systemConfig.configMessage` | SystemConfig.tsx |
| 确定 | `systemConfig.short_966746` | SystemConfig.tsx |
| 取消 | `systemConfig.cancelMessage` | SystemConfig.tsx |
| 共 ${total} 项配置 | `systemConfig.configMessage` | SystemConfig.tsx |
| 配置备份管理 | `systemConfig.configMessage` | SystemConfig.tsx |
| 备份文件 | `systemConfig.short_284439` | SystemConfig.tsx |
| 创建时间 | `systemConfig.short_080563` | SystemConfig.tsx |
| 文件大小 | `systemConfig.short_391863` | SystemConfig.tsx |
| 确定要从此备份恢复配置吗？ | `systemConfig.configMessage` | SystemConfig.tsx |

### systemStatus (23 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 正常 | `systemStatus.short_226242` | SystemStatusPage.tsx |
| 警告 | `systemStatus.warningMessage` | SystemStatusPage.tsx |
| エラー | `systemStatus.short_815248` | SystemStatusPage.tsx |
| サービス名 | `systemStatus.short_105156` | SystemStatusPage.tsx |
| ステータス | `systemStatus.short_282189` | SystemStatusPage.tsx |
| 応答時間 | `systemStatus.short_498642` | SystemStatusPage.tsx |
| 稼働率 | `systemStatus.short_094296` | SystemStatusPage.tsx |
| 最終確認 | `systemStatus.short_321021` | SystemStatusPage.tsx |
| API名 | `systemStatus.short_345314` | SystemStatusPage.tsx |
| 今日の使用量 | `systemStatus.message_780161` | SystemStatusPage.tsx |
| 最終使用 | `systemStatus.short_904454` | SystemStatusPage.tsx |
| メモリ | `systemStatus.short_342260` | SystemStatusPage.tsx |
| ネットワーク | `systemStatus.message_042631` | SystemStatusPage.tsx |
| システムは正常に稼働中 | `systemStatus.message_887783` | SystemStatusPage.tsx |
| すべてのコアサービスが正常に動作しています。一部の外部API | `systemStatus.message_564299` | SystemStatusPage.tsx |
| CPU使用率 | `systemStatus.message_657954` | SystemStatusPage.tsx |
| メモリ使用率 | `systemStatus.message_196452` | SystemStatusPage.tsx |
| ディスク使用率 | `systemStatus.message_068547` | SystemStatusPage.tsx |
| ネットワーク使用率 | `systemStatus.message_242680` | SystemStatusPage.tsx |
| リソース使用履歴（過去24時間） | `systemStatus.message_171876` | SystemStatusPage.tsx |
| サービスステータス | `systemStatus.message_552480` | SystemStatusPage.tsx |
| API使用状況 | `systemStatus.message_538817` | SystemStatusPage.tsx |
| 最近のシステムイベント | `systemStatus.message_511577` | SystemStatusPage.tsx |

### taskManagement (40 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 待機中 | `taskManagement.short_680472` | TaskManagementPage.tsx |
| 実行中 | `taskManagement.short_201875` | TaskManagementPage.tsx |
| 完了 | `taskManagement.short_751479` | TaskManagementPage.tsx |
| 失敗 | `taskManagement.short_481014` | TaskManagementPage.tsx |
| 一時停止 | `taskManagement.short_425234` | TaskManagementPage.tsx |
| 全データ源 | `taskManagement.short_387758` | TaskManagementPage.tsx |
| タスクを実行中... | `taskManagement.message_081726` | TaskManagementPage.tsx |
| タスクを開始しました | `taskManagement.message_040381` | TaskManagementPage.tsx |
| タスクを一時停止しました | `taskManagement.message_300281` | TaskManagementPage.tsx |
| タスクを削除しました | `taskManagement.message_904550` | TaskManagementPage.tsx |
| タスクを有効化しました | `taskManagement.message_531199` | TaskManagementPage.tsx |
| タスクを無効化しました | `taskManagement.message_603596` | TaskManagementPage.tsx |
| タスクを更新しました | `taskManagement.message_298292` | TaskManagementPage.tsx |
| タスクを作成しました | `taskManagement.message_169117` | TaskManagementPage.tsx |
| タスク名 | `taskManagement.short_804058` | TaskManagementPage.tsx |
| データソース | `taskManagement.message_968873` | TaskManagementPage.tsx |
| スケジュール | `taskManagement.message_147205` | TaskManagementPage.tsx |
| 手動 | `taskManagement.short_613084` | TaskManagementPage.tsx |
| 毎時 | `taskManagement.short_779428` | TaskManagementPage.tsx |
| 毎日 | `taskManagement.short_593784` | TaskManagementPage.tsx |
| 毎週 | `taskManagement.short_576654` | TaskManagementPage.tsx |
| 次回実行 | `taskManagement.short_231914` | TaskManagementPage.tsx |
| 実行統計 | `taskManagement.short_148025` | TaskManagementPage.tsx |
| 有効/無効 | `taskManagement.short_184973` | TaskManagementPage.tsx |
| このタスクを削除しますか？ | `taskManagement.promptMessage` | TaskManagementPage.tsx |
| 削除 | `taskManagement.short_876283` | TaskManagementPage.tsx |
| キャンセル | `taskManagement.short_979700` | TaskManagementPage.tsx |
| 総タスク数 | `taskManagement.short_171288` | TaskManagementPage.tsx |
| 総数 ${total} 件 | `taskManagement.message_087056` | TaskManagementPage.tsx |
| タスク編集 | `taskManagement.short_130185` | TaskManagementPage.tsx |
| 新規タスク作成 | `taskManagement.message_004779` | TaskManagementPage.tsx |
| タスク名を入力してください | `taskManagement.message_730096` | TaskManagementPage.tsx |
| 例: GitHub Trending Daily Sync | `taskManagement.message_623029` | TaskManagementPage.tsx |
| データソースを選択してください | `taskManagement.message_270296` | TaskManagementPage.tsx |
| データソースを選択 | `taskManagement.message_758235` | TaskManagementPage.tsx |
| 実行頻度 | `taskManagement.short_187169` | TaskManagementPage.tsx |
| 次回実行時刻 | `taskManagement.message_606914` | TaskManagementPage.tsx |
| 有効化 | `taskManagement.short_222506` | TaskManagementPage.tsx |
| 有効 | `taskManagement.short_164591` | TaskManagementPage.tsx |
| 無効 | `taskManagement.short_665781` | TaskManagementPage.tsx |

### trends (51 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 语言模型 | `trends.modelMessage` | TrendsPage.tsx |
| 图像识别 | `trends.short_841584` | TrendsPage.tsx |
| 语音技术 | `trends.short_545807` | TrendsPage.tsx |
| 语音 | `trends.short_701694` | TrendsPage.tsx |
| 音频 | `trends.short_388062` | TrendsPage.tsx |
| 多模态AI | `trends.short_705475` | TrendsPage.tsx |
| 多模态 | `trends.short_620611` | TrendsPage.tsx |
| 神经网络 | `trends.short_616191` | TrendsPage.tsx |
| 最新旗舰模型，推理和多模态能力大幅提升 | `trends.modelMessage` | TrendsPage.tsx |
| 实时多模态交互，音频处理能力强 | `trends.message_033384` | TrendsPage.tsx |
| 代码生成和复杂推理的顶级表现 | `trends.message_886347` | TrendsPage.tsx |
| 速度和效率优化，多模态集成 | `trends.message_947703` | TrendsPage.tsx |
| 开源模型性能新高度，成本效益突出 | `trends.modelMessage` | TrendsPage.tsx |
| 阿里云 | `trends.short_895745` | TrendsPage.tsx |
| 中文理解和推理能力业界领先 | `trends.message_265501` | TrendsPage.tsx |
| 深度推理模型，科学和数学问题解决能力强 | `trends.modelMessage` | TrendsPage.tsx |
| 开源模型新星，编程和推理能力突出 | `trends.modelMessage` | TrendsPage.tsx |
| 编程语言 | `trends.short_295499` | TrendsPage.tsx |
| 项目数量 | `trends.short_462360` | TrendsPage.tsx |
| ${text}个 | `trends.message_246754` | TrendsPage.tsx |
| 最热编程语言 | `trends.message_743934` | TrendsPage.tsx |
| 最活跃AI领域 | `trends.message_334218` | TrendsPage.tsx |
| 顶级LLM模型 | `trends.modelMessage` | TrendsPage.tsx |
| (${llmModels[0]?.capability || | `trends.message_351938` | TrendsPage.tsx |
| 增长最快 | `trends.short_322995` | TrendsPage.tsx |
| 编程语言热度排行 | `trends.message_142775` | TrendsPage.tsx |
| 7天 | `trends.short_155511` | TrendsPage.tsx |
| 30天 | `trends.short_867168` | TrendsPage.tsx |
| 90天 | `trends.short_920463` | TrendsPage.tsx |
| 语言趋势详情 | `trends.message_347608` | TrendsPage.tsx |
| AI领域活跃度分布 | `trends.message_908791` | TrendsPage.tsx |
| 领域热点关键词 | `trends.message_651844` | TrendsPage.tsx |
| 大语言模型能力与热度对比 | `trends.modelMessage` | TrendsPage.tsx |
| 排名 | `trends.short_536334` | TrendsPage.tsx |
| 模型名称 | `trends.modelMessage` | TrendsPage.tsx |
| 能力评分 | `trends.short_725719` | TrendsPage.tsx |
| 社区热度 | `trends.short_246849` | TrendsPage.tsx |
| 特点描述 | `trends.short_017697` | TrendsPage.tsx |
| 🚀 下一个崛起方向预测 | `trends.message_956353` | TrendsPage.tsx |
| 文本、图像、音频融合，GPT-4o引领趋势 | `trends.message_350384` | TrendsPage.tsx |
| 智能体将成为AI应用的主流形态 | `trends.message_715039` | TrendsPage.tsx |
| 端侧AI | `trends.short_500297` | TrendsPage.tsx |
| 本地部署的小模型将快速发展 | `trends.modelMessage` | TrendsPage.tsx |
| 代码生成 | `trends.short_730532` | TrendsPage.tsx |
| AI编程助手将重塑开发流程 | `trends.message_296047` | TrendsPage.tsx |
| 🔥 热门工具生态 | `trends.message_601111` | TrendsPage.tsx |
| LLM框架 | `trends.short_740068` | TrendsPage.tsx |
| AI编程 | `trends.short_856799` | TrendsPage.tsx |
| 图像生成 | `trends.short_612947` | TrendsPage.tsx |
| 向量数据库 | `trends.short_412101` | TrendsPage.tsx |

_...还有 1 项_

### zenn (4 项)

| 中文 | 建议Key | 来源文件 |
|------|---------|----------|
| 关于这篇Zenn文章  | `zenn.message_867064` | ZennPage.tsx |
| 匿名 | `zenn.short_175800` | ZennPage.tsx |
| 文章链接不可用 | `zenn.message_579105` | ZennPage.tsx |
| 问一下关于这篇文章的问题... | `zenn.message_520957` | ZennPage.tsx |

## 🛠️ 迁移步骤

### 步骤1: 扩展 translations.ts

为每个模块添加新的翻译key。参考生成的 `translation_additions.json`

### 步骤2: 修改源文件

对于每个文件:

1. 确认文件已导入 `useLanguage` hook
2. 使用 `t('category.key')` 替换硬编码文本
3. 测试中英日三种语言的显示

### 步骤3: 验证和测试

1. 运行应用,切换语言验证
2. 检查是否有遗漏的硬编码
3. 确保所有UI元素都能正确切换语言

## 💡 代码修改示例

### 修改前

```typescript
message.success('保存成功！');
const title = '系统设置';
```

### 修改后

```typescript
import { useLanguage } from '../contexts/LanguageContext';

const { t } = useLanguage();
message.success(t('settings.saveSuccess'));
const title = t('settings.title');
```

## ⏱️ 工作量估算

- **翻译工作**: 约 363 个文本 × 2语言 = 726 条翻译
- **代码修改**: 约 22 个文件需要修改
- **预计时间**: 
  - 翻译: 约 12 小时 (假设每分钟翻译1条)
  - 代码修改: 约 11.0 小时 (假设每文件30分钟)
  - 测试验证: 约 2-3 小时
  - **总计**: 约 25.5 小时

