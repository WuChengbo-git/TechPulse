# 国际化缺失扫描报告

## 📊 扫描统计

- **扫描文件总数**: 42
- **包含硬编码的文件**: 20
- **硬编码文本总数**: 249
- **中文文本**: 238
- **日文文本**: 38

## 📂 按模块分类

### PAGES (12 文件, 207 处硬编码)

#### `pages/TaskManagementPage.tsx` (47 处)

1. **第 123 行**: `待機中`
   ```typescript
   pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待機中' },
   ```

2. **第 124 行**: `実行中`
   ```typescript
   running: { color: 'processing', icon: <SyncOutlined spin />, text: '実行中' },
   ```

3. **第 125 行**: `完了`
   ```typescript
   completed: { color: 'success', icon: <CheckCircleOutlined />, text: '完了' },
   ```

4. **第 126 行**: `失敗`
   ```typescript
   failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失敗' },
   ```

5. **第 127 行**: `一時停止`
   ```typescript
   paused: { color: 'warning', icon: <PauseCircleOutlined />, text: '一時停止' }
   ```

6. **第 139 行**: `全データ源`
   ```typescript
   all: { color: 'green', text: '全データ源' }
   ```

7. **第 146 行**: `タスクを実行中...`
   ```typescript
   message.loading({ content: 'タスクを実行中...', key: 'run' })
   ```

8. **第 149 行**: `タスクを開始しました`
   ```typescript
   message.success({ content: 'タスクを開始しました', key: 'run' })
   ```

9. **第 156 行**: `タスクを一時停止しました`
   ```typescript
   message.success('タスクを一時停止しました')
   ```

10. **第 162 行**: `タスクを削除しました`
   ```typescript
   message.success('タスクを削除しました')
   ```

   _...还有 37 处硬编码_

#### `pages/SystemConfig.tsx` (43 处)

1. **第 81 行**: `加载配置失败: ${error.message}`
   ```typescript
   message.error(`加载配置失败: ${error.message}`)
   ```

2. **第 109 行**: `配置验证通过`
   ```typescript
   message.success('配置验证通过')
   ```

3. **第 111 行**: `配置存在 ${result.errors.length} 个错误`
   ```typescript
   message.warning(`配置存在 ${result.errors.length} 个错误`)
   ```

4. **第 114 行**: `验证失败: ${error.message}`
   ```typescript
   message.error(`验证失败: ${error.message}`)
   ```

5. **第 125 行**: `没有修改需要保存`
   ```typescript
   message.info('没有修改需要保存')
   ```

6. **第 135 行**: `成功更新 ${result.updated_keys.length} 个配置项`
   ```typescript
   message.success(`成功更新 ${result.updated_keys.length} 个配置项`)
   ```

7. **第 139 行**: `保存失败: ${error.message}`
   ```typescript
   message.error(`保存失败: ${error.message}`)
   ```

8. **第 153 行**: `配置已重新加载`
   ```typescript
   message.success('配置已重新加载')
   ```

9. **第 155 行**: `重载失败: ${error.message}`
   ```typescript
   message.error(`重载失败: ${error.message}`)
   ```

10. **第 169 行**: `已恢复默认配置`
   ```typescript
   message.success('已恢复默认配置')
   ```

   _...还有 33 处硬编码_

#### `pages/SystemStatusPage.tsx` (23 处)

1. **第 133 行**: `正常`
   ```typescript
   healthy: { status: 'success' as const, icon: <CheckCircleOutlined />, text: '正常' },
   ```

2. **第 134 行**: `警告`
   ```typescript
   warning: { status: 'warning' as const, icon: <WarningOutlined />, text: '警告' },
   ```

3. **第 135 行**: `エラー`
   ```typescript
   error: { status: 'error' as const, icon: <CloseCircleOutlined />, text: 'エラー' }
   ```

4. **第 143 行**: `サービス名`
   ```typescript
   title: 'サービス名',
   ```

5. **第 149 行**: `ステータス`
   ```typescript
   title: 'ステータス',
   ```

6. **第 155 行**: `応答時間`
   ```typescript
   title: '応答時間',
   ```

7. **第 164 行**: `稼働率`
   ```typescript
   title: '稼働率',
   ```

8. **第 183 行**: `最終確認`
   ```typescript
   title: '最終確認',
   ```

9. **第 192 行**: `API名`
   ```typescript
   title: 'API名',
   ```

10. **第 198 行**: `今日の使用量`
   ```typescript
   title: '今日の使用量',
   ```

   _...还有 13 处硬编码_

#### `pages/ArxivPage.tsx` (23 处)

1. **第 64 行**: `AI・Machine Learning`
   ```typescript
   'cs.AI': 'AI・Machine Learning',
   ```

2. **第 142 行**: `获取arXiv数据失败`
   ```typescript
   message.error('获取arXiv数据失败')
   ```

3. **第 178 行**: `关于这篇arXiv论文 `
   ```typescript
   message: `关于这篇arXiv论文 "${selectedPaper.title}"，${userMessage}`,
   ```

4. **第 193 行**: `抱歉，我无法回答这个问题。`
   ```typescript
   ai: data.response || '抱歉，我无法回答这个问题。'
   ```

5. **第 197 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

6. **第 201 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

7. **第 245 行**: `机器学习`
   ```typescript
   paperCategories.some(cat => cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能')))) ||
   ```

8. **第 245 行**: `人工智能`
   ```typescript
   paperCategories.some(cat => cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能')))) ||
   ```

9. **第 251 行**: `计算机视觉`
   ```typescript
   paperCategories.some(cat => cat && (cat.includes('计算机视觉') || cat.includes('computer vision') || cat.includes('cv')))) ||
   ```

10. **第 252 行**: `视觉`
   ```typescript
   (paper.summary && (paper.summary.toLowerCase().includes('vision') || paper.summary.toLowerCase().includes('视觉')))
   ```

   _...还有 13 处硬编码_

#### `pages/HuggingFacePage.tsx` (22 处)

1. **第 68 行**: `文本生成`
   ```typescript
   'text-generation': '文本生成',
   ```

2. **第 69 行**: `文本分类`
   ```typescript
   'text-classification': '文本分类',
   ```

3. **第 70 行**: `标记分类`
   ```typescript
   'token-classification': '标记分类',
   ```

4. **第 71 行**: `问答系统`
   ```typescript
   'question-answering': '问答系统',
   ```

5. **第 72 行**: `填充遮罩`
   ```typescript
   'fill-mask': '填充遮罩',
   ```

6. **第 73 行**: `文本摘要`
   ```typescript
   'summarization': '文本摘要',
   ```

7. **第 74 行**: `机器翻译`
   ```typescript
   'translation': '机器翻译',
   ```

8. **第 75 行**: `文本到文本生成`
   ```typescript
   'text2text-generation': '文本到文本生成',
   ```

9. **第 76 行**: `对话系统`
   ```typescript
   'conversational': '对话系统',
   ```

10. **第 77 行**: `图像分类`
   ```typescript
   'image-classification': '图像分类',
   ```

   _...还有 12 处硬编码_

#### `pages/ZennPage.tsx` (16 处)

1. **第 87 行**: `关于这篇Zenn文章 `
   ```typescript
   message: `关于这篇Zenn文章 "${selectedArticle.title}"，${userMessage}`,
   ```

2. **第 102 行**: `抱歉，我无法回答这个问题。`
   ```typescript
   ai: data.response || '抱歉，我无法回答这个问题。'
   ```

3. **第 106 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

4. **第 110 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

5. **第 132 行**: `匿名`
   ```typescript
   author_name: article.author_name || '匿名',
   ```

6. **第 144 行**: `匿名`
   ```typescript
   const author = article.author_name || '匿名'
   ```

7. **第 364 行**: `文章链接不可用`
   ```typescript
   message.warning('文章链接不可用')
   ```

8. **第 386 行**: `无标题`
   ```typescript
   <Text strong>{article.title || '无标题'}</Text>
   ```

9. **第 411 行**: `匿名`
   ```typescript
   Author: {article.author_name || '匿名'}
   ```

10. **第 415 行**: `暂无摘要`
   ```typescript
   {article.content_excerpt || '暂无摘要'}
   ```

   _...还有 6 处硬编码_

#### `pages/TrendsPage.tsx` (11 处)

1. **第 212 行**: `大语言模型`
   ```typescript
   keywords: ['llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'qwen', 'transformer', 'bert', 'language model', 'nlp', 'natural language', '大语言模型', '语言模型', 'instruct', 'chat', 'openai', 'anthropic', 'mistral', 'phi', 'qwen2', 'baichuan', 'text-generation', 'chat-completion'],
   ```

2. **第 212 行**: `语言模型`
   ```typescript
   keywords: ['llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'qwen', 'transformer', 'bert', 'language model', 'nlp', 'natural language', '大语言模型', '语言模型', 'instruct', 'chat', 'openai', 'anthropic', 'mistral', 'phi', 'qwen2', 'baichuan', 'text-generation', 'chat-completion'],
   ```

3. **第 218 行**: `计算机视觉`
   ```typescript
   keywords: ['computer vision', 'cv', 'opencv', 'yolo', 'object detection', 'image recognition', 'cnn', 'vision', 'stable diffusion', 'midjourney', '计算机视觉', '图像识别', 'image', 'visual', 'resnet', 'vgg', 'efficientnet', 'segmentation', 'face recognition', 'ocr', 'diffusion', 'gan'],
   ```

4. **第 218 行**: `图像识别`
   ```typescript
   keywords: ['computer vision', 'cv', 'opencv', 'yolo', 'object detection', 'image recognition', 'cnn', 'vision', 'stable diffusion', 'midjourney', '计算机视觉', '图像识别', 'image', 'visual', 'resnet', 'vgg', 'efficientnet', 'segmentation', 'face recognition', 'ocr', 'diffusion', 'gan'],
   ```

5. **第 224 行**: `语音`
   ```typescript
   keywords: ['speech', 'voice', 'audio', 'tts', 'stt', 'whisper', 'speech recognition', 'voice synthesis', '语音', '音频', 'asr', 'wav2vec', 'speech-to-text', 'text-to-speech', 'audio-classification', 'speech-processing'],
   ```

6. **第 224 行**: `音频`
   ```typescript
   keywords: ['speech', 'voice', 'audio', 'tts', 'stt', 'whisper', 'speech recognition', 'voice synthesis', '语音', '音频', 'asr', 'wav2vec', 'speech-to-text', 'text-to-speech', 'audio-classification', 'speech-processing'],
   ```

7. **第 230 行**: `多模态`
   ```typescript
   keywords: ['multimodal', 'vision-language', 'clip', 'dall-e', 'gpt-4v', 'multimodal ai', 'cross-modal', '多模态', 'vision language', 'vilt', 'blip', 'flamingo', 'align', 'vlm'],
   ```

8. **第 236 行**: `机器学习`
   ```typescript
   keywords: ['machine learning', 'ml', 'scikit-learn', 'xgboost', 'random forest', 'svm', 'clustering', '机器学习', 'sklearn', 'gradient boosting', 'decision tree', 'classification', 'regression', 'ensemble'],
   ```

9. **第 242 行**: `深度学习`
   ```typescript
   keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'lstm', '深度学习', '神经网络', 'neural', 'backpropagation', 'gradient descent', 'attention', 'autoencoder', 'gru'],
   ```

10. **第 242 行**: `神经网络`
   ```typescript
   keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'lstm', '深度学习', '神经网络', 'neural', 'backpropagation', 'gradient descent', 'attention', 'autoencoder', 'gru'],
   ```

   _...还有 1 处硬编码_

#### `pages/GitHubPage.tsx` (8 处)

1. **第 83 行**: `关于这个GitHub仓库 `
   ```typescript
   message: `关于这个GitHub仓库 "${selectedRepo.title}"，${userMessage}`,
   ```

2. **第 99 行**: `抱歉，我无法回答这个问题。`
   ```typescript
   ai: data.response || '抱歉，我无法回答这个问题。'
   ```

3. **第 103 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

4. **第 107 行**: `发送消息失败`
   ```typescript
   message.error('发送消息失败')
   ```

5. **第 360 行**: `仓库链接不可用`
   ```typescript
   message.warning('仓库链接不可用')
   ```

6. **第 561 行**: `未知`
   ```typescript
   <Text>{selectedRepo.created_at ? new Date(selectedRepo.created_at).toLocaleDateString() : '未知'}</Text>
   ```

7. **第 569 行**: `暂无描述`
   ```typescript
   {selectedRepo.description || selectedRepo.summary || '暂无描述'}
   ```

8. **第 634 行**: `问一下关于这个仓库的问题...`
   ```typescript
   placeholder="问一下关于这个仓库的问题..."
   ```

#### `pages/Login.tsx` (6 处)

1. **第 65 行**: `认证错误:`
   ```typescript
   console.error('认证错误:', error);
   ```

2. **第 66 行**: `错误响应:`
   ```typescript
   console.error('错误响应:', error.response);
   ```

3. **第 74 行**: `用户名或密码错误`
   ```typescript
   errorMsg = '用户名或密码错误';
   ```

4. **第 76 行**: `请求参数错误`
   ```typescript
   errorMsg = error.response.data?.detail || '请求参数错误';
   ```

5. **第 78 行**: `服务器错误，请稍后重试`
   ```typescript
   errorMsg = '服务器错误，请稍后重试';
   ```

6. **第 80 行**: `网络错误: ${error.message}`
   ```typescript
   errorMsg = `网络错误: ${error.message}`;
   ```

#### `pages/Analytics.tsx` (4 处)

1. **第 229 行**: `数量`
   ```typescript
   count: { alias: '数量' }
   ```

2. **第 242 行**: `日付`
   ```typescript
   date: { alias: '日付' },
   ```

3. **第 243 行**: `数量`
   ```typescript
   count: { alias: '数量' },
   ```

4. **第 322 行**: `人気技術`
   ```typescript
   title="人気技術"
   ```

#### `pages/Dashboard.tsx` (3 处)

1. **第 156 行**: `语言已切换为${languages[language]?.name}`
   ```typescript
   message.success(`语言已切换为${languages[language]?.name}`)
   ```

2. **第 180 行**: `翻译结果`
   ```typescript
   title: '翻译结果',
   ```

3. **第 296 行**: `已保存到Notion！`
   ```typescript
   message.success('已保存到Notion！')
   ```

#### `pages/LLMProvidersPage.tsx` (1 处)

1. **第 558 行**: `请输入${field.label}`
   ```typescript
   rules={[{ required: field.required, message: `请输入${field.label}` }]}
   ```

### COMPONENTS (6 文件, 36 处硬编码)

#### `components/RecommendationPanel.tsx` (11 处)

1. **第 83 行**: `加载推荐失败`
   ```typescript
   message.error(t('recommendation.loadError') || '加载推荐失败')
   ```

2. **第 127 行**: `已收藏`
   ```typescript
   message.success(t('recommendation.favoriteSuccess') || '已收藏')
   ```

3. **第 130 行**: `收藏失败`
   ```typescript
   message.error(t('recommendation.favoriteError') || '收藏失败')
   ```

4. **第 146 行**: `为你推荐`
   ```typescript
   <span>{t('recommendation.title') || '为你推荐'}</span>
   ```

5. **第 154 行**: `还没有设置兴趣标签`
   ```typescript
   {t('recommendation.noPreferences') || '还没有设置兴趣标签'}
   ```

6. **第 162 行**: `请前往设置页面设置兴趣标签`
   ```typescript
   message.info(t('recommendation.goToSettings') || '请前往设置页面设置兴趣标签')
   ```

7. **第 165 行**: `设置兴趣`
   ```typescript
   {t('recommendation.setPreferences') || '设置兴趣'}
   ```

8. **第 180 行**: `为你推荐`
   ```typescript
   <span>{t('recommendation.title') || '为你推荐'}</span>
   ```

9. **第 191 行**: `换一批`
   ```typescript
   {t('recommendation.refresh') || '换一批'}
   ```

10. **第 200 行**: `你的兴趣`
   ```typescript
   🎯 {t('recommendation.yourInterests') || '你的兴趣'}: {userTags.join(', ')}
   ```

   _...还有 1 处硬编码_

#### `components/SmartSearch.tsx` (10 处)

1. **第 147 行**: `关键词`
   ```typescript
   { label: t('search.keywordMode') || '关键词', value: 'keyword', icon: <SearchOutlined /> },
   ```

2. **第 148 行**: `AI问答`
   ```typescript
   { label: t('search.aiMode') || 'AI问答', value: 'ai', icon: <RobotOutlined /> }
   ```

3. **第 161 行**: `清除历史`
   ```typescript
   {t('search.clearHistory') || '清除历史'}
   ```

4. **第 179 行**: `搜索技术内容...`
   ```typescript
   ? (t('search.keywordPlaceholder') || '搜索技术内容...')
   ```

5. **第 180 行**: `问我任何技术问题...`
   ```typescript
   : (t('search.aiPlaceholder') || '问我任何技术问题...'))
   ```

6. **第 201 行**: `试试这些`
   ```typescript
   💡 {t('search.trySuggestions') || '试试这些'}:
   ```

7. **第 224 行**: `AI模式示例`
   ```typescript
   🤖 {t('search.aiHints') || 'AI模式示例'}:
   ```

8. **第 227 行**: `今天LLM有什么新突破？`
   ```typescript
   • {t('search.aiExample1') || '今天LLM有什么新突破？'}
   ```

9. **第 230 行**: `推荐一些AI Agent框架`
   ```typescript
   • {t('search.aiExample2') || '推荐一些AI Agent框架'}
   ```

10. **第 233 行**: `什么是LoRA量化技术？`
   ```typescript
   • {t('search.aiExample3') || '什么是LoRA量化技术？'}
   ```

#### `components/SearchResultList.tsx` (7 处)

1. **第 73 行**: `没有找到相关内容`
   ```typescript
   description={t('search.noResults') || '没有找到相关内容'}
   ```

2. **第 85 行**: `找到`
   ```typescript
   {t('search.foundResults') || '找到'} <strong>{totalCount}</strong> {t('search.results') || '条结果'}
   ```

3. **第 85 行**: `条结果`
   ```typescript
   {t('search.foundResults') || '找到'} <strong>{totalCount}</strong> {t('search.results') || '条结果'}
   ```

4. **第 89 行**: `🧠 分析模式`
   ```typescript
   {intent === 'analyze' ? '🧠 分析模式' : '🔍 查询模式'}
   ```

5. **第 89 行**: `🔍 查询模式`
   ```typescript
   {intent === 'analyze' ? '🧠 分析模式' : '🔍 查询模式'}
   ```

6. **第 123 行**: `相关度`
   ```typescript
   {t('search.relevance') || '相关度'}: {(result.score * 100).toFixed(0)}%
   ```

7. **第 144 行**: `更多`
   ```typescript
   ellipsis={{ rows: 2, expandable: true, symbol: t('common.more') || '更多' }}
   ```

#### `components/QualityBadge.tsx` (5 处)

1. **第 22 行**: `优秀`
   ```typescript
   if (score >= 8.5) return '优秀';
   ```

2. **第 23 行**: `良好`
   ```typescript
   if (score >= 7.0) return '良好';
   ```

3. **第 24 行**: `中等`
   ```typescript
   if (score >= 5.0) return '中等';
   ```

4. **第 25 行**: `一般`
   ```typescript
   if (score >= 3.0) return '一般';
   ```

5. **第 26 行**: `较低`
   ```typescript
   return '较低';
   ```

#### `components/LanguageSelector.tsx` (2 处)

1. **第 17 行**: `简体中文`
   ```typescript
   { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
   ```

2. **第 19 行**: `日本語`
   ```typescript
   { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
   ```

#### `components/Sidebar.tsx` (1 处)

1. **第 73 行**: `LLM模型管理`
   ```typescript
   { key: 'llm-providers', icon: <CloudOutlined />, label: 'LLM模型管理' },
   ```

### UTILS (1 文件, 1 处硬编码)

#### `utils/translateTags.ts` (1 处)

1. **第 71 行**: `翻译失败:`
   ```typescript
   console.error('翻译失败:', error);
   ```

### OTHERS (1 文件, 5 处硬编码)

#### `App.tsx` (5 处)

1. **第 119 行**: `欢迎使用 TechPulse！我们将根据你的偏好推荐内容 🎉`
   ```typescript
   message.success('欢迎使用 TechPulse！我们将根据你的偏好推荐内容 🎉')
   ```

2. **第 125 行**: `你可以随时在个人中心完成偏好设置`
   ```typescript
   message.info('你可以随时在个人中心完成偏好设置')
   ```

3. **第 159 行**: `LLM模型管理`
   ```typescript
   'llm-providers': [t('nav.systemManagement'), 'LLM模型管理'],
   ```

4. **第 287 行**: `简体中文`
   ```typescript
   label: '简体中文',
   ```

5. **第 297 行**: `日本語`
   ```typescript
   label: '日本語',
   ```

## 🎯 修复优先级建议

根据使用频率和影响范围,建议按以下优先级修复:

### 高优先级 (硬编码数量最多的文件)

1. `pages/TaskManagementPage.tsx` - 47 处硬编码
2. `pages/SystemConfig.tsx` - 43 处硬编码
3. `pages/SystemStatusPage.tsx` - 23 处硬编码
4. `pages/ArxivPage.tsx` - 23 处硬编码
5. `pages/HuggingFacePage.tsx` - 22 处硬编码
6. `pages/ZennPage.tsx` - 16 处硬编码
7. `pages/TrendsPage.tsx` - 11 处硬编码
8. `components/RecommendationPanel.tsx` - 11 处硬编码
9. `components/SmartSearch.tsx` - 10 处硬编码
10. `pages/GitHubPage.tsx` - 8 处硬编码

### 建议修复顺序

1. **Pages** - 用户直接看到的页面,影响最大
2. **Components** - 复用组件,修改一次影响多处
3. **Services** - 错误消息和提示
4. **Utils** - 工具函数中的文本
