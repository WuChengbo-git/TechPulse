import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, Tag, Space, Typography, Badge, Button } from 'antd';
import { LinkOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from './QualityBadge';
const { Text, Paragraph } = Typography;
const getSourceIcon = (source) => {
    switch (source.toLowerCase()) {
        case 'github':
            return _jsx(GithubOutlined, {});
        case 'arxiv':
            return _jsx(FileTextOutlined, {});
        case 'huggingface':
            return _jsx(RobotOutlined, {});
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
export const RecommendationCard = ({ data, onCardClick, onFavorite }) => {
    const { t } = useLanguage();
    return (_jsxs(Card, { hoverable: true, size: "small", style: { marginBottom: 12 }, onClick: () => onCardClick && onCardClick(data.card.id), children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, children: [_jsxs(Space, { size: 4, children: [_jsx(Badge, { count: getSourceIcon(data.card.source), style: { backgroundColor: getSourceColor(data.card.source), fontSize: 10 } }), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: data.card.source.toUpperCase() })] }), data.card.quality_score && (_jsx(QualityBadge, { score: data.card.quality_score, size: "small" }))] }), _jsx("div", { style: { marginBottom: 8 }, children: _jsx(Text, { strong: true, style: { fontSize: 14, display: 'block', lineHeight: 1.4 }, children: data.card.title }) }), _jsx("div", { style: { marginBottom: 8 }, children: _jsxs(Tag, { color: "blue", style: { fontSize: 11, marginBottom: 0 }, children: ["\uD83D\uDCA1 ", data.reason] }) }), data.matched_tags && data.matched_tags.length > 0 && (_jsx(Space, { size: [4, 4], wrap: true, style: { marginBottom: 8 }, children: data.matched_tags.map((tag, index) => (_jsx(Tag, { color: "orange", style: { fontSize: 11, margin: 0 }, children: tag }, index))) })), data.card.summary && (_jsx(Paragraph, { ellipsis: { rows: 2 }, style: { marginBottom: 8, fontSize: 12, color: '#666' }, children: data.card.summary })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }, children: [_jsx(Text, { type: "secondary", style: { fontSize: 11 }, children: new Date(data.card.created_at).toLocaleDateString('zh-CN') }), _jsxs(Space, { size: 8, children: [_jsx(Button, { type: "text", size: "small", icon: _jsx(EyeOutlined, {}), onClick: (e) => {
                                    e.stopPropagation();
                                    window.open(data.card.original_url, '_blank');
                                }, style: { fontSize: 11, padding: '0 4px' } }), _jsx(Button, { type: "text", size: "small", icon: _jsx(HeartOutlined, {}), onClick: (e) => {
                                    e.stopPropagation();
                                    onFavorite && onFavorite(data.card.id);
                                }, style: { fontSize: 11, padding: '0 4px' } })] })] })] }));
};
export default RecommendationCard;
