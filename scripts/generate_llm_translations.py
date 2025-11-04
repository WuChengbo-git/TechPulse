#!/usr/bin/env python3
"""
为 LLMProvidersPage.tsx 生成翻译内容
"""

# LLMProvidersPage 的中文文本
llm_texts_zh = {
    # 错误消息
    'loadProvidersFailed': '加载提供商列表失败',
    'loadModelsFailed': '加载模型列表失败',
    'selectProviderTypeFirst': '请先选择提供商类型',
    'testConnectionFailed': '测试连接失败',
    'providerTemplateNotFound': '无法找到提供商模板',
    'providerUpdatedSuccess': '提供商更新成功',
    'providerCreatedSuccess': '提供商创建成功',
    'fillRequiredFields': '请填写必填字段',
    'saveFailed': '保存失败',
    'providerDeletedSuccess': '提供商删除成功',
    'deleteFailed': '删除失败',
    'modelAddedSuccess': '模型添加成功',
    'saveModelFailed': '保存模型失败',
    'modelDeletedSuccess': '模型删除成功',
    'deleteModelFailed': '删除模型失败',

    # 表格列
    'providerName': '提供商名称',
    'type': '类型',
    'custom': '自定义',
    'status': '状态',
    'enabled': '启用',
    'disabled': '禁用',
    'connectionNormal': '连接正常',
    'connectionFailed': '连接失败',
    'actions': '操作',
    'edit': '编辑',
    'delete': '删除',
    'manage': '管理',
    'testConnection': '测试连接',

    # 删除确认
    'deleteProviderConfirm': '确定删除此提供商吗？',
    'deleteProviderWarning': '删除后将同时删除该提供商下的所有模型配置',
    'deleteModelConfirm': '确定删除此模型吗？',

    # 模型相关
    'modelName': '模型名称',
    'displayName': '显示名称',
    'maxTokens': '最大Token',
    'contextWindow': '上下文窗口',
    'addModel': '添加模型',
    'quickAdd': '快速添加',

    # 空状态
    'noProviders': '暂无提供商，点击',
    'startConfig': '开始配置',
    'noModels': '暂无模型，点击',
    'orQuickAdd': '或使用快速添加',

    # 模态框标题
    'editProvider': '编辑提供商',
    'addProvider': '添加提供商',
    'providerModels': '提供商模型',

    # 表单
    'save': '保存',
    'cancel': '取消',
    'providerType': '提供商类型',
    'selectProviderType': '请选择提供商类型',
    'chooseProviderType': '选择提供商类型',
    'cloudProvider': '云端提供商',
    'localProvider': '本地提供商',
    'inputProviderName': '请输入提供商名称',
    'exampleOpenAI': '例如：我的OpenAI',
    'inputPlaceholder': '请输入{field}',
    'exampleGPT4': '例如：gpt-4o',
    'exampleGPT4Display': '例如：GPT-4o',
    'maxTokenCount': '最大Token数',
}

# 英文翻译
llm_texts_en = {
    # Error messages
    'loadProvidersFailed': 'Failed to load provider list',
    'loadModelsFailed': 'Failed to load model list',
    'selectProviderTypeFirst': 'Please select provider type first',
    'testConnectionFailed': 'Connection test failed',
    'providerTemplateNotFound': 'Provider template not found',
    'providerUpdatedSuccess': 'Provider updated successfully',
    'providerCreatedSuccess': 'Provider created successfully',
    'fillRequiredFields': 'Please fill required fields',
    'saveFailed': 'Save failed',
    'providerDeletedSuccess': 'Provider deleted successfully',
    'deleteFailed': 'Delete failed',
    'modelAddedSuccess': 'Model added successfully',
    'saveModelFailed': 'Failed to save model',
    'modelDeletedSuccess': 'Model deleted successfully',
    'deleteModelFailed': 'Failed to delete model',

    # Table columns
    'providerName': 'Provider Name',
    'type': 'Type',
    'custom': 'Custom',
    'status': 'Status',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    'connectionNormal': 'Connection Normal',
    'connectionFailed': 'Connection Failed',
    'actions': 'Actions',
    'edit': 'Edit',
    'delete': 'Delete',
    'manage': 'Manage',
    'testConnection': 'Test Connection',

    # Delete confirmation
    'deleteProviderConfirm': 'Are you sure to delete this provider?',
    'deleteProviderWarning': 'All model configurations under this provider will also be deleted',
    'deleteModelConfirm': 'Are you sure to delete this model?',

    # Model related
    'modelName': 'Model Name',
    'displayName': 'Display Name',
    'maxTokens': 'Max Tokens',
    'contextWindow': 'Context Window',
    'addModel': 'Add Model',
    'quickAdd': 'Quick Add',

    # Empty state
    'noProviders': 'No providers yet, click',
    'startConfig': 'to start configuration',
    'noModels': 'No models yet, click',
    'orQuickAdd': 'or use quick add',

    # Modal titles
    'editProvider': 'Edit Provider',
    'addProvider': 'Add Provider',
    'providerModels': 'Provider Models',

    # Form
    'save': 'Save',
    'cancel': 'Cancel',
    'providerType': 'Provider Type',
    'selectProviderType': 'Please select provider type',
    'chooseProviderType': 'Choose Provider Type',
    'cloudProvider': 'Cloud Provider',
    'localProvider': 'Local Provider',
    'inputProviderName': 'Enter provider name',
    'exampleOpenAI': 'e.g., My OpenAI',
    'inputPlaceholder': 'Enter {field}',
    'exampleGPT4': 'e.g., gpt-4o',
    'exampleGPT4Display': 'e.g., GPT-4o',
    'maxTokenCount': 'Max Token Count',
}

# 日文翻译
llm_texts_ja = {
    # エラーメッセージ
    'loadProvidersFailed': 'プロバイダーリストの読み込みに失敗しました',
    'loadModelsFailed': 'モデルリストの読み込みに失敗しました',
    'selectProviderTypeFirst': '最初にプロバイダータイプを選択してください',
    'testConnectionFailed': '接続テストに失敗しました',
    'providerTemplateNotFound': 'プロバイダーテンプレートが見つかりません',
    'providerUpdatedSuccess': 'プロバイダーが正常に更新されました',
    'providerCreatedSuccess': 'プロバイダーが正常に作成されました',
    'fillRequiredFields': '必須フィールドを入力してください',
    'saveFailed': '保存に失敗しました',
    'providerDeletedSuccess': 'プロバイダーが正常に削除されました',
    'deleteFailed': '削除に失敗しました',
    'modelAddedSuccess': 'モデルが正常に追加されました',
    'saveModelFailed': 'モデルの保存に失敗しました',
    'modelDeletedSuccess': 'モデルが正常に削除されました',
    'deleteModelFailed': 'モデルの削除に失敗しました',

    # テーブル列
    'providerName': 'プロバイダー名',
    'type': 'タイプ',
    'custom': 'カスタム',
    'status': 'ステータス',
    'enabled': '有効',
    'disabled': '無効',
    'connectionNormal': '接続正常',
    'connectionFailed': '接続失敗',
    'actions': 'アクション',
    'edit': '編集',
    'delete': '削除',
    'manage': '管理',
    'testConnection': '接続テスト',

    # 削除確認
    'deleteProviderConfirm': 'このプロバイダーを削除してもよろしいですか？',
    'deleteProviderWarning': 'このプロバイダーのすべてのモデル構成も削除されます',
    'deleteModelConfirm': 'このモデルを削除してもよろしいですか？',

    # モデル関連
    'modelName': 'モデル名',
    'displayName': '表示名',
    'maxTokens': '最大トークン',
    'contextWindow': 'コンテキストウィンドウ',
    'addModel': 'モデルを追加',
    'quickAdd': 'クイック追加',

    # 空の状態
    'noProviders': 'プロバイダーがまだありません。クリック',
    'startConfig': '設定を開始',
    'noModels': 'モデルがまだありません。クリック',
    'orQuickAdd': 'またはクイック追加を使用',

    # モーダルタイトル
    'editProvider': 'プロバイダーを編集',
    'addProvider': 'プロバイダーを追加',
    'providerModels': 'プロバイダーモデル',

    # フォーム
    'save': '保存',
    'cancel': 'キャンセル',
    'providerType': 'プロバイダータイプ',
    'selectProviderType': 'プロバイダータイプを選択してください',
    'chooseProviderType': 'プロバイダータイプを選択',
    'cloudProvider': 'クラウドプロバイダー',
    'localProvider': 'ローカルプロバイダー',
    'inputProviderName': 'プロバイダー名を入力',
    'exampleOpenAI': '例：私のOpenAI',
    'inputPlaceholder': '{field}を入力してください',
    'exampleGPT4': '例：gpt-4o',
    'exampleGPT4Display': '例：GPT-4o',
    'maxTokenCount': '最大トークン数',
}

# 生成TypeScript格式
def generate_typescript():
    print("// llmProviders module for translations.ts")
    print("\n// 中文 (zh-CN)")
    print("llmProviders: {")
    for key, value in llm_texts_zh.items():
        print(f"  {key}: '{value}',")
    print("},")

    print("\n// 英文 (en-US)")
    print("llmProviders: {")
    for key, value in llm_texts_en.items():
        print(f"  {key}: '{value}',")
    print("},")

    print("\n// 日文 (ja-JP)")
    print("llmProviders: {")
    for key, value in llm_texts_ja.items():
        print(f"  {key}: '{value}',")
    print("},")

if __name__ == "__main__":
    generate_typescript()
