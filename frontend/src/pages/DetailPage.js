import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Space, Tag, Spin, Typography, Divider, Badge, message, Descriptions, Tabs, Empty, Statistic, } from 'antd';
import { StarOutlined, StarFilled, LinkOutlined, ShareAltOutlined, LeftOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, BookOutlined, CodeOutlined, FileSearchOutlined, CommentOutlined, } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;
const DetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [card, setCard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    // 获取卡片详情
    const fetchCardDetail = async () => {
        if (!id)
            return;
        setLoading(true);
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const response = await axios.get(`/api/v1/cards/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params: {
                    translate_to: language,
                    include_related: true,
                },
            });
            setCard(response.data);
            // TODO: 从后端获取收藏状态
        }
        catch (error) {
            console.error('Failed to fetch card detail:', error);
            message.error(t('detail.loadFailed') || '加载详情失败');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCardDetail();
    }, [id, language]);
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
        setIsFavorite(!isFavorite);
        message.success(!isFavorite
            ? (t('detail.favorited') || '已收藏')
            : (t('detail.unfavorited') || '已取消收藏'));
        // TODO: 调用后端 API 保存收藏状态
    };
    // 打开原文链接
    const handleOpenOriginal = () => {
        if (card?.url) {
            window.open(card.url, '_blank');
        }
    };
    // 分享
    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        message.success(t('detail.linkCopied') || '链接已复制到剪贴板');
    };
    // 返回
    const handleGoBack = () => {
        navigate(-1);
    };
    if (loading) {
        return (_jsx("div", { style: { padding: '24px', textAlign: 'center' }, children: _jsx(Spin, { size: "large" }) }));
    }
    if (!card) {
        return (_jsxs("div", { style: { padding: '24px' }, children: [_jsx(Empty, { description: t('detail.notFound') || '未找到该内容' }), _jsx("div", { style: { textAlign: 'center', marginTop: '24px' }, children: _jsx(Button, { type: "primary", onClick: handleGoBack, children: t('detail.goBack') || '返回' }) })] }));
    }
    // 标签页配置
    const tabItems = [
        {
            key: 'overview',
            label: (_jsxs("span", { children: [_jsx(FileSearchOutlined, {}), " ", t('detail.overview') || '概览'] })),
            children: (_jsxs("div", { children: [_jsxs(Card, { size: "small", style: { marginBottom: '16px', backgroundColor: '#f6f8fa' }, children: [_jsx(Title, { level: 5, children: t('detail.summary') || '摘要' }), _jsx(Paragraph, { style: { fontSize: '15px', lineHeight: '1.8', marginBottom: 0 }, children: card.translated_summary || card.summary })] }), _jsxs(Card, { size: "small", children: [_jsx(Title, { level: 5, children: t('detail.fullContent') || '完整内容' }), _jsx("div", { style: {
                                    fontSize: '15px',
                                    lineHeight: '1.8',
                                    color: '#24292f',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }, children: card.translated_content || card.content || (_jsx(Text, { type: "secondary", children: t('detail.noContent') || '暂无详细内容' })) }), (card.translated_summary || card.translated_content) && (_jsx("div", { style: { marginTop: '16px' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83C\uDF10 ", t('detail.aiTranslated') || 'AI 翻译', card.source.toLowerCase().includes('zenn') && ` (${t('detail.fromJapanese') || '来自日语原文'})`] }) }))] })] })),
        },
        {
            key: 'metadata',
            label: (_jsxs("span", { children: [_jsx(CodeOutlined, {}), " ", t('detail.technicalInfo') || '技术信息'] })),
            children: (_jsxs(Card, { size: "small", children: [_jsxs(Descriptions, { column: 2, bordered: true, size: "small", children: [card.metadata.author && (_jsx(Descriptions.Item, { label: t('detail.author') || '作者', span: 2, children: _jsx(Text, { strong: true, children: card.metadata.author }) })), card.metadata.language && (_jsx(Descriptions.Item, { label: t('detail.language') || '编程语言', children: _jsx(Tag, { color: "blue", children: card.metadata.language }) })), card.metadata.license && (_jsx(Descriptions.Item, { label: t('detail.license') || '许可证', children: _jsx(Tag, { children: card.metadata.license }) })), card.metadata.stars !== undefined && (_jsx(Descriptions.Item, { label: "Stars", children: _jsx(Statistic, { value: card.metadata.stars, prefix: "\u2B50", valueStyle: { fontSize: '16px' } }) })), card.metadata.forks !== undefined && (_jsx(Descriptions.Item, { label: "Forks", children: _jsx(Statistic, { value: card.metadata.forks, prefix: "\uD83D\uDD31", valueStyle: { fontSize: '16px' } }) })), card.metadata.watchers !== undefined && (_jsx(Descriptions.Item, { label: "Watchers", children: _jsx(Statistic, { value: card.metadata.watchers, prefix: "\uD83D\uDC40", valueStyle: { fontSize: '16px' } }) })), card.metadata.issues !== undefined && (_jsx(Descriptions.Item, { label: "Issues", children: _jsx(Statistic, { value: card.metadata.issues, prefix: "\uD83D\uDC1B", valueStyle: { fontSize: '16px' } }) })), card.metadata.citations !== undefined && (_jsx(Descriptions.Item, { label: t('detail.citations') || '引用数', children: _jsx(Statistic, { value: card.metadata.citations, prefix: "\uD83D\uDCDA", valueStyle: { fontSize: '16px' } }) })), card.metadata.downloads !== undefined && (_jsx(Descriptions.Item, { label: t('detail.downloads') || '下载量', children: _jsx(Statistic, { value: card.metadata.downloads, prefix: "\u2B07\uFE0F", valueStyle: { fontSize: '16px' } }) })), card.metadata.likes !== undefined && (_jsx(Descriptions.Item, { label: t('detail.likes') || '点赞', children: _jsx(Statistic, { value: card.metadata.likes, prefix: "\uD83D\uDC4D", valueStyle: { fontSize: '16px' } }) })), card.metadata.homepage && (_jsx(Descriptions.Item, { label: t('detail.homepage') || '主页', span: 2, children: _jsx("a", { href: card.metadata.homepage, target: "_blank", rel: "noopener noreferrer", children: card.metadata.homepage }) })), card.metadata.documentation && (_jsx(Descriptions.Item, { label: t('detail.documentation') || '文档', span: 2, children: _jsx("a", { href: card.metadata.documentation, target: "_blank", rel: "noopener noreferrer", children: card.metadata.documentation }) })), card.created_at && (_jsx(Descriptions.Item, { label: t('detail.createdAt') || '创建时间', children: new Date(card.created_at).toLocaleString() })), card.updated_at && (_jsx(Descriptions.Item, { label: t('detail.updatedAt') || '更新时间', children: new Date(card.updated_at).toLocaleString() }))] }), card.metadata.topics && card.metadata.topics.length > 0 && (_jsxs("div", { style: { marginTop: '16px' }, children: [_jsxs(Text, { strong: true, children: [t('detail.topics') || '主题', ":"] }), _jsx("div", { style: { marginTop: '8px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.metadata.topics.map((topic, index) => (_jsx(Tag, { color: "processing", children: topic }, index))) }) })] }))] })),
        },
        {
            key: 'related',
            label: (_jsxs("span", { children: [_jsx(CommentOutlined, {}), " ", t('detail.relatedContent') || '相关内容'] })),
            children: (_jsx(Card, { size: "small", children: card.related_cards && card.related_cards.length > 0 ? (_jsx(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: card.related_cards.map((relatedCard) => (_jsx(Card, { size: "small", hoverable: true, onClick: () => navigate(`/detail/${relatedCard.id}`), style: { cursor: 'pointer' }, children: _jsxs(Space, { children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(relatedCard.source), children: relatedCard.source }), offset: [0, 0] }), _jsx(Text, { strong: true, children: relatedCard.title })] }) }, relatedCard.id))) })) : (_jsx(Empty, { description: t('detail.noRelated') || '暂无相关内容' })) })),
        },
    ];
    return (_jsxs("div", { style: { padding: '24px', maxWidth: '1200px', margin: '0 auto' }, children: [_jsx("div", { style: { marginBottom: '16px' }, children: _jsx(Button, { icon: _jsx(LeftOutlined, {}), onClick: handleGoBack, children: t('detail.back') || '返回' }) }), _jsxs(Card, { children: [_jsx("div", { style: { marginBottom: '16px' }, children: _jsxs(Space, { direction: "vertical", size: "small", style: { width: '100%' }, children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(card.source), style: { fontSize: '14px' }, children: card.source }), offset: [0, 0] }), _jsx(Title, { level: 2, style: { margin: 0 }, children: card.translated_title || card.title }), card.translated_title && (_jsx(Text, { type: "secondary", style: { fontSize: '15px' }, children: card.title }))] }) }), _jsx("div", { style: { marginBottom: '16px' }, children: _jsxs(Space, { wrap: true, children: [_jsx(Button, { type: isFavorite ? 'default' : 'primary', icon: isFavorite ? _jsx(StarFilled, { style: { color: '#faad14' } }) : _jsx(StarOutlined, {}), onClick: handleToggleFavorite, children: isFavorite ? (t('detail.unfavorite') || '取消收藏') : (t('detail.favorite') || '收藏') }), _jsx(Button, { icon: _jsx(LinkOutlined, {}), onClick: handleOpenOriginal, children: t('detail.viewOriginal') || '查看原文' }), _jsx(Button, { icon: _jsx(ShareAltOutlined, {}), onClick: handleShare, children: t('detail.share') || '分享' })] }) }), card.tags && card.tags.length > 0 && (_jsx("div", { style: { marginBottom: '16px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.tags.map((tag, index) => (_jsx(Tag, { color: "default", children: tag }, index))) }) })), _jsx(Divider, {}), _jsx(Tabs, { activeKey: activeTab, onChange: setActiveTab, items: tabItems })] })] }));
};
export default DetailPage;
