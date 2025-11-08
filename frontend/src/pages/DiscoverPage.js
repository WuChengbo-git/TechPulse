import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Select, Spin, Empty, Typography, Badge, message, } from 'antd';
import { StarOutlined, StarFilled, EyeOutlined, ReadOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, BookOutlined, } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const DiscoverPage = () => {
    const { t, language } = useLanguage();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedField, setSelectedField] = useState('all');
    const [sortBy, setSortBy] = useState('recommended');
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [favorites, setFavorites] = useState(new Set());
    const [hasMore, setHasMore] = useState(true);
    // 获取推荐卡片
    const fetchRecommendedCards = async () => {
        setLoading(true);
        setHasMore(true); // 重置 hasMore 状态
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await axios.get('/api/v1/recommend/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    limit: itemsPerPage,
                    field: selectedField === 'all' ? undefined : selectedField,
                    sort_by: sortBy,
                    translate_to: language, // 根据用户语言翻译
                },
            });
            const newCards = response.data.recommendations || response.data || [];
            setCards(newCards);
            // 如果返回的数据少于请求数量，说明没有更多了
            if (newCards.length < itemsPerPage) {
                setHasMore(false);
            }
        }
        catch (error) {
            console.error('Failed to fetch recommendations:', error);
            message.error(t('discover.loadFailed') || '加载推荐失败');
            // Fallback: 获取所有卡片
            try {
                const fallbackResponse = await axios.get('/api/v1/cards/', {
                    params: {
                        limit: itemsPerPage,
                        translate_to: language,
                    },
                });
                const fallbackCards = fallbackResponse.data || [];
                setCards(fallbackCards);
                if (fallbackCards.length < itemsPerPage) {
                    setHasMore(false);
                }
            }
            catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
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
            const response = await axios.get('/api/v1/recommend/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    limit: itemsPerPage,
                    skip: cards.length, // 使用当前卡片数量作为偏移量
                    field: selectedField === 'all' ? undefined : selectedField,
                    sort_by: sortBy,
                    translate_to: language,
                },
            });
            const newCards = response.data.recommendations || response.data || [];
            if (newCards.length === 0 || newCards.length < itemsPerPage) {
                setHasMore(false);
            }
            if (newCards.length > 0) {
                setCards([...cards, ...newCards]); // 追加新卡片
                message.success(t('discover.loadedMore') || `已加载 ${newCards.length} 条内容`);
            }
            else {
                message.info(t('discover.noMoreData') || '没有更多内容了');
            }
        }
        catch (error) {
            console.error('Failed to load more:', error);
            message.error(t('discover.loadMoreFailed') || '加载更多失败');
        }
        finally {
            setLoadingMore(false);
        }
    };
    useEffect(() => {
        fetchRecommendedCards();
    }, [selectedField, sortBy, itemsPerPage, language]);
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
            message.success(t('discover.unfavorited') || '已取消收藏');
        }
        else {
            newFavorites.add(cardId);
            message.success(t('discover.favorited') || '已收藏');
        }
        setFavorites(newFavorites);
        // TODO: 调用后端 API 保存收藏状态
    };
    // 快速查看（待实现模态框）
    const handleQuickView = (card) => {
        message.info('快速查看功能开发中...');
        // TODO: 打开 QuickViewModal
    };
    // 深度阅读（跳转详情页）
    const handleDeepRead = (card) => {
        window.location.href = `/detail/${card.id}`;
    };
    return (_jsxs("div", { style: { padding: '24px', maxWidth: '1200px', margin: '0 auto' }, children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsx(Title, { level: 2, children: t('discover.title') || '🎯 今日精选' }), _jsx(Text, { type: "secondary", children: t('discover.subtitle') || '为你精选的技术情报' })] }), _jsx(Card, { style: { marginBottom: '24px' }, children: _jsxs(Space, { wrap: true, size: "middle", children: [_jsxs(Space, { children: [_jsxs(Text, { strong: true, children: [t('discover.field') || '领域', ":"] }), _jsxs(Space, { size: "small", wrap: true, children: [_jsx(Tag, { color: selectedField === 'all' ? 'blue' : 'default', style: { cursor: 'pointer' }, onClick: () => setSelectedField('all'), children: t('discover.all') || '全部' }), _jsx(Tag, { color: selectedField === 'llm' ? 'blue' : 'default', style: { cursor: 'pointer' }, onClick: () => setSelectedField('llm'), children: t('discover.llm') || 'LLM' }), _jsx(Tag, { color: selectedField === 'cv' ? 'blue' : 'default', style: { cursor: 'pointer' }, onClick: () => setSelectedField('cv'), children: t('discover.cv') || '计算机视觉' }), _jsx(Tag, { color: selectedField === 'nlp' ? 'blue' : 'default', style: { cursor: 'pointer' }, onClick: () => setSelectedField('nlp'), children: t('discover.nlp') || 'NLP' }), _jsx(Tag, { color: selectedField === 'tools' ? 'blue' : 'default', style: { cursor: 'pointer' }, onClick: () => setSelectedField('tools'), children: t('discover.tools') || '工具库' })] })] }), _jsxs(Space, { children: [_jsxs(Text, { strong: true, children: [t('discover.sortBy') || '排序', ":"] }), _jsxs(Select, { value: sortBy, onChange: setSortBy, style: { width: 120 }, children: [_jsx(Option, { value: "recommended", children: t('discover.recommended') || '推荐度' }), _jsx(Option, { value: "latest", children: t('discover.latest') || '最新' }), _jsx(Option, { value: "hot", children: t('discover.hot') || '最热' }), _jsx(Option, { value: "stars", children: t('discover.stars') || 'Star数' })] })] }), _jsxs(Space, { children: [_jsxs(Text, { strong: true, children: [t('discover.itemsPerPage') || '显示', ":"] }), _jsxs(Select, { value: itemsPerPage, onChange: setItemsPerPage, style: { width: 100 }, children: [_jsxs(Option, { value: 10, children: ["10 ", t('discover.items') || '条'] }), _jsxs(Option, { value: 20, children: ["20 ", t('discover.items') || '条'] }), _jsxs(Option, { value: 50, children: ["50 ", t('discover.items') || '条'] })] })] })] }) }), _jsx(Spin, { spinning: loading, children: cards.length === 0 && !loading ? (_jsx(Empty, { description: t('discover.noData') || '暂无数据' })) : (_jsx(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: cards.map((card) => (_jsxs(Card, { hoverable: true, style: { borderRadius: '8px' }, bodyStyle: { padding: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }, children: [_jsxs(Space, { size: "small", style: { flex: 1 }, children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(card.source), children: card.source }), offset: [0, 0] }), _jsx(Title, { level: 4, style: { margin: 0 }, children: card.translated_title || card.title })] }), _jsx(Button, { type: "text", icon: favorites.has(card.id) ? _jsx(StarFilled, { style: { color: '#faad14' } }) : _jsx(StarOutlined, {}), onClick: () => toggleFavorite(card.id) })] }), _jsxs(Space, { size: "middle", style: { marginBottom: '12px' }, children: [card.metadata?.author && (_jsx(Text, { type: "secondary", children: card.metadata.author })), card.metadata?.stars !== undefined && card.metadata?.stars !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B50 ", card.metadata.stars.toLocaleString()] })), card.metadata?.citations !== undefined && card.metadata?.citations !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDCDA \u5F15\u7528 ", card.metadata.citations] })), card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B07\uFE0F ", card.metadata.downloads.toLocaleString()] })), card.metadata?.likes !== undefined && card.metadata?.likes !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDC4D ", card.metadata.likes] })), card.created_at && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDD52 ", new Date(card.created_at).toLocaleDateString()] }))] }), _jsx(Paragraph, { ellipsis: { rows: 3, expandable: false }, style: { marginBottom: '12px' }, children: card.translated_summary || card.summary }), card.tags && card.tags.length > 0 && (_jsx("div", { style: { marginBottom: '12px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.tags.slice(0, 5).map((tag, index) => (_jsx(Tag, { children: tag }, index))) }) })), _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(EyeOutlined, {}), onClick: () => handleQuickView(card), children: t('discover.quickView') || '快速查看' }), _jsx(Button, { type: "primary", icon: _jsx(ReadOutlined, {}), onClick: () => handleDeepRead(card), children: t('discover.deepRead') || '深度阅读' })] }), card.translated_title && card.source.toLowerCase().includes('zenn') && (_jsx("div", { style: { marginTop: '12px' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83C\uDF10 ", t('discover.translatedFromJapanese') || 'AI翻译自日语原文'] }) }))] }, card.id))) })) }), !loading && cards.length > 0 && (_jsx("div", { style: { textAlign: 'center', marginTop: '24px' }, children: _jsx(Button, { size: "large", onClick: loadMoreCards, loading: loadingMore, disabled: !hasMore, children: hasMore ? (t('discover.loadMore') || '加载更多') : (t('discover.noMore') || '没有更多了') }) }))] }));
};
export default DiscoverPage;
