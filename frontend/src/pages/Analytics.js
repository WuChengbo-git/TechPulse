import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Spin, Alert, Select, Statistic, Tag, Button, DatePicker, Radio } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FireOutlined, RobotOutlined, GithubOutlined, FileTextOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, ReloadOutlined } from '@ant-design/icons';
import { Column, Line, Pie, WordCloud } from '@ant-design/charts';
import dayjs from 'dayjs';
import { useLanguage } from '../contexts/LanguageContext';
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const Analytics = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [timeRange, setTimeRange] = useState(7); // 默认7天
    const [chartType, setChartType] = useState('column');
    // 获取卡片数据
    const fetchCards = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/cards/?limit=1000');
            if (response.ok) {
                const data = await response.json();
                setCards(data);
                processAnalyticsData(data);
            }
        }
        catch (error) {
            console.error('Failed to fetch cards:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // 处理分析数据
    const processAnalyticsData = (cardsData) => {
        const now = dayjs();
        const cutoffDate = now.subtract(timeRange, 'day');
        // 过滤时间范围内的数据
        const filteredCards = cardsData.filter(card => dayjs(card.created_at).isAfter(cutoffDate));
        // 计算来源分布
        const sourceCount = filteredCards.reduce((acc, card) => {
            acc[card.source] = (acc[card.source] || 0) + 1;
            return acc;
        }, {});
        const totalCards = filteredCards.length;
        const sourceDistribution = Object.entries(sourceCount).map(([source, count]) => ({
            source,
            count,
            percentage: Math.round((count / totalCards) * 100)
        }));
        // 计算技术趋势
        const techCount = filteredCards.reduce((acc, card) => {
            const techs = [
                ...(card.tech_stack || []),
                ...(card.chinese_tags || []),
                ...(card.ai_category || [])
            ];
            techs.forEach(tech => {
                if (tech && tech.trim()) {
                    acc[tech] = (acc[tech] || 0) + 1;
                }
            });
            return acc;
        }, {});
        const techTrends = Object.entries(techCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tech, count]) => ({
            tech,
            count,
            growth: Math.random() * 100 - 50 // 模拟增长率
        }));
        // 计算每日统计
        const dailyStats = [];
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = now.subtract(i, 'day').format('YYYY-MM-DD');
            const dayCards = filteredCards.filter(card => dayjs(card.created_at).format('YYYY-MM-DD') === date);
            const sources = ['github', 'arxiv', 'huggingface', 'zenn'];
            sources.forEach(source => {
                const count = dayCards.filter(card => card.source === source).length;
                dailyStats.push({ date, count, source });
            });
        }
        // 生成词云数据
        const popularTags = Object.entries(techCount)
            .slice(0, 50)
            .map(([text, value]) => ({ text, value }));
        // 获取热门项目
        const topProjects = filteredCards
            .filter(card => card.stars && card.stars > 0)
            .sort((a, b) => (b.stars || 0) - (a.stars || 0))
            .slice(0, 10)
            .map(card => ({
            name: card.title.split('/').pop() || card.title,
            stars: card.stars || 0,
            source: card.source
        }));
        setAnalyticsData({
            totalCards,
            sourceDistribution,
            techTrends,
            dailyStats,
            popularTags,
            topProjects
        });
    };
    useEffect(() => {
        fetchCards();
    }, []);
    useEffect(() => {
        if (cards.length > 0) {
            processAnalyticsData(cards);
        }
    }, [timeRange, cards]);
    // 获取来源图标
    const getSourceIcon = (source) => {
        switch (source) {
            case 'github':
                return _jsx(GithubOutlined, { style: { color: '#24292e' } });
            case 'arxiv':
                return _jsx(FileTextOutlined, { style: { color: '#b31b1b' } });
            case 'huggingface':
                return _jsx(RobotOutlined, { style: { color: '#ff6f00' } });
            case 'zenn':
                return _jsx(FileTextOutlined, { style: { color: '#3ea8ff' } });
            default:
                return null;
        }
    };
    // 获取来源颜色
    const getSourceColor = (source) => {
        switch (source) {
            case 'github':
                return '#24292e';
            case 'arxiv':
                return '#b31b1b';
            case 'huggingface':
                return '#ff6f00';
            case 'zenn':
                return '#3ea8ff';
            default:
                return '#1890ff';
        }
    };
    if (loading) {
        return (_jsxs("div", { style: { textAlign: 'center', padding: '50px' }, children: [_jsx(Spin, { size: "large" }), _jsx("div", { style: { marginTop: 16 }, children: t('analytics.loading') })] }));
    }
    if (!analyticsData) {
        return (_jsx(Alert, { message: t('analytics.noData'), description: t('analytics.noDataDescription'), type: "info", showIcon: true }));
    }
    // 图表配置
    const sourceChartConfig = {
        data: analyticsData.sourceDistribution,
        xField: 'source',
        yField: 'count',
        colorField: 'source',
        color: (datum) => getSourceColor(datum.source),
        label: {
            position: 'middle',
            style: { fill: '#FFFFFF', fontWeight: 'bold' }
        },
        meta: {
            source: { alias: 'Data Source' },
            count: { alias: '数量' }
        }
    };
    const trendChartConfig = {
        data: analyticsData.dailyStats,
        xField: 'date',
        yField: 'count',
        seriesField: 'source',
        color: ['#24292e', '#b31b1b', '#ff6f00', '#3ea8ff'],
        point: { size: 3 },
        smooth: true,
        meta: {
            date: { alias: '日付' },
            count: { alias: '数量' },
            source: { alias: 'Source' }
        }
    };
    const techPieConfig = {
        data: analyticsData.techTrends.slice(0, 10),
        angleField: 'count',
        colorField: 'tech',
        radius: 0.8,
        label: {
            type: 'outer',
            content: '{name}: {percentage}'
        }
    };
    const wordCloudConfig = {
        data: analyticsData.popularTags,
        wordField: 'text',
        weightField: 'value',
        colorField: 'text',
        wordStyle: {
            fontFamily: 'Verdana',
            fontSize: [8, 32],
            rotation: 0
        },
        interactions: [{ type: 'element-active' }]
    };
    return (_jsxs("div", { children: [_jsx(Card, { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsx(Title, { level: 2, style: { margin: 0 }, children: t('analytics.title') }), _jsx(Text, { type: "secondary", children: t('analytics.subtitle') })] }), _jsxs(Space, { children: [_jsxs(Select, { value: timeRange, onChange: setTimeRange, style: { width: 120 }, children: [_jsx(Option, { value: 7, children: "\u76F4\u8FD17\u65E5\u9593" }), _jsx(Option, { value: 14, children: "\u76F4\u8FD114\u65E5\u9593" }), _jsx(Option, { value: 30, children: "\u76F4\u8FD130\u65E5\u9593" })] }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: fetchCards, loading: loading, children: t('analytics.refreshData') })] })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('analytics.totalProjects'), value: analyticsData.totalCards, prefix: _jsx(FireOutlined, { style: { color: '#ff4d4f' } }), valueStyle: { color: '#3f8600' } }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u4EBA\u6C17\u6280\u8853", value: analyticsData.techTrends[0]?.tech || 'N/A', prefix: _jsx(ArrowUpOutlined, { style: { color: '#1890ff' } }), suffix: `(${analyticsData.techTrends[0]?.count || 0} ${t('analytics.projects')})` }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('analytics.mainSource'), value: analyticsData.sourceDistribution[0]?.source.toUpperCase() || 'N/A', prefix: getSourceIcon(analyticsData.sourceDistribution[0]?.source || ''), suffix: `${analyticsData.sourceDistribution[0]?.percentage || 0}%` }) }) }), _jsx(Col, { xs: 24, sm: 12, md: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('analytics.techTags'), value: analyticsData.popularTags.length, prefix: _jsx(Tag, {}), valueStyle: { color: '#722ed1' } }) }) })] }), _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('analytics.dataSourceDistribution'), extra: _jsxs(Radio.Group, { value: chartType, onChange: (e) => setChartType(e.target.value), size: "small", children: [_jsx(Radio.Button, { value: "column", children: _jsx(BarChartOutlined, {}) }), _jsx(Radio.Button, { value: "pie", children: _jsx(PieChartOutlined, {}) })] }), children: chartType === 'column' ? (_jsx(Column, { ...sourceChartConfig, height: 300 })) : (_jsx(Pie, { ...techPieConfig, height: 300 })) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('analytics.dailyNewTrend'), extra: _jsx(LineChartOutlined, {}), children: _jsx(Line, { ...trendChartConfig, height: 300 }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('analytics.techPopularityRanking'), children: _jsx("div", { style: { maxHeight: 300, overflowY: 'auto' }, children: analyticsData.techTrends.slice(0, 15).map((item, index) => (_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #f0f0f0'
                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsxs(Tag, { color: index < 3 ? 'gold' : index < 10 ? 'blue' : 'default', children: ["#", index + 1] }), _jsx(Text, { children: item.tech })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Text, { strong: true, children: item.count }), item.growth > 0 ? (_jsx(ArrowUpOutlined, { style: { color: '#3f8600' } })) : (_jsx(ArrowDownOutlined, { style: { color: '#cf1322' } }))] })] }, item.tech))) }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('analytics.techKeywordCloud'), children: _jsx(WordCloud, { ...wordCloudConfig, height: 300 }) }) }), _jsx(Col, { xs: 24, children: _jsx(Card, { title: t('analytics.hotProjectsRanking'), children: _jsx(Row, { gutter: [16, 16], children: analyticsData.topProjects.map((project, index) => (_jsx(Col, { xs: 24, sm: 12, md: 8, lg: 6, children: _jsxs(Card, { size: "small", hoverable: true, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsxs(Tag, { color: index < 3 ? 'gold' : 'blue', children: ["#", index + 1] }), getSourceIcon(project.source)] }), _jsx(Title, { level: 5, style: { margin: '0 0 8px 0' }, children: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name }), _jsx(Statistic, { value: project.stars, suffix: "\u2B50", valueStyle: { fontSize: '14px', color: '#faad14' } })] }) }, project.name))) }) }) })] })] }));
};
export default Analytics;
