import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal, Form, Checkbox, Radio, Button, Typography, Space, Divider, message } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
const { Title, Text } = Typography;
/**
 * 用户兴趣问卷组件
 * 用于新用户首次登录时收集偏好信息，实现个性化推荐
 */
const InterestSurvey = ({ visible, onComplete, onSkip }) => {
    const { t, language } = useLanguage();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    // 兴趣领域选项
    const interestOptions = [
        { label: t('onboarding.interestLLM'), value: 'LLM', emoji: '🤖' },
        { label: t('onboarding.interestCV'), value: 'CV', emoji: '👁️' },
        { label: t('onboarding.interestRL'), value: 'RL', emoji: '🎮' },
        { label: t('onboarding.interestAgent'), value: 'Agent', emoji: '🤝' },
        { label: t('onboarding.interestMultimodal'), value: 'Multimodal', emoji: '🎨' },
        { label: t('onboarding.interestQuantization'), value: 'Quantization', emoji: '⚡' },
        { label: t('onboarding.interestTools'), value: 'Tools', emoji: '🛠️' },
        { label: t('onboarding.interestNLP'), value: 'NLP', emoji: '💬' },
    ];
    // 技术角色选项
    const roleOptions = [
        { label: t('onboarding.roleResearcher'), value: 'researcher', emoji: '🔬' },
        { label: t('onboarding.roleEngineer'), value: 'engineer', emoji: '👨‍💻' },
        { label: t('onboarding.rolePM'), value: 'pm', emoji: '📊' },
        { label: t('onboarding.roleStudent'), value: 'student', emoji: '🎓' },
    ];
    // 内容类型偏好
    const contentTypeOptions = [
        { label: t('onboarding.contentPapers'), value: 'papers', emoji: '📄' },
        { label: t('onboarding.contentProjects'), value: 'projects', emoji: '📦' },
        { label: t('onboarding.contentTools'), value: 'tools', emoji: '🔧' },
        { label: t('onboarding.contentTrends'), value: 'trends', emoji: '📈' },
    ];
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const preferences = {
                interests: values.interests || [],
                role: values.role || 'engineer',
                content_types: values.content_types || [],
                languages: [language], // 使用当前语言
                onboarding_completed: true,
            };
            // 使用 axios 调用 API 保存偏好（自动添加认证头）
            await api.post('/api/v1/preferences/onboarding', preferences);
            message.success(t('onboarding.successMessage'));
            onComplete(preferences);
        }
        catch (error) {
            console.error('Survey submission error:', error);
            console.error('Error response:', error.response);
            // 显示详细错误信息
            const errorMsg = error.response?.data?.detail || t('onboarding.errorMessage');
            message.error(errorMsg);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSkip = () => {
        if (onSkip) {
            onSkip();
        }
    };
    return (_jsx(Modal, { open: visible, title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(RocketOutlined, { style: { fontSize: '24px', color: '#1890ff' } }), _jsxs("span", { children: ["\uD83C\uDFAF ", t('onboarding.title')] })] }), width: 700, footer: null, closable: false, maskClosable: false, children: _jsxs("div", { style: { padding: '20px 0' }, children: [_jsx(Text, { type: "secondary", style: { fontSize: '14px' }, children: t('onboarding.subtitle') }), _jsxs(Form, { form: form, layout: "vertical", style: { marginTop: 24 }, initialValues: {
                        interests: ['LLM'],
                        role: 'engineer',
                        content_types: ['projects', 'papers'],
                    }, children: [_jsx(Form.Item, { name: "interests", label: _jsxs(Text, { strong: true, style: { fontSize: '16px' }, children: ["1\uFE0F\u20E3 ", t('onboarding.question1'), " ", _jsx(Text, { type: "secondary", children: t('onboarding.question1Hint') })] }), rules: [{ required: true, message: t('onboarding.requireInterest') }], children: _jsx(Checkbox.Group, { style: { width: '100%' }, children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, children: interestOptions.map(option => (_jsxs(Checkbox, { value: option.value, style: {
                                            padding: '12px',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: '8px',
                                            width: '100%',
                                            marginLeft: 0,
                                        }, children: [_jsx("span", { style: { fontSize: '16px', marginRight: '8px' }, children: option.emoji }), _jsx("span", { style: { fontSize: '14px' }, children: option.label })] }, option.value))) }) }) }), _jsx(Divider, {}), _jsx(Form.Item, { name: "role", label: _jsxs(Text, { strong: true, style: { fontSize: '16px' }, children: ["2\uFE0F\u20E3 ", t('onboarding.question2')] }), rules: [{ required: true, message: t('onboarding.requireRole') }], children: _jsx(Radio.Group, { style: { width: '100%' }, children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, children: roleOptions.map(option => (_jsxs(Radio, { value: option.value, style: {
                                            padding: '12px',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: '8px',
                                            width: '100%',
                                            marginLeft: 0,
                                        }, children: [_jsx("span", { style: { fontSize: '16px', marginRight: '8px' }, children: option.emoji }), _jsx("span", { style: { fontSize: '14px' }, children: option.label })] }, option.value))) }) }) }), _jsx(Divider, {}), _jsx(Form.Item, { name: "content_types", label: _jsxs(Text, { strong: true, style: { fontSize: '16px' }, children: ["3\uFE0F\u20E3 ", t('onboarding.question3'), " ", _jsx(Text, { type: "secondary", children: t('onboarding.question3Hint') })] }), rules: [{ required: true, message: t('onboarding.requireContentType') }], children: _jsx(Checkbox.Group, { style: { width: '100%' }, children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, children: contentTypeOptions.map(option => (_jsxs(Checkbox, { value: option.value, style: {
                                            padding: '12px',
                                            border: '1px solid #f0f0f0',
                                            borderRadius: '8px',
                                            width: '100%',
                                            marginLeft: 0,
                                        }, children: [_jsx("span", { style: { fontSize: '16px', marginRight: '8px' }, children: option.emoji }), _jsx("span", { style: { fontSize: '14px' }, children: option.label })] }, option.value))) }) }) }), _jsx(Divider, {}), _jsx(Form.Item, { style: { marginBottom: 0, marginTop: 24 }, children: _jsxs(Space, { style: { width: '100%', justifyContent: 'space-between' }, children: [_jsx(Button, { onClick: handleSkip, children: t('onboarding.skipButton') }), _jsx(Button, { type: "primary", size: "large", onClick: handleSubmit, loading: loading, style: { minWidth: '120px' }, children: t('onboarding.submitButton') })] }) })] }), _jsx("div", { style: { marginTop: 16, textAlign: 'center' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83D\uDCA1 ", t('onboarding.footerHint')] }) })] }) }));
};
export default InterestSurvey;
