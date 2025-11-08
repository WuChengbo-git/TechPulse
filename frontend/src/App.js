import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Button, Breadcrumb, Typography, Space, Avatar, Dropdown, Badge, Modal, Form, Input, message } from 'antd';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, LogoutOutlined, UserOutlined, GlobalOutlined, LockOutlined, ProfileOutlined, SafetyOutlined, QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Sidebar from './components/Sidebar';
import VersionInfo from './components/VersionInfo';
import InterestSurvey from './components/InterestSurvey';
import { APP_VERSION } from './config/version';
// New v0.4.0 pages
import DiscoverPage from './pages/DiscoverPage';
import ExplorePage from './pages/ExplorePage';
import DetailPage from './pages/DetailPage';
import CollectionsPage from './pages/CollectionsPage';
// Legacy pages (will be phased out)
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import GitHubPage from './pages/GitHubPage';
import ArxivPage from './pages/ArxivPage';
import HuggingFacePage from './pages/HuggingFacePage';
import ZennPage from './pages/ZennPage';
// Other pages
import Chat from './pages/Chat';
import Analytics from './pages/Analytics';
import TrendsPage from './pages/TrendsPage';
import ApiConfigPage from './pages/ApiConfigPage';
import SettingsPage from './pages/SettingsPage';
import TaskManagementPage from './pages/TaskManagementPage';
import SystemStatusPage from './pages/SystemStatusPage';
import LLMProvidersPage from './pages/LLMProvidersPage';
import Login from './pages/Login';
import './App.css';
import './styles/responsive.css';
const { Header, Content, Footer } = Layout;
const { Text } = Typography;
function AppContent() {
    const [collapsed, setCollapsed] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);
    const [surveyVisible, setSurveyVisible] = useState(false);
    const [form] = Form.useForm();
    const { t, language, setLanguage } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    // 从路由路径推断选中的菜单项
    const getSelectedKeyFromPath = (pathname) => {
        // Handle detail page specially (always select 'discover')
        if (pathname.startsWith('/detail/')) {
            return 'discover';
        }
        const pathMap = {
            '/': 'discover',
            '/discover': 'discover',
            '/explore': 'explore',
            '/collections': 'collections',
            '/trending': 'trending',
            '/trends': 'trends',
            '/chat': 'chat',
            // Legacy paths (kept for backward compatibility)
            '/dashboard': 'dashboard',
            '/github': 'github',
            '/arxiv': 'arxiv',
            '/huggingface': 'huggingface',
            '/zenn': 'zenn',
            '/analytics': 'analytics',
            // System management
            '/settings': 'settings',
            '/api-config': 'api-config',
            '/llm-providers': 'llm-providers',
            '/tasks': 'tasks',
            '/status': 'status'
        };
        return pathMap[pathname] || 'discover';
    };
    const selectedKey = getSelectedKeyFromPath(location.pathname);
    // 菜单选择处理 - 使用路由导航
    const handleMenuSelect = (key) => {
        const keyToPath = {
            // New v0.4.0 pages
            'discover': '/discover',
            'explore': '/explore',
            'collections': '/collections',
            'trending': '/trending',
            'trends': '/trends',
            'chat': '/chat',
            // Legacy pages (kept for backward compatibility)
            'dashboard': '/dashboard',
            'github': '/github',
            'arxiv': '/arxiv',
            'huggingface': '/huggingface',
            'zenn': '/zenn',
            'analytics': '/analytics',
            // System management
            'settings': '/settings',
            'api-config': '/api-config',
            'llm-providers': '/llm-providers',
            'tasks': '/tasks',
            'status': '/status'
        };
        navigate(keyToPath[key] || '/discover');
    };
    // 动态更新页面标题
    useEffect(() => {
        document.title = t('app.pageTitle');
    }, [language, t]);
    // 检查登录状态
    useEffect(() => {
        const localToken = localStorage.getItem('techpulse_token');
        const sessionToken = sessionStorage.getItem('techpulse_token');
        const localUser = localStorage.getItem('techpulse_user');
        const sessionUser = sessionStorage.getItem('techpulse_user');
        if ((localToken || sessionToken) && (localUser || sessionUser)) {
            setIsLoggedIn(true);
            const userStr = localUser || sessionUser || '';
            try {
                const user = JSON.parse(userStr);
                setUsername(user.username || user.display_name || '');
            }
            catch {
                setUsername(userStr);
            }
        }
    }, []);
    // 检查是否需要显示问卷
    const checkSurveyStatus = async () => {
        const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
        if (!token)
            return;
        try {
            const response = await fetch('/api/v1/preferences/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const preferences = await response.json();
                // 如果用户未完成问卷，显示问卷
                if (!preferences.onboarding_completed) {
                    setSurveyVisible(true);
                }
            }
        }
        catch (error) {
            console.error('Failed to check survey status:', error);
        }
    };
    // 处理登录成功
    const handleLoginSuccess = () => {
        const localUser = localStorage.getItem('techpulse_user');
        const sessionUser = sessionStorage.getItem('techpulse_user');
        const userStr = localUser || sessionUser || '';
        setIsLoggedIn(true);
        try {
            const user = JSON.parse(userStr);
            setUsername(user.username || user.display_name || '');
        }
        catch {
            setUsername(userStr);
        }
        // 检查是否需要显示问卷
        checkSurveyStatus();
    };
    // 处理登出
    const handleLogout = () => {
        localStorage.removeItem('techpulse_token');
        localStorage.removeItem('techpulse_user');
        sessionStorage.removeItem('techpulse_token');
        sessionStorage.removeItem('techpulse_user');
        setIsLoggedIn(false);
        setUsername('');
    };
    // 处理问卷完成
    const handleSurveyComplete = (preferences) => {
        setSurveyVisible(false);
        message.success('欢迎使用 TechPulse！我们将根据你的偏好推荐内容 🎉');
    };
    // 处理跳过问卷
    const handleSurveySkip = () => {
        setSurveyVisible(false);
        message.info('你可以随时在个人中心完成偏好设置');
    };
    // 处理修改密码
    const handleChangePassword = async (values) => {
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await fetch('/api/v1/auth/password/change', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: values.oldPassword,
                    new_password: values.newPassword,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || t('nav.changePasswordFailed'));
            }
            message.success(t('nav.changePasswordSuccess'));
            setChangePasswordVisible(false);
            form.resetFields();
            // 密码修改成功后，提示用户重新登录
            message.info(t('nav.pleaseRelogin') || '请重新登录', 3);
            setTimeout(() => {
                handleLogout();
            }, 3000);
        }
        catch (error) {
            message.error(error.message || t('nav.changePasswordFailed'));
        }
    };
    // 如果未登录，显示登录页面
    if (!isLoggedIn) {
        return _jsx(Login, { onLoginSuccess: handleLoginSuccess });
    }
    const getBreadcrumbItems = () => {
        const breadcrumbMap = {
            // New v0.4.0 pages
            discover: [t('nav.home'), t('discover.title') || '今日精选'],
            explore: [t('nav.home'), t('explore.title') || '数据探索'],
            collections: [t('nav.home'), t('collections.title') || '我的收藏'],
            // Trending & Analysis
            trending: [t('nav.home'), t('nav.trending')],
            trends: [t('nav.analytics'), t('nav.trendAnalysis')],
            chat: [t('nav.analytics'), t('nav.aiAssistant')],
            // Legacy data source pages
            dashboard: [t('nav.home'), t('nav.dashboard')],
            github: [t('nav.dataSources'), t('nav.github')],
            arxiv: [t('nav.dataSources'), t('nav.arxiv')],
            huggingface: [t('nav.dataSources'), t('nav.huggingface')],
            zenn: [t('nav.dataSources'), t('nav.zenn')],
            analytics: [t('nav.analytics'), t('nav.dataAnalysis')],
            // System management
            settings: [t('nav.systemManagement'), t('nav.systemSettings')],
            notion: [t('nav.systemManagement'), t('nav.notionIntegration')],
            'api-config': [t('nav.systemManagement'), t('nav.apiConfig')],
            'llm-providers': [t('nav.systemManagement'), 'LLM模型管理'],
            tasks: [t('nav.systemManagement'), t('nav.taskManagement')],
            status: [t('nav.systemManagement'), t('nav.systemStatus')]
        };
        const items = breadcrumbMap[selectedKey] || [t('nav.home')];
        return items.map(item => ({ title: item }));
    };
    return (_jsxs(ConfigProvider, { theme: {
            token: {
                colorPrimary: '#1890ff',
                borderRadius: 8,
            },
        }, children: [_jsxs(Layout, { style: { minHeight: '100vh' }, children: [_jsx(Sidebar, { collapsed: collapsed, selectedKey: selectedKey, onMenuSelect: handleMenuSelect }), _jsxs(Layout, { children: [_jsxs(Header, { style: {
                                    padding: '0 24px',
                                    background: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderBottom: '1px solid #f0f0f0',
                                    boxShadow: '0 1px 4px rgba(0,21,41,.08)'
                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 16 }, children: [_jsx(Button, { type: "text", icon: collapsed ? _jsx(MenuUnfoldOutlined, {}) : _jsx(MenuFoldOutlined, {}), onClick: () => setCollapsed(!collapsed), style: { fontSize: '16px' } }), _jsx(Breadcrumb, { items: getBreadcrumbItems() })] }), _jsxs(Space, { size: "middle", children: [_jsx(Badge, { count: 0, showZero: false, children: _jsx(Button, { type: "text", icon: _jsx(BellOutlined, {}), title: t('nav.notifications') }) }), _jsx(Dropdown, { menu: {
                                                    items: [
                                                        {
                                                            key: 'user-info',
                                                            label: (_jsxs("div", { style: { padding: '8px 0' }, children: [_jsx("div", { style: { fontWeight: 600, fontSize: '14px' }, children: username }), _jsx("div", { style: { fontSize: '12px', color: '#999' }, children: t('nav.personalCenter') })] })),
                                                            disabled: true,
                                                        },
                                                        { type: 'divider' },
                                                        {
                                                            key: 'profile',
                                                            label: t('nav.profileSettings'),
                                                            icon: _jsx(ProfileOutlined, {}),
                                                            onClick: () => message.info(t('nav.comingSoon')),
                                                        },
                                                        {
                                                            key: 'change-password',
                                                            label: t('nav.changePassword'),
                                                            icon: _jsx(LockOutlined, {}),
                                                            onClick: () => setChangePasswordVisible(true),
                                                        },
                                                        {
                                                            key: 'security',
                                                            label: t('nav.securitySettings'),
                                                            icon: _jsx(SafetyOutlined, {}),
                                                            onClick: () => message.info(t('nav.comingSoon')),
                                                        },
                                                        { type: 'divider' },
                                                        {
                                                            key: 'language',
                                                            label: t('nav.languageSwitch'),
                                                            icon: _jsx(GlobalOutlined, {}),
                                                            children: [
                                                                {
                                                                    key: 'zh-CN',
                                                                    label: '简体中文',
                                                                    onClick: () => setLanguage('zh-CN'),
                                                                },
                                                                {
                                                                    key: 'en-US',
                                                                    label: 'English',
                                                                    onClick: () => setLanguage('en-US'),
                                                                },
                                                                {
                                                                    key: 'ja-JP',
                                                                    label: '日本語',
                                                                    onClick: () => setLanguage('ja-JP'),
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            key: 'settings',
                                                            label: t('nav.systemSettings'),
                                                            icon: _jsx(SettingOutlined, {}),
                                                            onClick: () => navigate('/settings'),
                                                        },
                                                        { type: 'divider' },
                                                        {
                                                            key: 'help',
                                                            label: t('nav.helpCenter'),
                                                            icon: _jsx(QuestionCircleOutlined, {}),
                                                            onClick: () => message.info(t('nav.comingSoon')),
                                                        },
                                                        {
                                                            key: 'about',
                                                            label: t('nav.about'),
                                                            icon: _jsx(InfoCircleOutlined, {}),
                                                            onClick: () => message.info(`TechPulse v${APP_VERSION}`),
                                                        },
                                                        { type: 'divider' },
                                                        {
                                                            key: 'logout',
                                                            label: t('common.logout'),
                                                            icon: _jsx(LogoutOutlined, {}),
                                                            danger: true,
                                                            onClick: handleLogout,
                                                        },
                                                    ],
                                                }, placement: "bottomRight", trigger: ['click'], children: _jsx(Avatar, { style: { backgroundColor: '#1890ff', cursor: 'pointer' }, icon: !username ? _jsx(UserOutlined, {}) : undefined, children: username ? username.charAt(0).toUpperCase() : '' }) })] })] }), _jsx(Content, { style: {
                                    margin: '24px',
                                    padding: '24px',
                                    background: '#fff',
                                    borderRadius: '8px',
                                    minHeight: 'calc(100vh - 164px)',
                                    overflow: 'auto'
                                }, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/discover", replace: true }) }), _jsx(Route, { path: "/discover", element: _jsx(DiscoverPage, {}) }), _jsx(Route, { path: "/explore", element: _jsx(ExplorePage, {}) }), _jsx(Route, { path: "/detail/:id", element: _jsx(DetailPage, {}) }), _jsx(Route, { path: "/collections", element: _jsx(CollectionsPage, {}) }), _jsx(Route, { path: "/trending", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/trends", element: _jsx(TrendsPage, {}) }), _jsx(Route, { path: "/chat", element: _jsx(Chat, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Overview, {}) }), _jsx(Route, { path: "/github", element: _jsx(GitHubPage, {}) }), _jsx(Route, { path: "/arxiv", element: _jsx(ArxivPage, {}) }), _jsx(Route, { path: "/huggingface", element: _jsx(HuggingFacePage, {}) }), _jsx(Route, { path: "/zenn", element: _jsx(ZennPage, {}) }), _jsx(Route, { path: "/analytics", element: _jsx(Analytics, {}) }), _jsx(Route, { path: "/api-config", element: _jsx(ApiConfigPage, {}) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "/llm-providers", element: _jsx(LLMProvidersPage, {}) }), _jsx(Route, { path: "/tasks", element: _jsx(TaskManagementPage, {}) }), _jsx(Route, { path: "/status", element: _jsx(SystemStatusPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/discover", replace: true }) })] }) }), _jsx(Footer, { style: {
                                    textAlign: 'center',
                                    background: '#f0f2f5',
                                    padding: '12px 24px',
                                    fontSize: '12px',
                                    color: '#999'
                                }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Space, { split: _jsx(Text, { type: "secondary", children: "|" }), children: [_jsx(Text, { type: "secondary", children: t('app.copyright') }), _jsx(Text, { type: "secondary", children: t('app.subtitle') }), _jsx(Text, { type: "secondary", children: t('app.description') })] }), _jsx(VersionInfo, {})] }) })] })] }), _jsx(Modal, { title: t('nav.changePassword'), open: changePasswordVisible, onCancel: () => {
                    setChangePasswordVisible(false);
                    form.resetFields();
                }, onOk: () => form.submit(), okText: t('common.confirm'), cancelText: t('common.cancel'), children: _jsxs(Form, { form: form, layout: "vertical", onFinish: handleChangePassword, children: [_jsx(Form.Item, { name: "oldPassword", label: t('nav.oldPassword'), rules: [{ required: true, message: t('nav.oldPasswordRequired') }], children: _jsx(Input.Password, { placeholder: t('nav.oldPasswordPlaceholder') }) }), _jsx(Form.Item, { name: "newPassword", label: t('nav.newPassword'), rules: [
                                { required: true, message: t('nav.newPasswordRequired') },
                                { min: 6, message: t('nav.passwordMinLength') }
                            ], children: _jsx(Input.Password, { placeholder: t('nav.newPasswordPlaceholder') }) }), _jsx(Form.Item, { name: "confirmPassword", label: t('nav.confirmNewPassword'), dependencies: ['newPassword'], rules: [
                                { required: true, message: t('nav.confirmPasswordRequired') },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error(t('login.passwordMismatch')));
                                    },
                                }),
                            ], children: _jsx(Input.Password, { placeholder: t('nav.confirmPasswordPlaceholder') }) })] }) }), _jsx(InterestSurvey, { visible: surveyVisible, onComplete: handleSurveyComplete, onSkip: handleSurveySkip })] }));
}
function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(LanguageProvider, { children: _jsx(Router, { children: _jsx(AppContent, {}) }) }) }));
}
export default App;
