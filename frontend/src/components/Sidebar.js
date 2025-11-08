import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Layout, Menu, Avatar, Typography } from 'antd';
import { DashboardOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, LineChartOutlined, SettingOutlined, ApiOutlined, CloudOutlined, UnorderedListOutlined, MonitorOutlined, FireOutlined, BarChartOutlined, MessageOutlined, DashboardOutlined as AnalyticsOutlined, StarOutlined, CompassOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
const { Sider } = Layout;
const { Text } = Typography;
const Sidebar = ({ collapsed, selectedKey, onMenuSelect }) => {
    const { t } = useLanguage();
    const menuItems = [
        // New v0.4.0 main navigation
        {
            key: 'discover',
            icon: _jsx(FireOutlined, {}),
            label: t('discover.title') || '🎯 今日精选'
        },
        {
            key: 'explore',
            icon: _jsx(CompassOutlined, {}),
            label: t('explore.title') || '🔍 数据探索'
        },
        {
            key: 'collections',
            icon: _jsx(StarOutlined, {}),
            label: t('collections.title') || '我的收藏'
        },
        {
            key: 'trending',
            icon: _jsx(LineChartOutlined, {}),
            label: t('nav.trending')
        },
        // Divider
        { type: 'divider' },
        // AI Assistant
        {
            key: 'chat',
            icon: _jsx(MessageOutlined, {}),
            label: t('nav.aiAssistant')
        },
        // Legacy pages (folded under submenus)
        {
            key: 'legacy',
            icon: _jsx(DashboardOutlined, {}),
            label: '传统视图',
            children: [
                { key: 'dashboard', icon: _jsx(BarChartOutlined, {}), label: t('nav.dashboard') },
                { key: 'github', icon: _jsx(GithubOutlined, {}), label: t('nav.github') },
                { key: 'arxiv', icon: _jsx(FileTextOutlined, {}), label: t('nav.arxiv') },
                { key: 'huggingface', icon: _jsx(RobotOutlined, {}), label: t('nav.huggingface') },
                { key: 'zenn', icon: _jsx(EditOutlined, {}), label: t('nav.zenn') },
                { key: 'analytics', icon: _jsx(AnalyticsOutlined, {}), label: t('nav.dataAnalysis') },
                { key: 'trends', icon: _jsx(LineChartOutlined, {}), label: t('nav.trendAnalysis') }
            ]
        },
        // Divider
        { type: 'divider' },
        // System management
        {
            key: 'system',
            icon: _jsx(SettingOutlined, {}),
            label: t('sidebar.systemManagement'),
            children: [
                { key: 'settings', icon: _jsx(SettingOutlined, {}), label: t('nav.systemSettings') },
                { key: 'llm-providers', icon: _jsx(CloudOutlined, {}), label: 'LLM模型管理' },
                { key: 'api-config', icon: _jsx(ApiOutlined, {}), label: t('nav.apiConfig') },
                { key: 'tasks', icon: _jsx(UnorderedListOutlined, {}), label: t('nav.taskManagement') },
                { key: 'status', icon: _jsx(MonitorOutlined, {}), label: t('nav.systemStatus') }
            ]
        }
    ];
    return (_jsxs(Sider, { collapsible: true, collapsed: collapsed, theme: "light", width: 220, style: {
            boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
            borderRight: '1px solid #f0f0f0'
        }, children: [_jsx("div", { style: {
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? 0 : '0 24px',
                    borderBottom: '1px solid #f0f0f0'
                }, children: collapsed ? (_jsx(Avatar, { style: { backgroundColor: '#1890ff' }, size: "small", children: "T" })) : (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Avatar, { style: { backgroundColor: '#1890ff' }, size: "small", children: "T" }), _jsx(Text, { strong: true, style: { color: '#1890ff', fontSize: 16 }, children: "TechPulse" })] })) }), _jsx(Menu, { mode: "inline", selectedKeys: [selectedKey], style: { borderRight: 0, paddingTop: 8 }, items: menuItems, onClick: ({ key }) => onMenuSelect(key) })] }));
};
export default Sidebar;
