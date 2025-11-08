import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Modal, Typography, Space, Tag, Button, Spin, Divider, Badge, message, Descriptions, Card, Empty, } from 'antd';
import { StarOutlined, StarFilled, ReadOutlined, LinkOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, BookOutlined, CloseOutlined, } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;
const QuickViewModal = ({ cardId, visible, onClose, onDeepRead, isFavorite = false, onToggleFavorite, }) => {
    const { t, language } = useLanguage();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(false);
    // 获取卡片详情
    const fetchCardDetail = async (id) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await axios.get(`/api/v1/cards/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    translate_to: language,
                },
            });
            setCard(response.data);
        }
        catch (error) {
            console.error('Failed to fetch card detail:', error);
            message.error(t('quickView.loadFailed') || '加载详情失败');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (visible && cardId) {
            fetchCardDetail(cardId);
        }
        else {
            setCard(null);
        }
    }, [visible, cardId, language]);
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
    // 处理收藏
    const handleToggleFavorite = () => {
        if (card && onToggleFavorite) {
            onToggleFavorite(card.id);
        }
    };
    // 处理深度阅读
    const handleDeepRead = () => {
        if (card && onDeepRead) {
            onDeepRead(card.id);
            onClose();
        }
    };
    // 打开原文链接
    const handleOpenOriginal = () => {
        if (card?.url) {
            window.open(card.url, '_blank');
        }
    };
    return (_jsx(Modal, { title: null, open: visible, onCancel: onClose, footer: null, width: 800, closeIcon: _jsx(CloseOutlined, {}), styles: {
            body: { maxHeight: '70vh', overflowY: 'auto' },
        }, children: _jsx(Spin, { spinning: loading, children: card ? (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: '16px' }, children: _jsxs(Space, { direction: "vertical", size: "small", style: { width: '100%' }, children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(card.source), children: card.source }), offset: [0, 0] }), _jsx(Title, { level: 3, style: { margin: 0 }, children: card.translated_title || card.title }), card.translated_title && (_jsx(Text, { type: "secondary", style: { fontSize: '14px' }, children: card.title }))] }) }), _jsx("div", { style: { marginBottom: '16px' }, children: _jsxs(Space, { wrap: true, children: [_jsx(Button, { type: isFavorite ? 'default' : 'primary', icon: isFavorite ? _jsx(StarFilled, { style: { color: '#faad14' } }) : _jsx(StarOutlined, {}), onClick: handleToggleFavorite, children: isFavorite ? (t('quickView.unfavorite') || '取消收藏') : (t('quickView.favorite') || '收藏') }), _jsx(Button, { type: "primary", icon: _jsx(ReadOutlined, {}), onClick: handleDeepRead, children: t('quickView.deepRead') || '深度阅读' }), _jsx(Button, { icon: _jsx(LinkOutlined, {}), onClick: handleOpenOriginal, children: t('quickView.viewOriginal') || '查看原文' })] }) }), _jsx(Divider, {}), _jsx(Card, { size: "small", style: { marginBottom: '16px', backgroundColor: '#fafafa' }, children: _jsxs(Descriptions, { column: 2, size: "small", children: [card.metadata.author && (_jsx(Descriptions.Item, { label: t('quickView.author') || '作者', children: card.metadata.author })), card.metadata.language && (_jsx(Descriptions.Item, { label: t('quickView.language') || '语言', children: _jsx(Tag, { children: card.metadata.language }) })), card.metadata?.stars !== undefined && card.metadata?.stars !== null && (_jsxs(Descriptions.Item, { label: "Stars", children: ["\u2B50 ", card.metadata.stars.toLocaleString()] })), card.metadata?.forks !== undefined && card.metadata?.forks !== null && (_jsxs(Descriptions.Item, { label: "Forks", children: ["\uD83D\uDD31 ", card.metadata.forks.toLocaleString()] })), card.metadata?.watchers !== undefined && card.metadata?.watchers !== null && (_jsxs(Descriptions.Item, { label: "Watchers", children: ["\uD83D\uDC40 ", card.metadata.watchers.toLocaleString()] })), card.metadata?.issues !== undefined && card.metadata?.issues !== null && (_jsxs(Descriptions.Item, { label: "Issues", children: ["\uD83D\uDC1B ", card.metadata.issues.toLocaleString()] })), card.metadata?.citations !== undefined && card.metadata?.citations !== null && (_jsxs(Descriptions.Item, { label: t('quickView.citations') || '引用', children: ["\uD83D\uDCDA ", card.metadata.citations.toLocaleString()] })), card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (_jsxs(Descriptions.Item, { label: t('quickView.downloads') || '下载', children: ["\u2B07\uFE0F ", card.metadata.downloads.toLocaleString()] })), card.metadata?.likes !== undefined && card.metadata?.likes !== null && (_jsxs(Descriptions.Item, { label: t('quickView.likes') || '点赞', children: ["\uD83D\uDC4D ", card.metadata.likes.toLocaleString()] })), card.created_at && (_jsxs(Descriptions.Item, { label: t('quickView.date') || '日期', children: ["\uD83D\uDD52 ", new Date(card.created_at).toLocaleDateString()] }))] }) }), card.tags && card.tags.length > 0 && (_jsxs("div", { style: { marginBottom: '16px' }, children: [_jsxs(Text, { strong: true, children: [t('quickView.tags') || '标签', ":"] }), _jsx("div", { style: { marginTop: '8px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.tags.map((tag, index) => (_jsx(Tag, { color: "processing", children: tag }, index))) }) })] })), _jsx(Divider, {}), _jsxs("div", { style: { marginBottom: '16px' }, children: [_jsx(Title, { level: 5, children: t('quickView.summary') || '摘要' }), _jsx(Paragraph, { style: { fontSize: '15px', lineHeight: '1.8' }, children: card.translated_summary || card.summary }), card.translated_summary && card.source.toLowerCase().includes('zenn') && (_jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83C\uDF10 ", t('quickView.translatedFromJapanese') || 'AI翻译自日语原文'] }))] }), (card.translated_content || card.content) && (_jsxs("div", { children: [_jsx(Title, { level: 5, children: t('quickView.preview') || '内容预览' }), _jsx(Paragraph, { ellipsis: { rows: 6, expandable: true, symbol: t('quickView.readMore') || '展开更多' }, style: { fontSize: '14px', lineHeight: '1.8', color: '#595959' }, children: card.translated_content || card.content }), card.translated_content && (_jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83C\uDF10 ", t('quickView.translated') || 'AI翻译'] }))] })), _jsx("div", { style: { marginTop: '24px', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '4px' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '13px' }, children: ["\uD83D\uDCA1 ", t('quickView.deepReadTip') || '点击"深度阅读"查看完整技术细节、相关讨论和更多信息'] }) })] })) : (_jsx(Empty, { description: t('quickView.noData') || '暂无数据' })) }) }));
};
export default QuickViewModal;
