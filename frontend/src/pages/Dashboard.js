import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button, Tag, Space, Modal, message, Tabs, Input, Statistic, List, Skeleton } from 'antd';
import { GithubOutlined, FileTextOutlined, RobotOutlined, SyncOutlined, TranslationOutlined, SettingOutlined, StarOutlined, ForkOutlined, EyeOutlined, CloudDownloadOutlined, LinkOutlined, FireOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from '../components/QualityBadge';
import SmartSearch from '../components/SmartSearch';
import RecommendationPanel from '../components/RecommendationPanel';
import SearchResultList from '../components/SearchResultList';
import CardSkeleton from '../components/CardSkeleton';
const { Title, Paragraph, Text } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const Dashboard = () => {
    const { t, language } = useLanguage();
    const [cards, setCards] = useState([]);
    const [filteredCards, setFilteredCards] = useState([]);
    const [loading, setLoading] = useState(true);
    // 翻译summary中的中文标签
    const translateSummary = (summary) => {
        if (!summary)
            return summary;
        // 根据当前语言翻译标签
        const translations = {
            'zh-CN': {
                '作者:': '作者:',
                '点赞:': '点赞:',
                '关键词:': '关键词:',
                'Author:': '作者:',
                'Likes:': '点赞:',
                'Keyword:': '关键词:'
            },
            'en-US': {
                '作者:': 'Author:',
                '点赞:': 'Likes:',
                '关键词:': 'Keyword:',
                'Author:': 'Author:',
                'Likes:': 'Likes:',
                'Keyword:': 'Keyword:'
            },
            'ja-JP': {
                '作者:': '著者:',
                '点赞:': 'いいね:',
                '关键词:': 'キーワード:',
                'Author:': '著者:',
                'Likes:': 'いいね:',
                'Keyword:': 'キーワード:'
            }
        };
        let translatedSummary = summary;
        const langTranslations = translations[language] || translations['en-US'];
        Object.entries(langTranslations).forEach(([from, to]) => {
            translatedSummary = translatedSummary.replace(new RegExp(from, 'g'), to);
        });
        return translatedSummary;
    };
    const [error, setError] = useState(null);
    const [languages, setLanguages] = useState({});
    const [currentLanguage, setCurrentLanguage] = useState('zh');
    const [translationLoading, setTranslationLoading] = useState(false);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCard, setSelectedCard] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchMode, setSearchMode] = useState('keyword');
    // 使用 React Query 优化数据获取（已注释，改用新的 useCards hook）
    const fetchCards = async (source) => {
        try {
            setLoading(true);
            let url = '/api/v1/cards/?limit=50';
            if (source && source !== 'all') {
                url += `&source=${source}`;
            }
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setCards(data);
                setError(null);
            }
            else {
                setError('Failed to fetch cards');
            }
        }
        catch (err) {
            setError('Network error: ' + err);
        }
        finally {
            setLoading(false);
        }
    };
    // 过滤卡片
    const filterCards = () => {
        let filtered = cards;
        // 按来源过滤
        if (activeTab !== 'all') {
            filtered = filtered.filter(card => card.source === activeTab);
        }
        // 按搜索词过滤
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(card => card.title.toLowerCase().includes(query) ||
                card.summary?.toLowerCase().includes(query) ||
                card.chinese_tags?.some(tag => tag.toLowerCase().includes(query)) ||
                card.ai_category?.some(cat => cat.toLowerCase().includes(query)) ||
                card.tech_stack?.some(tech => tech.toLowerCase().includes(query)));
        }
        setFilteredCards(filtered);
    };
    // 显示详情
    const showDetail = (card) => {
        setSelectedCard(card);
        setDetailModalVisible(true);
    };
    const triggerDataCollection = async () => {
        try {
            const response = await fetch('/api/v1/sources/collect', { method: 'POST' });
            if (response.ok) {
                alert('Data collection started. Please refresh the page after a moment to see new content');
            }
        }
        catch (err) {
            alert('Failed to start data collection: ' + err);
        }
    };
    const fetchLanguages = async () => {
        try {
            const response = await fetch('/api/v1/languages');
            if (response.ok) {
                const data = await response.json();
                setLanguages(data.languages);
                setCurrentLanguage(data.current_language);
            }
        }
        catch (err) {
            console.error('Failed to fetch languages:', err);
        }
    };
    const fetchServiceStatus = async () => {
        try {
            // 获取token (优先从localStorage,然后从sessionStorage)
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await fetch('/api/v1/status', {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });
            if (response.ok) {
                const data = await response.json();
                setServiceStatus(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch service status:', err);
        }
    };
    const handleLanguageChange = async (language) => {
        try {
            const response = await fetch('/api/v1/language/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language })
            });
            if (response.ok) {
                setCurrentLanguage(language);
                message.success(`语言已切换为${languages[language]?.name}`);
            }
        }
        catch (err) {
            message.error('Language switch failed');
        }
    };
    const translateCard = async (cardId) => {
        if (!serviceStatus?.ai_service_available) {
            message.warning('Cannot translate because AI service is not configured');
            return;
        }
        try {
            setTranslationLoading(true);
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await fetch('/api/v1/translate/card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ card_id: cardId, target_language: currentLanguage })
            });
            if (response.ok) {
                const data = await response.json();
                Modal.info({
                    title: t('dashboard.translationResult'),
                    content: (_jsxs("div", { children: [_jsx("p", { children: _jsx("strong", { children: t('dashboard.originalSummary') }) }), _jsx("p", { children: data.original_summary }), _jsx("p", { children: _jsx("strong", { children: t('dashboard.translatedSummary') }) }), _jsx("p", { children: data.translated_summary }), data.translated_trial_suggestion && (_jsxs(_Fragment, { children: [_jsx("p", { children: _jsx("strong", { children: t('dashboard.trialSuggestion') }) }), _jsx("p", { children: data.translated_trial_suggestion })] }))] })),
                    width: 600
                });
            }
            else {
                message.error('Translation failed');
            }
        }
        catch (err) {
            message.error('Translation failed: ' + err);
        }
        finally {
            setTranslationLoading(false);
        }
    };
    useEffect(() => {
        fetchCards();
        fetchLanguages();
        fetchServiceStatus();
    }, []);
    // 当cards、activeTab或searchQuery变化时重新过滤
    useEffect(() => {
        filterCards();
    }, [cards, activeTab, searchQuery]);
    const getSourceIcon = (source) => {
        switch (source) {
            case 'github':
                return _jsx(GithubOutlined, {});
            case 'arxiv':
                return _jsx(FileTextOutlined, {});
            case 'huggingface':
                return _jsx(RobotOutlined, {});
            default:
                return null;
        }
    };
    const getSourceColor = (source) => {
        switch (source) {
            case 'github':
                return '#24292e';
            case 'arxiv':
                return '#b31b1b';
            case 'huggingface':
                return '#ff6f00';
            default:
                return '#1890ff';
        }
    };
    // 初次加载显示骨架屏（更好的用户体验）
    if (loading && cards.length === 0) {
        return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 24 }, children: [_jsx(Skeleton.Input, { active: true, style: { width: 200, height: 32, marginBottom: 16 } }), _jsx(Skeleton.Input, { active: true, style: { width: '100%', height: 40, marginBottom: 16 } }), _jsxs(Space, { children: [_jsx(Skeleton.Button, { active: true }), _jsx(Skeleton.Button, { active: true })] })] }), _jsx("div", { style: { marginBottom: 24 }, children: _jsxs(Space, { children: [_jsx(Skeleton.Button, { active: true, style: { width: 100 } }), _jsx(Skeleton.Button, { active: true, style: { width: 100 } }), _jsx(Skeleton.Button, { active: true, style: { width: 100 } }), _jsx(Skeleton.Button, { active: true, style: { width: 100 } })] }) }), _jsxs(Row, { gutter: 24, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(CardSkeleton, { count: 6, grid: true }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { size: "small", style: { marginBottom: 16 }, children: _jsx(Skeleton, { active: true }) }), _jsx(Card, { size: "small", style: { marginBottom: 16 }, children: _jsx(Skeleton, { active: true }) })] })] })] }));
    }
    // 保存到Notion
    const saveToNotion = async (card) => {
        try {
            const response = await fetch('/api/v1/notion/save-card', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_id: card.id })
            });
            if (response.ok) {
                message.success(t('dashboard.savedToNotion'));
                setDetailModalVisible(false);
            }
            else {
                message.error('Save failed');
            }
        }
        catch (err) {
            message.error('Save failed: ' + err);
        }
    };
    // 处理智能搜索
    const handleSmartSearch = async (query, mode) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setSearchLoading(true);
        setSearchMode(mode);
        try {
            const response = await fetch('/api/v1/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    mode,
                    user_id: 1, // TODO: 使用实际登录用户ID
                    limit: 20
                })
            });
            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results || []);
                if (data.results.length === 0) {
                    message.info(t('search.noResults'));
                }
            }
            else {
                message.error(t('search.noResults'));
                setSearchResults([]);
            }
        }
        catch (error) {
            console.error('Search failed:', error);
            message.error('Search failed');
            setSearchResults([]);
        }
        finally {
            setSearchLoading(false);
        }
    };
    // 处理搜索结果卡片点击
    const handleSearchResultClick = (cardId) => {
        const card = cards.find(c => c.id === cardId);
        if (card) {
            showDetail(card);
        }
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 24 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx(Title, { level: 2, children: t('dashboard.title') }), _jsx(Space, { children: serviceStatus && (_jsxs(Tag, { color: serviceStatus.ai_service_available ? 'green' : 'red', children: [t('dashboard.aiService'), ": ", serviceStatus.ai_service_available ? t('dashboard.connected') : t('dashboard.notConfigured')] })) })] }), _jsx("div", { style: { marginBottom: 16 }, children: _jsx(SmartSearch, { onSearch: handleSmartSearch, loading: searchLoading }) }), _jsx("div", { style: { marginBottom: 16 }, children: _jsxs(Space, { className: "header-actions", children: [_jsx(Button, { type: "primary", icon: _jsx(SyncOutlined, {}), onClick: () => fetchCards(activeTab === 'all' ? undefined : activeTab), children: t('dashboard.refresh') }), _jsx(Button, { icon: _jsx(SyncOutlined, {}), onClick: triggerDataCollection, children: t('dashboard.collectNewData') })] }) })] }), error && (_jsx(Alert, { message: t('dashboard.error'), description: error, type: "error", showIcon: true, style: { marginBottom: 24 } })), searchResults.length > 0 ? (_jsx("div", { children: _jsx(SearchResultList, { results: searchResults, loading: searchLoading, intent: searchMode === 'ai' ? 'analyze' : 'query', totalCount: searchResults.length, onCardClick: handleSearchResultClick }) })) : (_jsxs(_Fragment, { children: [_jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(SettingOutlined, {}), t('dashboard.all'), " (", cards.length, ")"] }) }, "all"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(GithubOutlined, {}), "GitHub (", cards.filter(c => c.source === 'github').length, ")"] }) }, "github"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(FileTextOutlined, {}), "arXiv (", cards.filter(c => c.source === 'arxiv').length, ")"] }) }, "arxiv"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(RobotOutlined, {}), "Hugging Face (", cards.filter(c => c.source === 'huggingface').length, ")"] }) }, "huggingface")] }), loading && cards.length > 0 && (_jsxs("div", { style: { marginTop: 16, textAlign: 'center' }, children: [_jsx(Spin, { size: "small" }), _jsx(Text, { type: "secondary", style: { marginLeft: 8 }, children: t('common.loading') })] })), filteredCards.length === 0 && !loading && (_jsx(Alert, { message: t('dashboard.noData'), description: cards.length === 0 ? t('dashboard.noDataDescription1') : t('dashboard.noDataDescription2'), type: "info", showIcon: true })), _jsxs(Row, { gutter: 24, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(Row, { gutter: [16, 16], children: filteredCards.map((card) => (_jsx(Col, { xs: 24, sm: 12, children: _jsxs(Card, { hoverable: true, size: "small", title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }, children: [_jsx("span", { style: { color: getSourceColor(card.source) }, children: getSourceIcon(card.source) }), _jsx("span", { style: { fontSize: '14px', fontWeight: 'normal' }, children: card.title.length > 30 ? card.title.substring(0, 30) + '...' : card.title }), card.quality_score !== undefined && (_jsx(QualityBadge, { score: card.quality_score, size: "small", showLabel: false }))] }), extra: _jsx(Tag, { color: getSourceColor(card.source), children: card.source.toUpperCase() }), actions: [
                                                _jsx(Button, { type: "text", size: "small", icon: _jsx(EyeOutlined, {}), onClick: () => showDetail(card), style: { fontSize: '12px' }, children: t('dashboard.details') }),
                                                _jsx(Button, { type: "text", size: "small", icon: _jsx(LinkOutlined, {}), onClick: () => window.open(card.original_url, '_blank'), style: { fontSize: '12px' }, children: t('dashboard.viewOriginal') }),
                                                _jsx(Button, { type: "text", size: "small", icon: _jsx(TranslationOutlined, {}), onClick: () => translateCard(card.id), loading: translationLoading, disabled: !serviceStatus?.ai_service_available, style: { fontSize: '12px' }, children: t('dashboard.translate') })
                                            ], children: [card.source === 'github' && (_jsxs("div", { style: { marginBottom: 12, display: 'flex', gap: 12 }, children: [card.stars !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(StarOutlined, { style: { color: '#faad14' } }), _jsx(Text, { style: { fontSize: '12px' }, children: card.stars })] })), card.forks !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(ForkOutlined, { style: { color: '#1890ff' } }), _jsx(Text, { style: { fontSize: '12px' }, children: card.forks })] })), card.license && (_jsx(Tag, { size: "small", color: "geekblue", children: card.license }))] })), card.summary && (_jsx(Paragraph, { ellipsis: { rows: 3, expandable: false }, style: { fontSize: '12px', marginBottom: 12 }, children: translateSummary(card.summary) })), card.ai_category && card.ai_category.length > 0 && (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsxs(Text, { style: { fontSize: '10px', color: '#666' }, children: [t('dashboard.aiCategory'), ": "] }), card.ai_category.slice(0, 2).map((cat, index) => (_jsx(Tag, { color: "purple", style: { fontSize: '10px' }, children: cat }, index))), card.ai_category.length > 2 && (_jsxs(Tag, { style: { fontSize: '10px' }, children: ["+", card.ai_category.length - 2] }))] })), card.tech_stack && card.tech_stack.length > 0 && (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsxs(Text, { style: { fontSize: '10px', color: '#666' }, children: [t('dashboard.techStack'), ": "] }), card.tech_stack.slice(0, 3).map((tech, index) => (_jsx(Tag, { color: "blue", style: { fontSize: '10px' }, children: tech }, index))), card.tech_stack.length > 3 && (_jsxs(Tag, { style: { fontSize: '10px' }, children: ["+", card.tech_stack.length - 3] }))] })), card.chinese_tags && card.chinese_tags.length > 0 && (_jsxs("div", { style: { marginBottom: 8 }, children: [_jsxs(Text, { style: { fontSize: '10px', color: '#666' }, children: [t('dashboard.tags'), ": "] }), card.chinese_tags.slice(0, 2).map((tag, index) => (_jsx(Tag, { color: "green", style: { fontSize: '10px' }, children: tag }, index))), card.chinese_tags.length > 2 && (_jsxs(Tag, { style: { fontSize: '10px' }, children: ["+", card.chinese_tags.length - 2] }))] })), _jsx("div", { style: { fontSize: '10px', color: '#999', marginTop: 8 }, children: new Date(card.created_at).toLocaleDateString('zh-CN') })] }) }, card.id))) }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { title: _jsxs("span", { children: [_jsx(RiseOutlined, {}), " ", t('dashboard.statistics')] }), style: { marginBottom: 16 }, size: "small", children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Statistic, { title: t('dashboard.total'), value: cards.length, prefix: _jsx(SettingOutlined, {}) }) }), _jsx(Col, { span: 12, children: _jsx(Statistic, { title: "GitHub", value: cards.filter(c => c.source === 'github').length, prefix: _jsx(GithubOutlined, {}), valueStyle: { color: '#24292e' } }) }), _jsx(Col, { span: 12, style: { marginTop: 16 }, children: _jsx(Statistic, { title: "arXiv", value: cards.filter(c => c.source === 'arxiv').length, prefix: _jsx(FileTextOutlined, {}), valueStyle: { color: '#b31b1b' } }) }), _jsx(Col, { span: 12, style: { marginTop: 16 }, children: _jsx(Statistic, { title: "HuggingFace", value: cards.filter(c => c.source === 'huggingface').length, prefix: _jsx(RobotOutlined, {}), valueStyle: { color: '#ff6f00' } }) })] }) }), _jsx(Card, { title: _jsxs("span", { children: [_jsx(TrophyOutlined, {}), " ", t('dashboard.highQuality')] }), style: { marginBottom: 16 }, size: "small", children: _jsx(List, { size: "small", dataSource: cards
                                                .filter(c => c.quality_score && c.quality_score >= 7.0)
                                                .sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0))
                                                .slice(0, 5), renderItem: (card) => (_jsx(List.Item, { style: { cursor: 'pointer', padding: '8px 0' }, onClick: () => showDetail(card), children: _jsxs("div", { style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }, children: [_jsx(Text, { ellipsis: true, style: { flex: 1, fontSize: '12px' }, children: card.title }), card.quality_score !== undefined && (_jsx(QualityBadge, { score: card.quality_score, size: "small", showLabel: false }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Tag, { color: getSourceColor(card.source), style: { fontSize: '10px', margin: 0 }, children: card.source }), _jsx(Text, { type: "secondary", style: { fontSize: '10px' }, children: new Date(card.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) })] })] }) })) }) }), _jsx(Card, { title: _jsxs("span", { children: [_jsx(FireOutlined, {}), " ", t('dashboard.hotTags')] }), size: "small", style: { marginBottom: 16 }, children: (() => {
                                            const tagCount = {};
                                            cards.forEach(card => {
                                                card.chinese_tags?.forEach(tag => {
                                                    tagCount[tag] = (tagCount[tag] || 0) + 1;
                                                });
                                                card.ai_category?.forEach(cat => {
                                                    tagCount[cat] = (tagCount[cat] || 0) + 1;
                                                });
                                            });
                                            const sortedTags = Object.entries(tagCount)
                                                .sort((a, b) => b[1] - a[1])
                                                .slice(0, 12);
                                            return (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: 8 }, children: sortedTags.map(([tag, count]) => (_jsxs(Tag, { color: "blue", style: { marginBottom: 0, cursor: 'pointer' }, onClick: () => setSearchQuery(tag), children: [tag, " (", count, ")"] }, tag))) }));
                                        })() }), _jsx(RecommendationPanel, { userId: 1, limit: 10, onCardClick: handleSearchResultClick })] })] })] })), _jsx(Modal, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { color: getSourceColor(selectedCard?.source || '') }, children: getSourceIcon(selectedCard?.source || '') }), _jsx("span", { children: selectedCard?.title })] }), open: detailModalVisible, onCancel: () => setDetailModalVisible(false), width: 800, footer: [
                    _jsx(Button, { onClick: () => setDetailModalVisible(false), children: t('dashboard.close') }, "close"),
                    _jsx(Button, { onClick: () => window.open(selectedCard?.original_url, '_blank'), children: t('dashboard.viewOriginal') }, "original"),
                    _jsx(Button, { type: "primary", icon: _jsx(CloudDownloadOutlined, {}), onClick: () => selectedCard && saveToNotion(selectedCard), children: t('dashboard.saveToNotion') }, "notion")
                ], children: selectedCard && (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs(Space, { size: "large", children: [_jsx(Tag, { color: getSourceColor(selectedCard.source), children: selectedCard.source.toUpperCase() }), selectedCard.source === 'github' && (_jsxs(_Fragment, { children: [selectedCard.stars !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(StarOutlined, { style: { color: '#faad14' } }), _jsxs(Text, { children: [selectedCard.stars.toLocaleString(), " Stars"] })] })), selectedCard.forks !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(ForkOutlined, { style: { color: '#1890ff' } }), _jsxs(Text, { children: [selectedCard.forks.toLocaleString(), " Forks"] })] })), selectedCard.license && (_jsx(Tag, { color: "geekblue", children: selectedCard.license }))] }))] }) }), selectedCard.summary && (_jsxs("div", { style: { marginBottom: 24 }, children: [_jsx(Title, { level: 4, children: t('dashboard.projectSummary') }), _jsx(Paragraph, { children: selectedCard.summary })] })), selectedCard.ai_category && selectedCard.ai_category.length > 0 && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 5, children: t('dashboard.aiClassification') }), _jsx(Space, { wrap: true, children: selectedCard.ai_category.map((cat, index) => (_jsx(Tag, { color: "purple", children: cat }, index))) })] })), selectedCard.tech_stack && selectedCard.tech_stack.length > 0 && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 5, children: t('dashboard.technologyStack') }), _jsx(Space, { wrap: true, children: selectedCard.tech_stack.map((tech, index) => (_jsx(Tag, { color: "blue", children: tech }, index))) })] })), selectedCard.chinese_tags && selectedCard.chinese_tags.length > 0 && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 5, children: t('dashboard.projectTags') }), _jsx(Space, { wrap: true, children: selectedCard.chinese_tags.map((tag, index) => (_jsx(Tag, { color: "green", children: tag }, index))) })] })), selectedCard.trial_suggestion && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 5, children: t('dashboard.trialSuggestion') }), _jsx("div", { style: {
                                        padding: '16px',
                                        backgroundColor: '#f0f0f0',
                                        borderRadius: '8px',
                                        border: '1px solid #d9d9d9'
                                    }, children: _jsx(Paragraph, { children: selectedCard.trial_suggestion }) })] })), _jsxs("div", { style: { textAlign: 'right', color: '#999', fontSize: '12px' }, children: [t('dashboard.createTime'), ": ", new Date(selectedCard.created_at).toLocaleString('zh-CN')] })] })) })] }));
};
export default Dashboard;
