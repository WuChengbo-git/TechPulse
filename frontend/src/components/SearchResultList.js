import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Card, Tag, Space, Typography, Empty, Badge } from 'antd';
import { GithubOutlined, FileTextOutlined, RobotOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from './QualityBadge';
const { Text, Paragraph, Title } = Typography;
const getSourceIcon = (source) => {
    switch (source.toLowerCase()) {
        case 'github':
            return _jsx(GithubOutlined, { style: { color: '#333' } });
        case 'arxiv':
            return _jsx(FileTextOutlined, { style: { color: '#b31b1b' } });
        case 'huggingface':
            return _jsx(RobotOutlined, { style: { color: '#ff9d00' } });
        default:
            return _jsx(LinkOutlined, {});
    }
};
const getSourceColor = (source) => {
    switch (source.toLowerCase()) {
        case 'github':
            return '#333';
        case 'arxiv':
            return '#b31b1b';
        case 'huggingface':
            return '#ff9d00';
        case 'zenn':
            return '#3ea8ff';
        default:
            return '#1890ff';
    }
};
export const SearchResultList = ({ results, loading = false, intent, totalCount, onCardClick }) => {
    const { t } = useLanguage();
    if (!loading && results.length === 0) {
        return (_jsx(Empty, { description: t('search.noResults') || '没有找到相关内容', style: { padding: '40px 0' } }));
    }
    return (_jsxs("div", { className: "search-result-list", children: [totalCount !== undefined && (_jsxs("div", { style: { marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs(Text, { type: "secondary", children: [t('search.foundResults') || '找到', " ", _jsx("strong", { children: totalCount }), " ", t('search.results') || '条结果'] }), intent && (_jsx(Tag, { color: intent === 'analyze' ? 'blue' : 'green', children: intent === 'analyze' ? '🧠 分析模式' : '🔍 查询模式' }))] })), _jsx(List, { loading: loading, itemLayout: "vertical", dataSource: results, renderItem: (result) => (_jsxs(Card, { hoverable: true, style: { marginBottom: 16, cursor: 'pointer' }, onClick: () => onCardClick && onCardClick(result.card.id), children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }, children: [_jsxs(Space, { children: [_jsx(Badge, { count: getSourceIcon(result.card.source), style: { backgroundColor: getSourceColor(result.card.source) } }), _jsx(Tag, { color: getSourceColor(result.card.source), children: result.card.source.toUpperCase() }), result.card.quality_score && (_jsx(QualityBadge, { score: result.card.quality_score }))] }), _jsxs(Tag, { color: "gold", icon: _jsx(StarOutlined, {}), children: [t('search.relevance') || '相关度', ": ", (result.score * 100).toFixed(0), "%"] })] }), _jsx(Title, { level: 5, style: { marginBottom: 8, marginTop: 0 }, children: result.card.title }), result.reason && (_jsx("div", { style: { marginBottom: 12 }, children: _jsxs(Tag, { color: "blue", style: { marginBottom: 8 }, children: ["\uD83D\uDCA1 ", result.reason] }) })), result.card.summary && (_jsx(Paragraph, { ellipsis: { rows: 2, expandable: true, symbol: t('common.more') || '更多' }, style: { marginBottom: 12, color: '#666' }, children: result.card.summary })), result.card.chinese_tags && result.card.chinese_tags.length > 0 && (_jsx(Space, { size: [8, 8], wrap: true, children: result.card.chinese_tags.slice(0, 5).map((tag, index) => {
                                const isHighlighted = result.highlights.some(h => h.includes(tag));
                                return (_jsx(Tag, { color: isHighlighted ? 'orange' : 'default', style: isHighlighted ? { fontWeight: 'bold' } : {}, children: tag }, index));
                            }) })), _jsx("div", { style: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }, children: _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: new Date(result.card.created_at).toLocaleDateString('zh-CN') }) })] })) })] }));
};
export default SearchResultList;
