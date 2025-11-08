import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Progress, message, Typography, Space, Statistic, Timeline, Alert, Modal, List, Tag, Tabs, Input, Select, Divider } from 'antd';
import { GithubOutlined, SyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, EyeOutlined, StarOutlined, ForkOutlined, SearchOutlined, TrophyOutlined, MessageOutlined, SendOutlined, LinkOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from '../components/QualityBadge';
import CardSkeleton from '../components/CardSkeleton';
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const GitHubPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [repos, setRepos] = useState([]);
    const [stats, setStats] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [languageFilter, setLanguageFilter] = useState('all');
    const [updateHistory, setUpdateHistory] = useState([]);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    // 打开详细信息Modal
    const openDetailModal = (repo) => {
        setSelectedRepo(repo);
        setDetailModalVisible(true);
        setChatHistory([]);
        setChatMessage('');
    };
    // 发送聊天消息
    const sendChatMessage = async () => {
        if (!chatMessage.trim() || !selectedRepo)
            return;
        setChatLoading(true);
        try {
            const userMessage = chatMessage.trim();
            const response = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `${t('github.aboutThisRepo')} "${selectedRepo.title}"，${userMessage}`,
                    context: {
                        title: selectedRepo.title,
                        description: selectedRepo.description || selectedRepo.summary,
                        language: selectedRepo.language,
                        stars: selectedRepo.stars,
                        forks: selectedRepo.forks,
                        url: selectedRepo.original_url
                    }
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, {
                        user: userMessage,
                        ai: data.response || t('github.cannotAnswer')
                    }]);
                setChatMessage('');
            }
            else {
                message.error(t('github.sendMessageFailed'));
            }
        }
        catch (error) {
            console.error('Chat error:', error);
            message.error(t('github.sendMessageFailed'));
        }
        finally {
            setChatLoading(false);
        }
    };
    // 获取GitHub数据
    const fetchGitHubData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/cards/?source=github&limit=100');
            if (response.ok) {
                const data = await response.json();
                console.log('GitHub data sample:', data[0]); // 调试信息
                // 处理数据，适配 TechCard 结构
                const processedRepos = data.map((repo) => ({
                    ...repo,
                    url: repo.original_url || repo.url, // 使用 original_url 作为主要URL
                    description: repo.summary || repo.description || ''
                }));
                setRepos(processedRepos);
                // 模拟统计数据
                const mockStats = {
                    total_repos: processedRepos.length,
                    today_new: processedRepos.filter((repo) => new Date(repo.created_at).toDateString() === new Date().toDateString()).length,
                    trending_repos: processedRepos.filter((repo) => (repo.stars || 0) > 1000).length,
                    top_languages: ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust'],
                    last_update: new Date().toISOString()
                };
                setStats(mockStats);
            }
        }
        catch (error) {
            console.error('Failed to fetch GitHub data:', error);
            message.error('Failed to fetch GitHub data');
        }
        finally {
            setLoading(false);
        }
    };
    // 更新GitHub数据
    const updateGitHubData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/sources/collect/github', { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                message.success(`GitHub data update completed! Retrieved ${result.count || 0} new repositories`);
                // 添加更新历史
                setUpdateHistory(prev => [{
                        time: new Date().toLocaleString(),
                        count: result.count || 0,
                        status: 'success'
                    }, ...prev.slice(0, 9)]);
                await fetchGitHubData();
            }
            else {
                throw new Error('Update failed');
            }
        }
        catch (error) {
            message.error('Failed to update GitHub data');
            setUpdateHistory(prev => [{
                    time: new Date().toLocaleString(),
                    count: 0,
                    status: 'error'
                }, ...prev.slice(0, 9)]);
        }
        finally {
            setLoading(false);
        }
    };
    // 预览trending数据
    const previewTrending = async () => {
        try {
            const response = await fetch('/api/v1/sources/github/daily-trending');
            if (response.ok) {
                const data = await response.json();
                setPreviewData(data);
                setPreviewModalVisible(true);
            }
            else {
                message.error('Preview failed');
            }
        }
        catch (err) {
            message.error('Preview failed: ' + err);
        }
    };
    // 过滤仓库
    const filteredRepos = repos.filter(repo => {
        const matchesSearch = !searchQuery ||
            repo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'trending' && (repo.stars || 0) > 100) ||
            (activeTab === 'popular' && (repo.stars || 0) > 1000) ||
            (activeTab === 'recent' && new Date(repo.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        return matchesSearch && matchesLanguage && matchesTab;
    });
    useEffect(() => {
        fetchGitHubData();
    }, []);
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(GithubOutlined, { style: { color: '#24292e' } }), t('github.title')] }), _jsx(Text, { type: "secondary", children: t('github.subtitle') })] }), _jsxs(Space, { children: [_jsx(Button, { type: "primary", icon: _jsx(SyncOutlined, {}), onClick: updateGitHubData, loading: loading, children: t('github.updateData') }), _jsx(Button, { icon: _jsx(EyeOutlined, {}), onClick: previewTrending, children: t('github.trendingPreview') })] })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('github.totalRepos'), value: stats?.total_repos || 0, prefix: _jsx(GithubOutlined, { style: { color: '#24292e' } }), valueStyle: { color: '#24292e' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('github.todayNew'), value: stats?.today_new || 0, prefix: _jsx(CheckCircleOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('github.trendingRepos'), value: stats?.trending_repos || 0, prefix: _jsx(TrophyOutlined, { style: { color: '#fa8c16' } }), valueStyle: { color: '#fa8c16' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('github.topLanguage'), value: stats?.top_languages?.[0] || 'Python', prefix: _jsx(StarOutlined, { style: { color: '#faad14' } }), valueStyle: { color: '#faad14' } }) }) })] }), _jsx(Card, { style: { marginBottom: 16 }, children: _jsxs(Row, { gutter: 16, align: "middle", children: [_jsx(Col, { flex: "auto", children: _jsx(Search, { placeholder: t('github.searchPlaceholder'), allowClear: true, onChange: (e) => setSearchQuery(e.target.value), prefix: _jsx(SearchOutlined, {}) }) }), _jsx(Col, { children: _jsxs(Select, { value: languageFilter, onChange: setLanguageFilter, style: { width: 120 }, placeholder: t('github.languageFilter'), children: [_jsx(Option, { value: "all", children: t('github.allLanguages') }), _jsx(Option, { value: "Python", children: "Python" }), _jsx(Option, { value: "JavaScript", children: "JavaScript" }), _jsx(Option, { value: "TypeScript", children: "TypeScript" }), _jsx(Option, { value: "Go", children: "Go" }), _jsx(Option, { value: "Rust", children: "Rust" })] }) })] }) }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: `${t('github.all')} (${repos.length})` }, "all"), _jsx(TabPane, { tab: `${t('github.trending')} (${repos.filter(r => (r.stars || 0) > 100).length})` }, "trending"), _jsx(TabPane, { tab: `${t('github.popular')} (${repos.filter(r => (r.stars || 0) > 1000).length})` }, "popular"), _jsx(TabPane, { tab: t('github.recent') }, "recent")] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(Card, { title: `📦 ${t('github.repositories')}`, style: { minHeight: '600px' }, children: loading && repos.length === 0 ? (_jsx(CardSkeleton, { count: 5, grid: false })) : (_jsx(List, { dataSource: filteredRepos, renderItem: (repo) => (_jsx(List.Item, { actions: [
                                        _jsx(Button, { type: "primary", size: "small", icon: _jsx(EyeOutlined, {}), onClick: () => openDetailModal(repo), children: t('github.viewDetails') }, "detail"),
                                        _jsx(Button, { type: "link", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                                if (repo.url) {
                                                    window.open(repo.url, '_blank');
                                                }
                                                else {
                                                    message.warning(t('github.repoLinkUnavailable'));
                                                }
                                            }, children: t('common.view') }, "view")
                                    ], children: _jsx(List.Item.Meta, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, children: [_jsx(Text, { strong: true, children: repo.title }), repo.quality_score !== undefined && (_jsx(QualityBadge, { score: repo.quality_score, size: "small" })), repo.language && (_jsx(Tag, { color: "blue", size: "small", children: repo.language }))] }), description: _jsxs("div", { children: [_jsx(Paragraph, { ellipsis: { rows: 2 }, style: { marginBottom: 8 }, children: repo.description }), _jsxs(Space, { children: [_jsxs(Text, { type: "secondary", children: [_jsx(StarOutlined, {}), " ", repo.stars] }), _jsxs(Text, { type: "secondary", children: [_jsx(ForkOutlined, {}), " ", repo.forks] }), _jsx(Text, { type: "secondary", style: { fontSize: '12px' }, children: new Date(repo.created_at).toLocaleDateString() })] })] }) }) })), pagination: {
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} repositories`
                                } })) }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { title: `⏱️ ${t('github.updateHistory')}`, style: { marginBottom: 16, height: '300px', overflow: 'auto' }, children: updateHistory.length > 0 ? (_jsx(Timeline, { children: updateHistory.map((item, index) => (_jsxs(Timeline.Item, { dot: item.status === 'success' ?
                                            _jsx(CheckCircleOutlined, { style: { color: '#52c41a' } }) :
                                            _jsx(ExclamationCircleOutlined, { style: { color: '#ff4d4f' } }), children: [_jsxs("div", { children: [_jsx(Text, { strong: true, children: "GitHub" }), item.status === 'success' && (_jsxs(Text, { type: "success", children: [" (+", item.count, ")"] }))] }), _jsx("div", { style: { fontSize: '12px', color: '#999' }, children: item.time })] }, index))) })) : (_jsx("div", { style: { textAlign: 'center', padding: '40px', color: '#999' }, children: t('github.noUpdateRecords') })) }), _jsx(Card, { title: `📊 ${t('github.languageStats')}`, children: _jsx("div", { children: stats?.top_languages?.map((lang, index) => (_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: index < (stats.top_languages?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none'
                                        }, children: [_jsx(Text, { children: lang }), _jsx(Progress, { percent: Math.max(10, 100 - index * 20), size: "small", style: { width: '100px' }, showInfo: false })] }, lang))) }) })] })] }), _jsx(Modal, { title: t('dataSources.previewTitle'), open: previewModalVisible, onCancel: () => setPreviewModalVisible(false), width: 800, footer: [
                    _jsx(Button, { onClick: () => setPreviewModalVisible(false), children: t('dataSources.close') }, "close"),
                    _jsx(Button, { type: "primary", onClick: () => {
                            setPreviewModalVisible(false);
                            updateGitHubData();
                        }, children: t('dataSources.saveData') }, "update")
                ], children: previewData && (_jsxs("div", { children: [_jsx(Alert, { message: `Found ${previewData.total_count || 0} trending projects`, description: "Below is a preview of today's latest trending projects", type: "info", style: { marginBottom: 16 } }), previewData.python_trending && previewData.python_trending.length > 0 && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 4, children: "Python Projects" }), previewData.python_trending.slice(0, 5).map((repo, index) => (_jsxs("div", { style: { padding: '8px 0', borderBottom: '1px solid #f0f0f0' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Text, { strong: true, children: repo.title }), _jsxs(Space, { children: [_jsxs(Text, { children: ["\u2B50 ", repo.stars] }), _jsxs(Text, { type: "secondary", children: ["Score: ", repo.trending_score?.toFixed(1)] })] })] }), _jsx(Text, { type: "secondary", style: { fontSize: '12px' }, children: repo.description })] }, index)))] }))] })) }), _jsx(Modal, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(GithubOutlined, { style: { color: '#24292e' } }), "\u4ED3\u5E93\u8BE6\u7EC6\u4FE1\u606F"] }), open: detailModalVisible, onCancel: () => setDetailModalVisible(false), width: 900, footer: null, style: { top: 20 }, children: selectedRepo && (_jsxs("div", { children: [_jsxs(Card, { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 4, style: { marginBottom: 16 }, children: selectedRepo.title }), _jsxs("div", { style: { marginBottom: 12 }, children: [selectedRepo.language && (_jsx(Tag, { color: "blue", children: selectedRepo.language })), _jsxs(Tag, { color: "gold", children: [_jsx(StarOutlined, {}), " ", selectedRepo.stars, " stars"] }), _jsxs(Tag, { color: "green", children: [_jsx(ForkOutlined, {}), " ", selectedRepo.forks, " forks"] })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('github.createTime') }), _jsx(Text, { children: selectedRepo.created_at ? new Date(selectedRepo.created_at).toLocaleDateString() : t('zenn.unknown') })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx(Title, { level: 5, children: t('github.fullDescription') }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', textAlign: 'justify' }, children: selectedRepo.description || selectedRepo.summary || t('github.noDescription') })] }), _jsx(Divider, {}), _jsx("div", { style: { display: 'flex', gap: 12 }, children: _jsx(Button, { type: "primary", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                            if (selectedRepo.original_url) {
                                                window.open(selectedRepo.original_url, '_blank');
                                            }
                                        }, disabled: !selectedRepo.original_url, children: "\u67E5\u770B\u4ED3\u5E93" }) })] }), _jsxs(Card, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(MessageOutlined, { style: { color: '#1890ff' } }), "\u5173\u4E8E\u8FD9\u4E2A\u4ED3\u5E93\u7684\u95EE\u7B54"] }), children: [_jsx("div", { style: { maxHeight: 300, overflowY: 'auto', marginBottom: 16 }, children: chatHistory.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: 20 }, children: "\u60A8\u53EF\u4EE5\u95EE\u6211\u5173\u4E8E\u8FD9\u4E2AGitHub\u4ED3\u5E93\u7684\u4EFB\u4F55\u95EE\u9898" })) : (chatHistory.map((chat, index) => (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsxs("div", { style: {
                                                    backgroundColor: '#e6f7ff',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    marginBottom: 8
                                                }, children: [_jsx(Text, { strong: true, children: "\u60A8: " }), _jsx(Text, { children: chat.user })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#f6ffed',
                                                    padding: 8,
                                                    borderRadius: 6
                                                }, children: [_jsx(Text, { strong: true, style: { color: '#52c41a' }, children: "AI: " }), _jsx(Text, { children: chat.ai })] })] }, index)))) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Input, { value: chatMessage, onChange: (e) => setChatMessage(e.target.value), placeholder: t('github.askAboutRepo'), onPressEnter: sendChatMessage, disabled: chatLoading }), _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: sendChatMessage, loading: chatLoading, disabled: !chatMessage.trim(), children: "\u53D1\u9001" })] })] })] })) })] }));
};
export default GitHubPage;
