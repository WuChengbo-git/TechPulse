import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Tabs, Input, Select, DatePicker, Spin, Empty, Typography, Badge, message, Row, Col, } from 'antd';
import { StarOutlined, StarFilled, EyeOutlined, ReadOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, BookOutlined, SearchOutlined, FilterOutlined, } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const ExplorePage = () => {
    const { t, language } = useLanguage();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [favorites, setFavorites] = useState(new Set());
    const [hasMore, setHasMore] = useState(true);
    // 筛选条件
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedField, setSelectedField] = useState('all');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [minStars, setMinStars] = useState(undefined);
    const [sortBy, setSortBy] = useState('latest');
    const [itemsPerPage, setItemsPerPage] = useState(20);
    // 获取数据
    const fetchCards = async () => {
        setLoading(true);
        setHasMore(true); // 重置 hasMore 状态
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const params = {
                limit: itemsPerPage,
                sort_by: sortBy,
                translate_to: language,
            };
            // 添加数据源筛选
            if (activeTab !== 'all') {
                params.source = activeTab;
            }
            // 添加关键词搜索
            if (searchKeyword.trim()) {
                params.keyword = searchKeyword.trim();
            }
            // 添加领域筛选
            if (selectedField !== 'all') {
                params.field = selectedField;
            }
            // 添加语言筛选
            if (selectedLanguage !== 'all') {
                params.language = selectedLanguage;
            }
            // 添加日期范围筛选
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.start_date = dateRange[0].format('YYYY-MM-DD');
                params.end_date = dateRange[1].format('YYYY-MM-DD');
            }
            // 添加最小 Star 数筛选
            if (minStars !== undefined && minStars > 0) {
                params.min_stars = minStars;
            }
            const response = await axios.get('/api/v1/cards/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params,
            });
            const newCards = response.data || [];
            setCards(newCards);
            // 如果返回的数据少于请求数量，说明没有更多了
            if (newCards.length < itemsPerPage) {
                setHasMore(false);
            }
        }
        catch (error) {
            console.error('Failed to fetch cards:', error);
            message.error(t('explore.loadFailed') || '加载数据失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 加载更多卡片
    const loadMoreCards = async () => {
        if (!hasMore || loadingMore)
            return;
        setLoadingMore(true);
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const params = {
                limit: itemsPerPage,
                skip: cards.length, // 使用当前卡片数量作为偏移量
                sort_by: sortBy,
                translate_to: language,
            };
            // 添加数据源筛选
            if (activeTab !== 'all') {
                params.source = activeTab;
            }
            // 添加关键词搜索
            if (searchKeyword.trim()) {
                params.keyword = searchKeyword.trim();
            }
            // 添加领域筛选
            if (selectedField !== 'all') {
                params.field = selectedField;
            }
            // 添加语言筛选
            if (selectedLanguage !== 'all') {
                params.language = selectedLanguage;
            }
            // 添加日期范围筛选
            if (dateRange && dateRange[0] && dateRange[1]) {
                params.start_date = dateRange[0].format('YYYY-MM-DD');
                params.end_date = dateRange[1].format('YYYY-MM-DD');
            }
            // 添加最小 Star 数筛选
            if (minStars !== undefined && minStars > 0) {
                params.min_stars = minStars;
            }
            const response = await axios.get('/api/v1/cards/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params,
            });
            const newCards = response.data || [];
            if (newCards.length === 0 || newCards.length < itemsPerPage) {
                setHasMore(false);
            }
            if (newCards.length > 0) {
                setCards([...cards, ...newCards]); // 追加新卡片
                message.success(t('explore.loadedMore') || `已加载 ${newCards.length} 条内容`);
            }
            else {
                message.info(t('explore.noMoreData') || '没有更多内容了');
            }
        }
        catch (error) {
            console.error('Failed to load more:', error);
            message.error(t('explore.loadMoreFailed') || '加载更多失败');
        }
        finally {
            setLoadingMore(false);
        }
    };
    useEffect(() => {
        fetchCards();
    }, [activeTab, sortBy, itemsPerPage, language]);
    // 获取来源图标
    const getSourceIcon = (source) => {
        const lowerSource = source.toLowerCase();
        if (lowerSource.includes('github'))
            return _jsx(GithubOutlined, {});
        if (lowerSource.includes('arxiv'))
            return _jsx(FileTextOutlined, {});
        if (lowerSource.includes('huggingface') || lowerSource.includes('hf'))
            return _jsx(RobotOutlined, {});
        if (lowerSource.includes('zenn'))
            return _jsx(BookOutlined, {});
        return _jsx(FileTextOutlined, {});
    };
    // 切换收藏
    const toggleFavorite = async (cardId) => {
        const newFavorites = new Set(favorites);
        if (newFavorites.has(cardId)) {
            newFavorites.delete(cardId);
            message.success(t('explore.unfavorited') || '已取消收藏');
        }
        else {
            newFavorites.add(cardId);
            message.success(t('explore.favorited') || '已收藏');
        }
        setFavorites(newFavorites);
        // TODO: 调用后端 API 保存收藏状态
    };
    // 快速查看
    const handleQuickView = (card) => {
        message.info('快速查看功能开发中...');
        // TODO: 打开 QuickViewModal
    };
    // 深度阅读
    const handleDeepRead = (card) => {
        window.location.href = `/detail/${card.id}`;
    };
    // 重置筛选条件
    const resetFilters = () => {
        setSearchKeyword('');
        setSelectedField('all');
        setSelectedLanguage('all');
        setDateRange(null);
        setMinStars(undefined);
        setSortBy('latest');
    };
    // 应用筛选
    const applyFilters = () => {
        fetchCards();
    };
    // 标签页配置
    const tabItems = [
        {
            key: 'all',
            label: (_jsxs("span", { children: [_jsx(FilterOutlined, {}), " ", t('explore.allSources') || '全部数据源'] })),
        },
        {
            key: 'github',
            label: (_jsxs("span", { children: [_jsx(GithubOutlined, {}), " GitHub"] })),
        },
        {
            key: 'arxiv',
            label: (_jsxs("span", { children: [_jsx(FileTextOutlined, {}), " arXiv"] })),
        },
        {
            key: 'huggingface',
            label: (_jsxs("span", { children: [_jsx(RobotOutlined, {}), " HuggingFace"] })),
        },
        {
            key: 'zenn',
            label: (_jsxs("span", { children: [_jsx(BookOutlined, {}), " Zenn"] })),
        },
    ];
    return (_jsxs("div", { style: { padding: '24px', maxWidth: '1400px', margin: '0 auto' }, children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx(Title, { level: 2, children: t('explore.title') || '🔍 数据探索' }), _jsx(Text, { type: "secondary", children: t('explore.subtitle') || '探索所有技术数据源' })] }), _jsx(Card, { style: { marginBottom: '24px' }, children: _jsx(Tabs, { activeKey: activeTab, onChange: (key) => setActiveTab(key), items: tabItems }) }), _jsx(Card, { title: _jsxs(_Fragment, { children: [_jsx(FilterOutlined, {}), " ", t('explore.advancedFilters') || '高级筛选'] }), style: { marginBottom: '24px' }, children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, md: 12, children: _jsx(Space.Compact, { style: { width: '100%' }, children: _jsx(Input, { placeholder: t('explore.searchPlaceholder') || '搜索关键词...', value: searchKeyword, onChange: (e) => setSearchKeyword(e.target.value), onPressEnter: applyFilters, prefix: _jsx(SearchOutlined, {}) }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsxs(Select, { style: { width: '100%' }, value: selectedField, onChange: setSelectedField, placeholder: t('explore.selectField') || '选择领域', children: [_jsx(Option, { value: "all", children: t('explore.allFields') || '全部领域' }), _jsx(Option, { value: "llm", children: "LLM" }), _jsx(Option, { value: "cv", children: t('explore.cv') || '计算机视觉' }), _jsx(Option, { value: "nlp", children: "NLP" }), _jsx(Option, { value: "tools", children: t('explore.tools') || '工具库' }), _jsx(Option, { value: "ml", children: t('explore.ml') || '机器学习' })] }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsxs(Select, { style: { width: '100%' }, value: selectedLanguage, onChange: setSelectedLanguage, placeholder: t('explore.selectLanguage') || '选择语言', children: [_jsx(Option, { value: "all", children: t('explore.allLanguages') || '全部语言' }), _jsx(Option, { value: "python", children: "Python" }), _jsx(Option, { value: "javascript", children: "JavaScript" }), _jsx(Option, { value: "typescript", children: "TypeScript" }), _jsx(Option, { value: "go", children: "Go" }), _jsx(Option, { value: "rust", children: "Rust" }), _jsx(Option, { value: "java", children: "Java" }), _jsx(Option, { value: "cpp", children: "C++" })] }) }), _jsx(Col, { xs: 24, md: 12, children: _jsx(RangePicker, { style: { width: '100%' }, value: dateRange, onChange: setDateRange, placeholder: [
                                    t('explore.startDate') || '开始日期',
                                    t('explore.endDate') || '结束日期',
                                ] }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsxs(Select, { style: { width: '100%' }, value: minStars, onChange: setMinStars, placeholder: t('explore.minStars') || '最小 Star 数', children: [_jsx(Option, { value: undefined, children: t('explore.noLimit') || '不限' }), _jsx(Option, { value: 10, children: "10+" }), _jsx(Option, { value: 50, children: "50+" }), _jsx(Option, { value: 100, children: "100+" }), _jsx(Option, { value: 500, children: "500+" }), _jsx(Option, { value: 1000, children: "1000+" }), _jsx(Option, { value: 5000, children: "5000+" })] }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsxs(Select, { style: { width: '100%' }, value: sortBy, onChange: setSortBy, placeholder: t('explore.sortBy') || '排序方式', children: [_jsx(Option, { value: "latest", children: t('explore.latest') || '最新' }), _jsx(Option, { value: "hot", children: t('explore.hot') || '最热' }), _jsx(Option, { value: "stars", children: t('explore.stars') || 'Star 数' }), _jsx(Option, { value: "relevant", children: t('explore.relevant') || '相关度' })] }) }), _jsx(Col, { xs: 24, children: _jsxs(Space, { children: [_jsx(Button, { type: "primary", icon: _jsx(SearchOutlined, {}), onClick: applyFilters, children: t('explore.applyFilters') || '应用筛选' }), _jsx(Button, { onClick: resetFilters, children: t('explore.resetFilters') || '重置' }), _jsxs(Select, { value: itemsPerPage, onChange: setItemsPerPage, style: { width: 120 }, children: [_jsxs(Option, { value: 10, children: ["10 ", t('explore.items') || '条'] }), _jsxs(Option, { value: 20, children: ["20 ", t('explore.items') || '条'] }), _jsxs(Option, { value: 50, children: ["50 ", t('explore.items') || '条'] }), _jsxs(Option, { value: 100, children: ["100 ", t('explore.items') || '条'] })] })] }) })] }) }), _jsx(Spin, { spinning: loading, children: cards.length === 0 && !loading ? (_jsx(Empty, { description: t('explore.noData') || '暂无数据' })) : (_jsx(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: cards.map((card) => (_jsxs(Card, { hoverable: true, style: { borderRadius: '8px' }, bodyStyle: { padding: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }, children: [_jsxs(Space, { size: "small", style: { flex: 1 }, children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(card.source), children: card.source }), offset: [0, 0] }), _jsx(Title, { level: 4, style: { margin: 0 }, children: card.translated_title || card.title })] }), _jsx(Button, { type: "text", icon: favorites.has(card.id) ? _jsx(StarFilled, { style: { color: '#faad14' } }) : _jsx(StarOutlined, {}), onClick: () => toggleFavorite(card.id) })] }), _jsxs(Space, { size: "middle", style: { marginBottom: '12px' }, children: [card.metadata?.author && (_jsx(Text, { type: "secondary", children: card.metadata.author })), card.metadata?.language && (_jsx(Tag, { children: card.metadata.language })), card.metadata?.stars !== undefined && card.metadata?.stars !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B50 ", card.metadata.stars.toLocaleString()] })), card.metadata?.forks !== undefined && card.metadata?.forks !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDD31 ", card.metadata.forks.toLocaleString()] })), card.metadata?.citations !== undefined && card.metadata?.citations !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDCDA \u5F15\u7528 ", card.metadata.citations] })), card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B07\uFE0F ", card.metadata.downloads.toLocaleString()] })), card.metadata?.likes !== undefined && card.metadata?.likes !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDC4D ", card.metadata.likes] })), card.created_at && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDD52 ", new Date(card.created_at).toLocaleDateString()] }))] }), _jsx(Paragraph, { ellipsis: { rows: 3, expandable: false }, style: { marginBottom: '12px' }, children: card.translated_summary || card.summary }), card.tags && card.tags.length > 0 && (_jsx("div", { style: { marginBottom: '12px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.tags.slice(0, 8).map((tag, index) => (_jsx(Tag, { children: tag }, index))) }) })), _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(EyeOutlined, {}), onClick: () => handleQuickView(card), children: t('explore.quickView') || '快速查看' }), _jsx(Button, { type: "primary", icon: _jsx(ReadOutlined, {}), onClick: () => handleDeepRead(card), children: t('explore.deepRead') || '深度阅读' })] }), card.translated_title && card.source.toLowerCase().includes('zenn') && (_jsx("div", { style: { marginTop: '12px' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83C\uDF10 ", t('explore.translatedFromJapanese') || 'AI翻译自日语原文'] }) }))] }, card.id))) })) }), !loading && cards.length > 0 && (_jsx("div", { style: { textAlign: 'center', marginTop: '24px' }, children: _jsx(Button, { size: "large", onClick: loadMoreCards, loading: loadingMore, disabled: !hasMore, children: hasMore ? (t('explore.loadMore') || '加载更多') : (t('explore.noMore') || '没有更多了') }) }))] }));
};
export default ExplorePage;
