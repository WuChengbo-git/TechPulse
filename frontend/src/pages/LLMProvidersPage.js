import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * LLM 提供商管理页面
 * 列表式UI，通过模态框进行添加和编辑
 */
import { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, Switch, message, Popconfirm, Tooltip, Typography, Card, Tabs, InputNumber, Alert, Badge, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CloudOutlined, DesktopOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, ApiOutlined } from '@ant-design/icons';
import llmService, { ProviderType } from '../services/llmService';
import { useLanguage } from '../contexts/LanguageContext';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const LLMProvidersPage = () => {
    const { t } = useLanguage();
    const [providers, setProviders] = useState([]);
    const [templates, setTemplates] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modelModalVisible, setModelModalVisible] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [currentProviderModels, setCurrentProviderModels] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [testingConnection, setTestingConnection] = useState(false);
    const [form] = Form.useForm();
    const [modelForm] = Form.useForm();
    // 加载数据
    useEffect(() => {
        loadTemplates();
        loadProviders();
    }, []);
    const loadTemplates = async () => {
        try {
            const data = await llmService.getTemplates();
            setTemplates(data);
        }
        catch (error) {
            console.error('Failed to load templates:', error);
        }
    };
    const loadProviders = async () => {
        try {
            setLoading(true);
            const data = await llmService.listProviders();
            console.log('API返回的providers数据:', data);
            setProviders(data);
        }
        catch (error) {
            if (error.response?.status !== 401) {
                message.error(t('llmProviders.loadProvidersFailed'));
            }
        }
        finally {
            setLoading(false);
        }
    };
    const loadProviderModels = async (providerId) => {
        try {
            const models = await llmService.listModels(providerId);
            setCurrentProviderModels(models);
        }
        catch (error) {
            message.error(t('llmProviders.loadModelsFailed'));
        }
    };
    // 关闭模态框
    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingProvider(null);
        setSelectedTemplate(null);
        form.resetFields();
    };
    // 打开添加提供商模态框
    const handleAddProvider = () => {
        setEditingProvider(null);
        setSelectedTemplate(null);
        form.resetFields();
        setModalVisible(true);
    };
    // 打开编辑提供商模态框
    const handleEditProvider = async (provider) => {
        try {
            console.log('编辑Provider - 原始数据:', provider);
            console.log('  is_enabled:', provider.is_enabled, 'type:', typeof provider.is_enabled);
            console.log('  is_default:', provider.is_default, 'type:', typeof provider.is_default);
            // 查找对应的模板
            const allTemplates = [
                ...(templates?.cloud_providers || []),
                ...(templates?.local_providers || [])
            ];
            const template = allTemplates.find(t => t.category === provider.provider_category);
            // 先加载模型列表
            await loadProviderModels(provider.id);
            // 设置状态
            setEditingProvider(provider);
            setSelectedTemplate(template || null);
            // 使用 setTimeout 确保状态更新后再打开模态框
            setTimeout(() => {
                // 设置表单值
                const formValues = {
                    provider_name: provider.provider_name,
                    provider_category: provider.provider_category,
                    is_enabled: Boolean(provider.is_enabled),
                    is_default: Boolean(provider.is_default),
                    ...provider.config
                };
                console.log('设置表单值:', formValues);
                form.setFieldsValue(formValues);
                // 最后打开模态框
                setModalVisible(true);
            }, 100);
        }
        catch (error) {
            console.error('Failed to edit provider:', error);
            message.error(t('llmProviders.loadProviderFailed'));
        }
    };
    // 选择模板
    const handleSelectTemplate = (category) => {
        const allTemplates = [
            ...(templates?.cloud_providers || []),
            ...(templates?.local_providers || [])
        ];
        const template = allTemplates.find(t => t.category === category);
        setSelectedTemplate(template || null);
        // 设置默认值
        if (template && template.config_fields) {
            const defaultConfig = {
                is_enabled: true, // 默认启用
                is_default: false // 默认不设为默认提供商
            };
            template.config_fields.forEach(field => {
                if (field.default) {
                    defaultConfig[field.name] = field.default;
                }
            });
            form.setFieldsValue(defaultConfig);
        }
    };
    // 测试连接
    const handleTestConnection = async () => {
        try {
            await form.validateFields();
            const values = form.getFieldsValue();
            if (!selectedTemplate) {
                message.warning(t('llmProviders.selectProviderTypeFirst'));
                return;
            }
            setTestingConnection(true);
            // 构建配置对象
            const config = {};
            if (selectedTemplate.config_fields) {
                selectedTemplate.config_fields.forEach(field => {
                    // 使用用户输入的值，如果没有则使用默认值
                    const value = values[field.name] || field.default;
                    if (value) {
                        config[field.name] = value;
                    }
                });
            }
            const result = await llmService.testConnection({
                provider_category: selectedTemplate.category,
                config,
                test_model: values.test_model
            });
            // 根据错误码翻译消息
            let translatedMessage = result.message;
            if (result.message_code) {
                switch (result.message_code) {
                    case 'OLLAMA_CONNECTION_SUCCESS':
                        translatedMessage = t('llmProviders.ollamaConnectionSuccess').replace('{count}', result.details?.model_count || 0);
                        break;
                    case 'OLLAMA_HTTP_ERROR':
                        translatedMessage = t('llmProviders.ollamaHttpError').replace('{code}', result.details?.status_code || '');
                        break;
                    case 'OLLAMA_CONNECTION_ERROR':
                        translatedMessage = t('llmProviders.ollamaConnectionError').replace('{error}', result.details?.error || '');
                        break;
                    case 'CONNECTION_SUCCESS':
                        translatedMessage = t('llmProviders.connectionSuccess');
                        break;
                    case 'TEST_NOT_SUPPORTED':
                        translatedMessage = t('llmProviders.testNotSupported').replace('{category}', result.details?.category || '');
                        break;
                    case 'TEST_FAILED':
                        translatedMessage = t('llmProviders.testFailed').replace('{error}', result.details?.error || '');
                        break;
                    default:
                        translatedMessage = result.message;
                }
            }
            if (result.success) {
                message.success(translatedMessage);
            }
            else {
                message.error(translatedMessage);
            }
        }
        catch (error) {
            message.error(t('llmProviders.testConnectionFailed'));
        }
        finally {
            setTestingConnection(false);
        }
    };
    // 保存提供商
    const handleSaveProvider = async () => {
        try {
            const values = await form.validateFields();
            if (!selectedTemplate && !editingProvider) {
                message.warning(t('llmProviders.selectProviderTypeFirst'));
                return;
            }
            const template = selectedTemplate || templates?.cloud_providers.find(t => t.category === editingProvider?.provider_category) || templates?.local_providers.find(t => t.category === editingProvider?.provider_category);
            if (!template) {
                message.error(t('llmProviders.providerTemplateNotFound'));
                return;
            }
            // 构建配置对象
            const config = {};
            if (template.config_fields) {
                template.config_fields.forEach(field => {
                    // 使用用户输入的值，如果为空字符串或undefined则使用默认值
                    const value = values[field.name] || field.default;
                    if (value !== undefined) {
                        config[field.name] = value;
                    }
                });
            }
            if (editingProvider) {
                // 更新
                await llmService.updateProvider(editingProvider.id, {
                    provider_name: values.provider_name,
                    config,
                    is_enabled: values.is_enabled,
                    is_default: values.is_default
                });
                message.success(t('llmProviders.providerUpdatedSuccess'));
            }
            else {
                // 创建
                await llmService.createProvider({
                    provider_name: values.provider_name,
                    provider_type: template.type,
                    provider_category: template.category,
                    config,
                    is_enabled: values.is_enabled ?? true,
                    is_default: values.is_default ?? false
                });
                message.success(t('llmProviders.providerCreatedSuccess'));
            }
            handleCloseModal();
            loadProviders();
        }
        catch (error) {
            if (error.errorFields) {
                message.error(t('llmProviders.fillRequiredFields'));
            }
            else {
                message.error(t('llmProviders.saveFailed'));
            }
        }
    };
    // 删除提供商
    const handleDeleteProvider = async (providerId) => {
        try {
            await llmService.deleteProvider(providerId);
            message.success(t('llmProviders.providerDeletedSuccess'));
            loadProviders();
        }
        catch (error) {
            message.error(t('llmProviders.deleteFailed'));
        }
    };
    // 添加模型
    const handleAddModel = () => {
        if (!editingProvider)
            return;
        modelForm.resetFields();
        setModelModalVisible(true);
    };
    // 从模板添加模型
    const handleAddModelFromTemplate = (defaultModel) => {
        if (!editingProvider)
            return;
        modelForm.setFieldsValue({
            model_name: defaultModel.model_name,
            display_name: defaultModel.display_name,
            max_tokens: defaultModel.max_tokens,
            context_window: defaultModel.context_window,
            model_type: 'chat',
            default_temperature: '0.7',
            default_top_p: '1.0',
            is_enabled: true,
            is_default: currentProviderModels.length === 0
        });
        setModelModalVisible(true);
    };
    // 保存模型
    const handleSaveModel = async () => {
        if (!editingProvider)
            return;
        try {
            const values = await modelForm.validateFields();
            await llmService.createModel({
                provider_id: editingProvider.id,
                ...values
            });
            message.success(t('llmProviders.modelAddedSuccess'));
            setModelModalVisible(false);
            await loadProviderModels(editingProvider.id);
        }
        catch (error) {
            if (error.errorFields) {
                message.error(t('llmProviders.fillRequiredFields'));
            }
            else {
                message.error(t('llmProviders.saveModelFailed'));
            }
        }
    };
    // 删除模型
    const handleDeleteModel = async (modelId) => {
        try {
            await llmService.deleteModel(modelId);
            message.success(t('llmProviders.modelDeletedSuccess'));
            if (editingProvider) {
                await loadProviderModels(editingProvider.id);
            }
        }
        catch (error) {
            message.error(t('llmProviders.deleteModelFailed'));
        }
    };
    // 表格列定义
    const columns = [
        {
            title: t('llmProviders.providerName'),
            dataIndex: 'provider_name',
            key: 'provider_name',
            render: (name, record) => (_jsxs(Space, { children: [record.provider_type === ProviderType.CLOUD ? (_jsx(CloudOutlined, { style: { color: '#1890ff' } })) : (_jsx(DesktopOutlined, { style: { color: '#52c41a' } })), _jsx(Text, { strong: true, children: name }), record.is_default && _jsx(Tag, { color: "blue", children: t('llmProviders.default') })] }))
        },
        {
            title: t('llmProviders.type'),
            dataIndex: 'provider_category',
            key: 'provider_category',
            render: (category) => {
                const labels = {
                    openai: 'OpenAI',
                    azure_openai: 'Azure OpenAI',
                    anthropic: 'Anthropic',
                    ollama: 'Ollama',
                    lm_studio: 'LM Studio',
                    custom: t('llmProviders.custom')
                };
                return _jsx(Tag, { children: labels[category] || category });
            }
        },
        {
            title: t('llmProviders.status'),
            key: 'status',
            render: (_, record) => (_jsxs(Space, { children: [_jsx(Badge, { status: record.is_enabled ? 'success' : 'default', text: record.is_enabled ? t('llmProviders.enabled') : t('llmProviders.disabled') }), record.validation_status === 'success' && (_jsx(Tooltip, { title: t('llmProviders.connectionNormal'), children: _jsx(CheckCircleOutlined, { style: { color: '#52c41a' } }) })), record.validation_status === 'failed' && (_jsx(Tooltip, { title: t('llmProviders.connectionFailed'), children: _jsx(ExclamationCircleOutlined, { style: { color: '#ff4d4f' } }) }))] }))
        },
        {
            title: t('llmProviders.createdAt'),
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date) => new Date(date).toLocaleDateString('zh-CN')
        },
        {
            title: t('llmProviders.actions'),
            key: 'action',
            render: (_, record) => (_jsxs(Space, { children: [_jsx(Button, { type: "link", icon: _jsx(EditOutlined, {}), onClick: () => handleEditProvider(record), children: t('llmProviders.edit') }), _jsx(Popconfirm, { title: t('llmProviders.deleteProviderConfirm'), description: t('llmProviders.deleteProviderWarning'), onConfirm: () => handleDeleteProvider(record.id), okText: t('llmProviders.confirm'), cancelText: t('llmProviders.cancel'), children: _jsx(Button, { type: "link", danger: true, icon: _jsx(DeleteOutlined, {}), children: t('llmProviders.delete') }) })] }))
        }
    ];
    // 模型表格列定义
    const modelColumns = [
        {
            title: t('llmProviders.modelName'),
            dataIndex: 'model_name',
            key: 'model_name',
            render: (name, record) => (_jsxs(Space, { children: [_jsx(Text, { strong: true, children: record.display_name || name }), record.is_default && _jsx(Tag, { color: "blue", children: t('llmProviders.default') })] }))
        },
        {
            title: t('llmProviders.maxTokens'),
            dataIndex: 'max_tokens',
            key: 'max_tokens'
        },
        {
            title: t('llmProviders.contextWindow'),
            dataIndex: 'context_window',
            key: 'context_window'
        },
        {
            title: t('llmProviders.status'),
            dataIndex: 'is_enabled',
            key: 'is_enabled',
            render: (enabled) => (_jsx(Badge, { status: enabled ? 'success' : 'default', text: enabled ? t('llmProviders.enabled') : t('llmProviders.disabled') }))
        },
        {
            title: t('llmProviders.actions'),
            key: 'action',
            render: (_, record) => (_jsx(Popconfirm, { title: t('llmProviders.deleteModelConfirm'), onConfirm: () => handleDeleteModel(record.id), okText: t('llmProviders.confirm'), cancelText: t('llmProviders.cancel'), children: _jsx(Button, { type: "link", danger: true, size: "small", icon: _jsx(DeleteOutlined, {}), children: t('llmProviders.delete') }) }))
        }
    ];
    return (_jsxs("div", { style: { padding: '24px' }, children: [_jsxs(Row, { justify: "space-between", align: "middle", style: { marginBottom: 24 }, children: [_jsxs(Col, { children: [_jsxs(Title, { level: 2, children: [_jsx(ApiOutlined, {}), " ", t('llmProviders.pageTitle')] }), _jsx(Paragraph, { type: "secondary", children: t('llmProviders.pageDescription') })] }), _jsx(Col, { children: _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: loadProviders, children: t('llmProviders.refresh') }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAddProvider, children: t('llmProviders.addProvider') })] }) })] }), _jsx(Card, { children: _jsx(Table, { columns: columns, dataSource: providers, loading: loading, rowKey: "id", pagination: { pageSize: 10 }, locale: { emptyText: t('llmProviders.noProvidersHint') } }) }), _jsx(Modal, { title: editingProvider ? t('llmProviders.editProvider') : t('llmProviders.addProvider'), open: modalVisible, onOk: handleSaveProvider, onCancel: handleCloseModal, width: 800, okText: t('llmProviders.save'), cancelText: t('llmProviders.cancel'), children: _jsxs(Form, { form: form, layout: "vertical", children: [!editingProvider && (_jsx(Form.Item, { label: t('llmProviders.providerType'), name: "provider_category", rules: [{ required: true, message: t('llmProviders.selectProviderType') }], children: _jsxs(Select, { placeholder: t('llmProviders.chooseProviderType'), onChange: handleSelectTemplate, children: [_jsx(Select.OptGroup, { label: t('llmProviders.cloudProvider'), children: templates?.cloud_providers.map(t => (_jsx(Option, { value: t.category, children: _jsxs(Space, { children: [_jsx(CloudOutlined, {}), t.name] }) }, t.category))) }), _jsx(Select.OptGroup, { label: t('llmProviders.localProvider'), children: templates?.local_providers.map(t => (_jsx(Option, { value: t.category, children: _jsxs(Space, { children: [_jsx(DesktopOutlined, {}), t.name] }) }, t.category))) })] }) })), selectedTemplate && (_jsx(Alert, { message: selectedTemplate.name, description: selectedTemplate.description, type: "info", showIcon: true, style: { marginBottom: 16 } })), _jsx(Form.Item, { label: t('llmProviders.providerName'), name: "provider_name", rules: [{ required: true, message: t('llmProviders.inputProviderName') }], children: _jsx(Input, { placeholder: t('llmProviders.exampleOpenAI') }) }), selectedTemplate?.config_fields?.map(field => (_jsx(Form.Item, { label: field.label, name: field.name, rules: [{ required: field.required, message: `Please enter ${field.label}` }], children: field.type === 'password' ? (_jsx(Input.Password, { placeholder: field.default })) : (_jsx(Input, { placeholder: field.default })) }, field.name))) || null, _jsxs(Space, { style: { width: '100%', justifyContent: 'space-between' }, children: [_jsxs(Space, { children: [_jsx(Form.Item, { name: "is_enabled", valuePropName: "checked", noStyle: true, children: _jsx(Switch, {}) }), _jsx(Text, { style: { marginLeft: 8 }, children: t('llmProviders.enabled') })] }), _jsxs(Space, { children: [_jsx(Form.Item, { name: "is_default", valuePropName: "checked", noStyle: true, children: _jsx(Switch, {}) }), _jsx(Text, { style: { marginLeft: 8 }, children: t('llmProviders.setAsDefault') })] }), selectedTemplate && (_jsx(Button, { icon: _jsx(CheckCircleOutlined, {}), onClick: handleTestConnection, loading: testingConnection, children: t('llmProviders.testConnection') }))] }), editingProvider && (_jsxs(_Fragment, { children: [_jsx("div", { style: { marginTop: 24, marginBottom: 16 }, children: _jsxs(Space, { style: { width: '100%', justifyContent: 'space-between' }, children: [_jsx(Title, { level: 5, children: t('llmProviders.modelConfiguration') }), _jsx(Button, { type: "dashed", icon: _jsx(PlusOutlined, {}), onClick: handleAddModel, children: t('llmProviders.addModel') })] }) }), selectedTemplate && selectedTemplate.default_models.length > 0 && (_jsx(Alert, { message: t('llmProviders.quickAdd'), description: _jsx(Space, { wrap: true, children: selectedTemplate.default_models.map(model => (_jsx(Button, { size: "small", onClick: () => handleAddModelFromTemplate(model), children: model.display_name }, model.model_name))) }), type: "info", style: { marginBottom: 16 } })), _jsx(Table, { columns: modelColumns, dataSource: currentProviderModels, rowKey: "id", size: "small", pagination: false, locale: { emptyText: t('llmProviders.noModelsHint') } })] }))] }) }), _jsx(Modal, { title: t('llmProviders.addModel'), open: modelModalVisible, onOk: handleSaveModel, onCancel: () => setModelModalVisible(false), okText: t('llmProviders.save'), cancelText: t('llmProviders.cancel'), children: _jsxs(Form, { form: modelForm, layout: "vertical", children: [_jsx(Form.Item, { label: t('llmProviders.modelName'), name: "model_name", rules: [{ required: true, message: t('llmProviders.inputModelName') }], children: _jsx(Input, { placeholder: t('llmProviders.exampleGPT4') }) }), _jsx(Form.Item, { label: t('llmProviders.displayName'), name: "display_name", children: _jsx(Input, { placeholder: t('llmProviders.exampleGPT4Display') }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('llmProviders.maxTokenCount'), name: "max_tokens", initialValue: 4096, rules: [{ required: true, message: t('llmProviders.inputMaxTokens') }], children: _jsx(InputNumber, { min: 1, style: { width: '100%' } }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('llmProviders.contextWindow'), name: "context_window", initialValue: 4096, rules: [{ required: true, message: t('llmProviders.inputContextWindow') }], children: _jsx(InputNumber, { min: 1, style: { width: '100%' } }) }) })] }), _jsxs(Space, { style: { width: '100%', justifyContent: 'space-between' }, children: [_jsxs(Form.Item, { name: "is_enabled", valuePropName: "checked", initialValue: true, noStyle: true, children: [_jsx(Switch, { defaultChecked: true }), " ", _jsx(Text, { style: { marginLeft: 8 }, children: t('llmProviders.enabled') })] }), _jsxs(Form.Item, { name: "is_default", valuePropName: "checked", initialValue: false, noStyle: true, children: [_jsx(Switch, {}), " ", _jsx(Text, { style: { marginLeft: 8 }, children: t('llmProviders.setAsDefault') })] })] })] }) })] }));
};
export default LLMProvidersPage;
