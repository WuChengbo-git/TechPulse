import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Tag, Timeline, Avatar, Button, Progress, Divider, Modal, Badge, Empty, Checkbox } from 'antd';
import { LineChartOutlined, StarOutlined, FireOutlined, ClockCircleOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, ArrowUpOutlined, LinkOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { translateTags } from '../utils/translateTags';
const { Title, Text, Paragraph } = Typography;
const Overview = () => {
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [recentCards, setRecentCards] = useState([]);
    const [trendingCards, setTrendingCards] = useState([]);
    const [loading, setLoading] = useState(true);
    // 保留modal相关状态以备需要时使用详情查看
    const [selectedCard, setSelectedCard] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    // 信息源选择状态
    const [selectedSources, setSelectedSources] = useState(['github', 'arxiv', 'huggingface', 'zenn']);
    // 热门标签翻译状态
    const [translatedTags, setTranslatedTags] = useState([]);
    // 不需要存储所有数据，直接过滤
    const fetchOverviewData = async () => {
        try {
            setLoading(true);
            // 获取卡片数据 - 增加更多数据用于筛选
            const recentRes = await fetch('/api/v1/cards/?limit=100');
            if (recentRes.ok) {
                const allData = await recentRes.json();
                // 直接过滤数据
                // 应用信息源过滤
                const filteredData = allData.filter((card) => selectedSources.includes(card.source));
                // 最新内容：按时间排序，取前10个
                const recentData = filteredData
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10);
                // 热门内容：按stars排序，排除已在最新内容中的项目
                const recentIds = new Set(recentData.map((card) => card.id));
                const trendingData = filteredData
                    .filter((card) => card.stars && card.stars > 10 && !recentIds.has(card.id))
                    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
                    .slice(0, 8);
                setRecentCards(recentData);
                setTrendingCards(trendingData);
                // 计算统计数据 - 基于过滤后的数据
                const sourceStats = filteredData.reduce((acc, card) => {
                    acc[card.source] = (acc[card.source] || 0) + 1;
                    return acc;
                }, {});
                const tagCounts = {};
                filteredData.forEach((card) => {
                    card.chinese_tags?.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                });
                const trending_tags = Object.entries(tagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 20)
                    .map(([tag, count]) => ({ tag, count }));
                const today = new Date().toDateString();
                const todayCards = filteredData.filter((card) => new Date(card.created_at).toDateString() === today);
                setStats({
                    total_cards: filteredData.length,
                    today_cards: todayCards.length,
                    sources_stats: sourceStats,
                    trending_tags
                });
            }
        }
        catch (err) {
            console.error('Failed to fetch overview data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchOverviewData();
    }, [selectedSources]); // 依赖信息源选择变化
    // 当语言或热门标签变化时翻译标签
    useEffect(() => {
        const handleTagTranslation = async () => {
            if (!stats?.trending_tags || stats.trending_tags.length === 0) {
                setTranslatedTags([]);
                return;
            }
            // 如果是中文，直接使用原标签
            if (language === 'zh-CN') {
                setTranslatedTags(stats.trending_tags);
                return;
            }
            // 翻译标签
            const tagTexts = stats.trending_tags.map(t => t.tag);
            const translated = await translateTags(tagTexts, language);
            // 组合翻译结果和计数
            const translatedWithCounts = stats.trending_tags.map((item, index) => ({
                tag: translated[index],
                count: item.count
            }));
            setTranslatedTags(translatedWithCounts);
        };
        handleTagTranslation();
    }, [language, stats?.trending_tags]);
    // 信息源选项
    const sourceOptions = [
        { label: 'GitHub', value: 'github', icon: _jsx(GithubOutlined, { style: { color: '#24292e' } }) },
        { label: 'arXiv', value: 'arxiv', icon: _jsx(FileTextOutlined, { style: { color: '#b31b1b' } }) },
        { label: 'Hugging Face', value: 'huggingface', icon: _jsx(RobotOutlined, { style: { color: '#ff6f00' } }) },
        { label: 'Zenn', value: 'zenn', icon: _jsx(EditOutlined, { style: { color: '#3ea8ff' } }) }
    ];
    const handleSourceChange = (sources) => {
        setSelectedSources(sources.length > 0 ? sources : ['github']); // 至少选择一个源
    };
    const selectAllSources = () => {
        setSelectedSources(['github', 'arxiv', 'huggingface', 'zenn']);
    };
    const clearAllSources = () => {
        setSelectedSources(['github']); // 默认保留GitHub
    };
    const getSourceIcon = (source) => {
        const iconMap = {
            github: _jsx(GithubOutlined, { style: { color: '#24292e' } }),
            arxiv: _jsx(FileTextOutlined, { style: { color: '#b31b1b' } }),
            huggingface: _jsx(RobotOutlined, { style: { color: '#ff6f00' } }),
            zenn: _jsx(EditOutlined, { style: { color: '#3ea8ff' } })
        };
        return iconMap[source] || null;
    };
    const getSourceName = (source) => {
        const nameMap = {
            github: 'GitHub',
            arxiv: 'arXiv',
            huggingface: 'Hugging Face',
            zenn: 'Zenn'
        };
        return nameMap[source] || source;
    };
    const handleCardClick = (card) => {
        setSelectedCard(card);
        setModalVisible(true);
    };
    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedCard(null);
    };
    if (loading) {
        return _jsx("div", { style: { textAlign: 'center', padding: '50px' }, children: t('overview.loading') });
    }
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }, children: [_jsxs("div", { children: [_jsx(Title, { level: 2, style: { marginBottom: 8 }, children: t('overview.title') }), _jsx(Text, { type: "secondary", children: t('overview.subtitle') })] }), _jsxs("div", { style: { minWidth: '300px' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, children: [_jsx(Text, { strong: true, children: t('overview.selectSources') }), _jsxs(Space, { children: [_jsx(Button, { type: "link", size: "small", onClick: selectAllSources, style: { padding: 0, height: 'auto' }, children: t('overview.selectAll') }), _jsx(Text, { type: "secondary", children: "|" }), _jsx(Button, { type: "link", size: "small", onClick: clearAllSources, style: { padding: 0, height: 'auto' }, children: t('overview.clearAll') })] })] }), _jsx(Checkbox.Group, { value: selectedSources, onChange: handleSourceChange, style: { width: '100%' }, children: _jsx(Row, { gutter: [8, 8], children: sourceOptions.map(option => (_jsx(Col, { span: 12, children: _jsx(Checkbox, { value: option.value, children: _jsxs(Space, { children: [option.icon, _jsx("span", { style: { fontSize: '12px' }, children: option.label })] }) }) }, option.value))) }) }), _jsxs(Text, { type: "secondary", style: { fontSize: '11px', marginTop: 4, display: 'block' }, children: ["\u5DF2\u9009\u62E9 ", selectedSources.length, " / ", sourceOptions.length, " \u4E2A\u6570\u636E\u6E90"] })] })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('overview.totalData'), value: stats?.total_cards || 0, valueStyle: { color: '#1890ff' }, prefix: _jsx(LineChartOutlined, {}), suffix: t('overview.count') }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('overview.todayNew'), value: stats?.today_cards || 0, valueStyle: { color: '#52c41a' }, prefix: _jsx(ArrowUpOutlined, {}), suffix: t('overview.count') }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('overview.hotProjects'), value: trendingCards.filter(c => (c.stars || 0) > 1000).length, valueStyle: { color: '#fa8c16' }, prefix: _jsx(FireOutlined, {}), suffix: t('overview.unit') }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('overview.dataSources'), value: Object.keys(stats?.sources_stats || {}).length, valueStyle: { color: '#722ed1' }, prefix: _jsx(ClockCircleOutlined, {}), suffix: t('overview.unit') }) }) })] }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('overview.dataSourceDistribution'), extra: _jsx(Button, { size: "small", children: t('overview.viewDetails') }), children: _jsx(Row, { gutter: [8, 8], children: Object.entries(stats?.sources_stats || {}).map(([source, count]) => (_jsx(Col, { span: 12, children: _jsxs("div", { style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            background: '#fafafa',
                                            borderRadius: '6px',
                                            marginBottom: '8px'
                                        }, children: [getSourceIcon(source), _jsxs("div", { style: { marginLeft: 8, flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx(Text, { strong: true, style: { fontSize: '12px' }, children: getSourceName(source) }), _jsx(Text, { style: { fontSize: '12px', color: '#1890ff' }, children: count })] }), _jsx(Progress, { percent: Math.round((count / (stats?.total_cards || 1)) * 100), size: "small", showInfo: false, strokeColor: "#1890ff" })] })] }) }, source))) }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('overview.hotTags'), extra: _jsx(Button, { size: "small", children: t('overview.tagCloud') }), children: _jsx("div", { style: { minHeight: '200px' }, children: translatedTags.length > 0 ? (_jsx(Space, { wrap: true, size: "small", children: translatedTags.slice(0, 20).map((tagInfo, index) => (_jsxs(Tag, { color: [
                                            'magenta', 'red', 'volcano', 'orange', 'gold',
                                            'lime', 'green', 'cyan', 'blue', 'geekblue',
                                            'purple'
                                        ][index % 11], style: {
                                            fontSize: `${Math.max(12, 16 - index * 0.3)}px`,
                                            padding: '4px 8px'
                                        }, children: [tagInfo.tag, " (", tagInfo.count, ")"] }, index))) })) : (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: '60px 0' }, children: t('overview.noTagData') })) }) }) })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('overview.latestContent'), extra: _jsx(Button, { size: "small", children: t('overview.viewAll') }), style: { height: '500px' }, styles: { body: { padding: '16px', paddingTop: '12px' } }, children: _jsx(Timeline, { style: {
                                    maxHeight: '400px',
                                    overflow: 'auto',
                                    paddingTop: '8px',
                                    paddingRight: '8px'
                                }, items: recentCards.map((card) => ({
                                    key: card.id,
                                    dot: (_jsx(Avatar, { size: "small", style: {
                                            backgroundColor: '#1890ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px'
                                        }, children: getSourceIcon(card.source) })),
                                    children: (_jsxs("div", { style: { marginBottom: 12, paddingLeft: '4px', cursor: 'pointer' }, onClick: () => card.url ? window.open(card.url, '_blank') : handleCardClick(card), children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }, children: [_jsx(Text, { strong: true, style: { fontSize: '13px', lineHeight: '1.4', flex: 1, minWidth: 0, color: '#1890ff' }, children: card.title.length > 35 ? card.title.substring(0, 35) + '...' : card.title }), _jsx(Tag, { color: "blue", style: { flexShrink: 0 }, children: card.source.toUpperCase() })] }), card.summary && (_jsx(Paragraph, { ellipsis: { rows: 2 }, style: {
                                                    fontSize: '11px',
                                                    color: '#666',
                                                    margin: '4px 0 6px 0',
                                                    lineHeight: '1.3'
                                                }, children: card.summary })), _jsxs("div", { style: {
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-end',
                                                    marginTop: 6,
                                                    gap: 8
                                                }, children: [_jsx("div", { style: { flex: 1 }, children: card.chinese_tags?.slice(0, 2).map((tag, i) => (_jsx(Tag, { color: "green", style: { marginBottom: 2, fontSize: '11px' }, children: tag }, i))) }), _jsx(Text, { type: "secondary", style: {
                                                            fontSize: '10px',
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }, children: new Date(card.created_at).toLocaleDateString() })] })] }))
                                })) }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('overview.hotProjectsRank'), extra: _jsx(Button, { size: "small", children: t('overview.viewAll') }), style: { height: '500px' }, children: _jsx("div", { style: { maxHeight: '400px', overflow: 'auto' }, children: trendingCards.length === 0 ? (_jsx(Empty, { description: t('overview.noTagData'), style: { padding: '60px 20px' } })) : (trendingCards.map((card, index) => (_jsx("div", { style: {
                                        padding: '12px 0',
                                        borderBottom: index < trendingCards.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        cursor: 'pointer'
                                    }, onClick: () => card.url ? window.open(card.url, '_blank') : handleCardClick(card), children: _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: 12 }, children: [_jsx("div", { style: {
                                                    minWidth: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    background: index < 3 ? ['#ff4d4f', '#fa8c16', '#fadb14'][index] : '#d9d9d9',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }, children: index + 1 }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }, children: _jsx(Text, { strong: true, style: { fontSize: '13px', color: '#1890ff' }, children: card.title.length > 30 ? card.title.substring(0, 30) + '...' : card.title }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }, children: [card.stars !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx(StarOutlined, { style: { color: '#faad14', fontSize: '12px' } }), _jsx(Text, { style: { fontSize: '11px' }, children: card.stars.toLocaleString() })] })), _jsx(Tag, { color: "blue", children: card.source.toUpperCase() })] }), card.summary && (_jsx(Paragraph, { ellipsis: { rows: 1 }, style: { fontSize: '11px', color: '#666', margin: 0 }, children: card.summary }))] })] }) }, card.id)))) }) }) })] }), _jsx(Modal, { title: null, open: modalVisible, onCancel: handleModalClose, footer: null, width: 700, children: selectedCard && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: 20 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }, children: [getSourceIcon(selectedCard.source), _jsx(Title, { level: 4, style: { margin: 0, flex: 1 }, children: selectedCard.title }), _jsx(Tag, { color: "blue", children: selectedCard.source.toUpperCase() })] }), _jsx(Button, { type: "primary", icon: _jsx(LinkOutlined, {}), href: selectedCard.url, target: "_blank", style: { marginBottom: 16 }, children: t('overview.viewOriginal') })] }), _jsx(Divider, {}), _jsxs("div", { style: { marginBottom: 20 }, children: [_jsx(Title, { level: 5, children: t('overview.summary') }), selectedCard.summary ? (_jsx(Paragraph, { style: { whiteSpace: 'pre-wrap' }, children: selectedCard.summary })) : (_jsx(Empty, { description: t('overview.noSummary') }))] }), selectedCard.chinese_tags && selectedCard.chinese_tags.length > 0 && (_jsxs("div", { style: { marginBottom: 20 }, children: [_jsx(Title, { level: 5, children: t('overview.tags') }), _jsx(Space, { wrap: true, children: selectedCard.chinese_tags.map((tag, index) => (_jsx(Tag, { color: "green", children: tag }, index))) })] })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 16 }, children: [selectedCard.stars !== undefined && (_jsx(Badge, { count: selectedCard.stars, showZero: true, color: "#faad14", children: _jsx(StarOutlined, { style: { color: '#faad14' } }) })), _jsxs(Text, { type: "secondary", children: [t('overview.source'), ": ", getSourceName(selectedCard.source)] })] }), _jsx(Text, { type: "secondary", children: new Date(selectedCard.created_at).toLocaleDateString() })] })] })) })] }));
};
export default Overview;
