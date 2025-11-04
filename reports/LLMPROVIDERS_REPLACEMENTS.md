# LLMProvidersPage.tsx 国际化替换清单

## 需要的代码修改

### 1. 添加导入 (文件开头)

```typescript
// 在其他imports之后添加:
import { useLanguage } from '../contexts/LanguageContext'
```

### 2. 在组件内添加hook (组件开头)

```typescript
const LLMProvidersPage: React.FC = () => {
  const { t } = useLanguage()  // 添加这一行
  // ... 其他state
```

### 3. 批量替换映射表

| 原硬编码文本 | 替换为 | 行号参考 |
|-------------|--------|----------|
| `'加载提供商列表失败'` | `t('llmProviders.loadProvidersFailed')` | ~70 |
| `'加载模型列表失败'` | `t('llmProviders.loadModelsFailed')` | ~82 |
| `'请先选择提供商类型'` | `t('llmProviders.selectProviderTypeFirst')` | ~149, ~187 |
| `'测试连接失败'` | `t('llmProviders.testConnectionFailed')` | ~175 |
| `'无法找到提供商模板'` | `t('llmProviders.providerTemplateNotFound')` | ~198 |
| `'提供商更新成功'` | `t('llmProviders.providerUpdatedSuccess')` | ~218 |
| `'提供商创建成功'` | `t('llmProviders.providerCreatedSuccess')` | ~229 |
| `'请填写必填字段'` | `t('llmProviders.fillRequiredFields')` | ~236 |
| `'保存失败'` | `t('llmProviders.saveFailed')` | ~238 |
| `'提供商删除成功'` | `t('llmProviders.providerDeletedSuccess')` | ~251 |
| `'删除失败'` | `t('llmProviders.deleteFailed')` | ~253, ~275 |
| `'模型添加成功'` | `t('llmProviders.modelAddedSuccess')` | ~264 |
| `'保存模型失败'` | `t('llmProviders.saveModelFailed')` | ~266 |
| `'模型删除成功'` | `t('llmProviders.modelDeletedSuccess')` | ~273 |
| `'提供商名称'` | `t('llmProviders.providerName')` | ~290 |
| `'类型'` | `t('llmProviders.type')` | ~297 |
| `'自定义'` | `t('llmProviders.custom')` | ~305 |
| `'状态'` | `t('llmProviders.status')` | ~318 |
| `'启用'` | `t('llmProviders.enabled')` | ~322, ~549 |
| `'禁用'` | `t('llmProviders.disabled')` | ~322, ~550 |
| `'连接正常'` | `t('llmProviders.connectionNormal')` | ~330 |
| `'连接失败'` | `t('llmProviders.connectionFailed')` | ~333 |
| `'操作'` | `t('llmProviders.actions')` | ~345 |
| `'编辑'` | `t('llmProviders.edit')` | ~350, ~672 |
| `'删除'` | `t('llmProviders.delete')` | ~359, ~683 |
| `'管理'` | `t('llmProviders.manage')` | ~349 |
| `'测试连接'` | `t('llmProviders.testConnection')` | ~355 |
| `'确定删除此提供商吗？'` | `t('llmProviders.deleteProviderConfirm')` | ~361 |
| `'删除后将同时删除该提供商下的所有模型配置'` | `t('llmProviders.deleteProviderWarning')` | ~362 |
| `'确定删除此模型吗？'` | `t('llmProviders.deleteModelConfirm')` | ~678 |
| `'模型名称'` | `t('llmProviders.modelName')` | ~419, ~658 |
| `'显示名称'` | `t('llmProviders.displayName')` | ~423, ~664 |
| `'最大Token'` | `t('llmProviders.maxTokens')` | ~428 |
| `'上下文窗口'` | `t('llmProviders.contextWindow')` | ~434 |
| `'添加模型'` | `t('llmProviders.addModel')` | ~443, ~467, ~706 |
| `'快速添加'` | `t('llmProviders.quickAdd')` | ~461, ~697 |
| `'暂无提供商，点击'` | `t('llmProviders.noProviders')` | ~479 |
| `'开始配置'` | `t('llmProviders.startConfig')` | ~480 |
| `'暂无模型，点击'` | `t('llmProviders.noModels')` | ~499 |
| `'或使用快速添加'` | `t('llmProviders.orQuickAdd')` | ~503 |
| `'编辑提供商'` | `t('llmProviders.editProvider')` | ~509 |
| `'添加提供商'` | `t('llmProviders.addProvider')` | ~509, ~476 |
| `'提供商模型'` | `t('llmProviders.providerModels')` | ~642 |
| `'保存'` | `t('llmProviders.save')` | ~611, ~712 |
| `'提供商类型'` | `t('llmProviders.providerType')` | ~519 |
| `'请选择提供商类型'` | `t('llmProviders.selectProviderType')` | ~521 |
| `'选择提供商类型'` | `t('llmProviders.chooseProviderType')` | ~524 |
| `'云端提供商'` | `t('llmProviders.cloudProvider')` | ~530 |
| `'本地提供商'` | `t('llmProviders.localProvider')` | ~538 |
| `'请输入提供商名称'` | `t('llmProviders.inputProviderName')` | ~553 |
| `'例如：我的OpenAI'` | `t('llmProviders.exampleOpenAI')` | ~554 |
| `'例如：gpt-4o'` | `t('llmProviders.exampleGPT4')` | ~661 |
| `'例如：GPT-4o'` | `t('llmProviders.exampleGPT4Display')` | ~667 |
| `'最大Token数'` | `t('llmProviders.maxTokenCount')` | ~671 |

## 快速执行

由于该文件有71处硬编码,建议使用自动化脚本进行批量替换,而非手动逐个修改。

## 验证清单

完成后检查:
- [ ] 文件顶部已添加 `import { useLanguage } from '../contexts/LanguageContext'`
- [ ] 组件内已添加 `const { t } = useLanguage()`
- [ ] 所有message.error/success/warning使用t()
- [ ] 所有UI文本(按钮、标签、标题)使用t()
- [ ] 所有表单placeholder和验证消息使用t()
- [ ] 测试三种语言切换正常
