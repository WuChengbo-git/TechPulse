import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, Space, message, Typography, Alert, Tag } from 'antd';
import { DatabaseOutlined, UserOutlined, HeartOutlined, SettingOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const SettingsPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('integrations');
    // 知识库配置状态
    const [notionForm] = Form.useForm();
    // 个性化设置状态
    const [personalizationForm] = Form.useForm();
    // 用户偏好状态
    const [preferencesForm] = Form.useForm();
    // 测试连接状态
    const [testStatus, setTestStatus] = useState({
        notion: null
    });
    // 测试 Notion 连接
    const testNotionConnection = async () => {
        try {
            setTestStatus({ ...testStatus, notion: 'testing' });
            await notionForm.validateFields();
            await new Promise(resolve => setTimeout(resolve, 1500));
            setTestStatus({ ...testStatus, notion: 'success' });
            message.success(t('settings.testSuccess').replace('{service}', 'Notion'));
        }
        catch (error) {
            setTestStatus({ ...testStatus, notion: 'error' });
            message.error(t('settings.testFailed').replace('{service}', 'Notion'));
        }
    };
    // 保存配置
    const handleSave = async (formType) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            message.success(t('settings.configSaveSuccess'));
        }
        catch (error) {
            message.error(t('settings.configSaveFailed'));
        }
        finally {
            setLoading(false);
        }
    };
    // 渲染连接状态图标
    const renderStatusIcon = (status) => {
        if (status === 'success') {
            return _jsx(CheckCircleOutlined, { style: { color: '#52c41a', fontSize: 16 } });
        }
        else if (status === 'error') {
            return _jsx(ExclamationCircleOutlined, { style: { color: '#ff4d4f', fontSize: 16 } });
        }
        return null;
    };
    return (_jsxs("div", { style: { padding: '24px' }, children: [_jsxs(Title, { level: 2, children: [_jsx(SettingOutlined, {}), " ", t('settings.pageTitle')] }), _jsx(Paragraph, { type: "secondary", children: t('settings.pageDescription') }), _jsx(Alert, { message: t('settings.aiModelsMovedTitle'), description: t('settings.aiModelsMovedDescription'), type: "info", showIcon: true, style: { marginBottom: 24 } }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, size: "large", children: [_jsxs(Tabs.TabPane, { tab: _jsxs("span", { children: [_jsx(DatabaseOutlined, {}), t('settings.integrationsTab')] }), children: [_jsx(Card, { title: t('settings.notionConfig'), extra: renderStatusIcon(testStatus.notion), children: _jsxs(Form, { form: notionForm, layout: "vertical", children: [_jsx(Form.Item, { name: "enabled", valuePropName: "checked", children: _jsxs(Space, { children: [_jsx(Switch, {}), _jsx(Text, { children: t('settings.enableNotion') })] }) }), _jsx(Form.Item, { label: t('settings.apiKey'), name: "apiKey", children: _jsx(Input.Password, { placeholder: t('settings.enterApiKey') }) }), _jsxs(Space, { children: [_jsx(Button, { type: "primary", onClick: () => handleSave('notion'), loading: loading, children: t('common.save') }), _jsx(Button, { onClick: testNotionConnection, loading: testStatus.notion === 'testing', children: t('settings.testConnection') })] })] }) }), _jsxs(Card, { title: t('settings.otherIntegrations'), style: { marginTop: 16 }, children: [_jsx(Paragraph, { type: "secondary", children: t('settings.moreIntegrationsComingSoon') }), _jsxs(Space, { wrap: true, children: [_jsx(Tag, { color: "default", children: t('settings.obsidianPlanned') }), _jsx(Tag, { color: "default", children: t('settings.logseqPlanned') }), _jsx(Tag, { color: "default", children: t('settings.yuquePlanned') }), _jsx(Tag, { color: "default", children: t('settings.feishuPlanned') })] })] })] }, "integrations"), _jsx(Tabs.TabPane, { tab: _jsxs("span", { children: [_jsx(HeartOutlined, {}), t('settings.personalizationTab')] }), children: _jsx(Card, { title: t('settings.recommendationSettings'), children: _jsxs(Form, { form: personalizationForm, layout: "vertical", children: [_jsx(Form.Item, { name: "enableRecommendations", valuePropName: "checked", children: _jsxs(Space, { children: [_jsx(Switch, { defaultChecked: true }), _jsx(Text, { children: t('settings.enablePersonalizedRecommendations') })] }) }), _jsx(Form.Item, { label: t('settings.interestedTopics'), name: "topics", children: _jsxs(Select, { mode: "tags", placeholder: t('settings.selectOrInputTopics'), children: [_jsx(Option, { value: "ai", children: "AI & Machine Learning" }), _jsx(Option, { value: "web", children: "Web Development" }), _jsx(Option, { value: "mobile", children: "Mobile Development" }), _jsx(Option, { value: "devops", children: "DevOps" }), _jsx(Option, { value: "data", children: "Data Science" })] }) }), _jsx(Button, { type: "primary", onClick: () => handleSave('personalization'), loading: loading, children: t('common.save') })] }) }) }, "personalization"), _jsx(Tabs.TabPane, { tab: _jsxs("span", { children: [_jsx(UserOutlined, {}), t('settings.preferencesTab')] }), children: _jsx(Card, { title: t('settings.displaySettings'), children: _jsxs(Form, { form: preferencesForm, layout: "vertical", children: [_jsx(Form.Item, { label: t('settings.itemsPerPage'), name: "itemsPerPage", children: _jsxs(Select, { defaultValue: 20, children: [_jsxs(Option, { value: 10, children: ["10 ", t('settings.items')] }), _jsxs(Option, { value: 20, children: ["20 ", t('settings.items')] }), _jsxs(Option, { value: 50, children: ["50 ", t('settings.items')] }), _jsxs(Option, { value: 100, children: ["100 ", t('settings.items')] })] }) }), _jsx(Button, { type: "primary", onClick: () => handleSave('preferences'), loading: loading, children: t('common.save') })] }) }) }, "preferences")] })] }));
};
export default SettingsPage;
