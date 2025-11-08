import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Select, Spin, Empty, Typography, Badge, message, Input, Modal, Row, Col, Divider, } from 'antd';
import { StarFilled, EyeOutlined, ReadOutlined, DeleteOutlined, TagsOutlined, PlusOutlined, EditOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, BookOutlined, FilterOutlined, } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { CheckableTag } = Tag;
const CollectionsPage = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [allCollectionTags, setAllCollectionTags] = useState([]);
    const [sortBy, setSortBy] = useState('latest');
    // 标签管理
    const [tagModalVisible, setTagModalVisible] = useState(false);
    const [currentCard, setCurrentCard] = useState(null);
    const [newTag, setNewTag] = useState('');
    const [editingTags, setEditingTags] = useState([]);
    // 获取收藏列表
    const fetchCollections = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            const params = {
                translate_to: language,
                sort_by: sortBy,
            };
            // 添加标签筛选
            if (selectedTags.length > 0) {
                params.tags = selectedTags.join(',');
            }
            const response = await axios.get('/api/v1/favorites/', {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                params,
            });
            const fetchedCards = response.data || [];
            setCards(fetchedCards);
            // 提取所有收藏标签
            const tagsSet = new Set();
            fetchedCards.forEach((card) => {
                if (card.collection_tags) {
                    card.collection_tags.forEach(tag => tagsSet.add(tag));
                }
            });
            setAllCollectionTags(Array.from(tagsSet));
        }
        catch (error) {
            console.error('Failed to fetch collections:', error);
            message.error(t('collections.loadFailed') || '加载收藏失败');
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchCollections();
    }, [sortBy, language]);
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
    // 取消收藏
    const handleUnfavorite = async (cardId) => {
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            await axios.delete(`/api/v1/favorites/${cardId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            message.success(t('collections.unfavorited') || '已取消收藏');
            setCards(cards.filter(card => card.id !== cardId));
        }
        catch (error) {
            console.error('Failed to unfavorite:', error);
            message.error(t('collections.unfavoriteFailed') || '取消收藏失败');
        }
    };
    // 打开标签编辑模态框
    const openTagModal = (card) => {
        setCurrentCard(card);
        setEditingTags(card.collection_tags || []);
        setNewTag('');
        setTagModalVisible(true);
    };
    // 添加新标签
    const handleAddTag = () => {
        if (!newTag.trim()) {
            message.warning(t('collections.tagEmpty') || '标签不能为空');
            return;
        }
        if (editingTags.includes(newTag.trim())) {
            message.warning(t('collections.tagExists') || '标签已存在');
            return;
        }
        setEditingTags([...editingTags, newTag.trim()]);
        setNewTag('');
    };
    // 移除标签
    const handleRemoveTag = (tag) => {
        setEditingTags(editingTags.filter(t => t !== tag));
    };
    // 保存标签
    const handleSaveTags = async () => {
        if (!currentCard)
            return;
        try {
            const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
            await axios.put(`/api/v1/favorites/${currentCard.id}/tags`, { tags: editingTags }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            message.success(t('collections.tagsSaved') || '标签已保存');
            setTagModalVisible(false);
            fetchCollections();
        }
        catch (error) {
            console.error('Failed to save tags:', error);
            message.error(t('collections.tagsSaveFailed') || '保存标签失败');
        }
    };
    // 快速查看
    const handleQuickView = (card) => {
        message.info('快速查看功能开发中...');
        // TODO: 打开 QuickViewModal
    };
    // 深度阅读
    const handleDeepRead = (card) => {
        navigate(`/detail/${card.id}`);
    };
    // 标签筛选
    const handleTagFilter = (tag, checked) => {
        const nextSelectedTags = checked
            ? [...selectedTags, tag]
            : selectedTags.filter(t => t !== tag);
        setSelectedTags(nextSelectedTags);
    };
    // 应用筛选
    const applyFilter = () => {
        fetchCollections();
    };
    // 清除筛选
    const clearFilter = () => {
        setSelectedTags([]);
    };
    return (_jsxs("div", { style: { padding: '24px', maxWidth: '1200px', margin: '0 auto' }, children: [_jsxs("div", { style: { marginBottom: '24px' }, children: [_jsxs(Title, { level: 2, children: [_jsx(StarFilled, { style: { color: '#faad14' } }), " ", t('collections.title') || '我的收藏'] }), _jsx(Text, { type: "secondary", children: t('collections.subtitle') || '管理你收藏的技术内容' })] }), _jsx(Card, { style: { marginBottom: '24px' }, children: _jsxs(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: [allCollectionTags.length > 0 && (_jsxs("div", { children: [_jsx(Space, { align: "center", children: _jsxs(Text, { strong: true, children: [_jsx(TagsOutlined, {}), " ", t('collections.filterByTags') || '按标签筛选', ":"] }) }), _jsx("div", { style: { marginTop: '8px' }, children: _jsx(Space, { size: "small", wrap: true, children: allCollectionTags.map(tag => (_jsx(CheckableTag, { checked: selectedTags.includes(tag), onChange: (checked) => handleTagFilter(tag, checked), children: tag }, tag))) }) })] })), _jsxs(Row, { gutter: 16, align: "middle", children: [_jsx(Col, { children: _jsxs(Space, { children: [_jsxs(Text, { strong: true, children: [t('collections.sortBy') || '排序', ":"] }), _jsxs(Select, { value: sortBy, onChange: setSortBy, style: { width: 150 }, children: [_jsx(Option, { value: "latest", children: t('collections.latestFavorited') || '最近收藏' }), _jsx(Option, { value: "oldest", children: t('collections.oldestFavorited') || '最早收藏' }), _jsx(Option, { value: "title", children: t('collections.title') || '标题' }), _jsx(Option, { value: "stars", children: t('collections.stars') || 'Star数' })] })] }) }), selectedTags.length > 0 && (_jsx(Col, { children: _jsxs(Button, { onClick: applyFilter, type: "primary", children: [_jsx(FilterOutlined, {}), " ", t('collections.applyFilter') || '应用筛选'] }) })), selectedTags.length > 0 && (_jsx(Col, { children: _jsx(Button, { onClick: clearFilter, children: t('collections.clearFilter') || '清除筛选' }) })), _jsx(Col, { flex: "auto", style: { textAlign: 'right' }, children: _jsxs(Text, { type: "secondary", children: [t('collections.total') || '共', " ", cards.length, " ", t('collections.items') || '项'] }) })] })] }) }), _jsx(Spin, { spinning: loading, children: cards.length === 0 && !loading ? (_jsx(Empty, { description: selectedTags.length > 0
                        ? (t('collections.noMatchingCollections') || '没有匹配的收藏')
                        : (t('collections.noCollections') || '还没有收藏内容') })) : (_jsx(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: cards.map((card) => (_jsxs(Card, { hoverable: true, style: { borderRadius: '8px' }, bodyStyle: { padding: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }, children: [_jsxs(Space, { size: "small", style: { flex: 1 }, children: [_jsx(Badge, { count: _jsx(Tag, { color: "blue", icon: getSourceIcon(card.source), children: card.source }), offset: [0, 0] }), _jsx(Title, { level: 4, style: { margin: 0 }, children: card.translated_title || card.title })] }), _jsxs(Space, { children: [_jsx(Button, { type: "text", icon: _jsx(EditOutlined, {}), onClick: () => openTagModal(card), title: t('collections.editTags') || '编辑标签' }), _jsx(Button, { type: "text", danger: true, icon: _jsx(DeleteOutlined, {}), onClick: () => handleUnfavorite(card.id), title: t('collections.unfavorite') || '取消收藏' })] })] }), _jsxs(Space, { size: "middle", style: { marginBottom: '12px' }, children: [card.metadata?.author && (_jsx(Text, { type: "secondary", children: card.metadata.author })), card.metadata?.stars !== undefined && card.metadata?.stars !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B50 ", card.metadata.stars.toLocaleString()] })), card.metadata?.citations !== undefined && card.metadata?.citations !== null && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDCDA \u5F15\u7528 ", card.metadata.citations] })), card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (_jsxs(Text, { type: "secondary", children: ["\u2B07\uFE0F ", card.metadata.downloads.toLocaleString()] })), card.favorited_at && (_jsxs(Text, { type: "secondary", children: ["\uD83D\uDC96 ", t('collections.favoritedAt') || '收藏于', " ", new Date(card.favorited_at).toLocaleDateString()] }))] }), _jsx(Paragraph, { ellipsis: { rows: 2, expandable: false }, style: { marginBottom: '12px' }, children: card.translated_summary || card.summary }), card.collection_tags && card.collection_tags.length > 0 && (_jsx("div", { style: { marginBottom: '12px' }, children: _jsxs(Space, { size: "small", wrap: true, children: [_jsx(TagsOutlined, { style: { color: '#1890ff' } }), card.collection_tags.map((tag, index) => (_jsx(Tag, { color: "blue", children: tag }, index)))] }) })), card.tags && card.tags.length > 0 && (_jsx("div", { style: { marginBottom: '12px' }, children: _jsx(Space, { size: "small", wrap: true, children: card.tags.slice(0, 5).map((tag, index) => (_jsx(Tag, { children: tag }, index))) }) })), _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(EyeOutlined, {}), onClick: () => handleQuickView(card), children: t('collections.quickView') || '快速查看' }), _jsx(Button, { type: "primary", icon: _jsx(ReadOutlined, {}), onClick: () => handleDeepRead(card), children: t('collections.deepRead') || '深度阅读' })] })] }, card.id))) })) }), _jsx(Modal, { title: _jsxs(Space, { children: [_jsx(TagsOutlined, {}), t('collections.manageTags') || '管理标签'] }), open: tagModalVisible, onOk: handleSaveTags, onCancel: () => setTagModalVisible(false), okText: t('collections.save') || '保存', cancelText: t('collections.cancel') || '取消', children: currentCard && (_jsxs(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: [_jsx("div", { children: _jsx(Text, { strong: true, children: currentCard.translated_title || currentCard.title }) }), _jsx(Divider, { style: { margin: '8px 0' } }), _jsxs("div", { children: [_jsxs(Text, { type: "secondary", children: [t('collections.currentTags') || '当前标签', ":"] }), _jsx("div", { style: { marginTop: '8px' }, children: editingTags.length > 0 ? (_jsx(Space, { size: "small", wrap: true, children: editingTags.map((tag, index) => (_jsx(Tag, { closable: true, onClose: () => handleRemoveTag(tag), color: "blue", children: tag }, index))) })) : (_jsx(Text, { type: "secondary", children: t('collections.noTags') || '暂无标签' })) })] }), _jsxs("div", { children: [_jsxs(Text, { type: "secondary", children: [t('collections.addNewTag') || '添加新标签', ":"] }), _jsxs(Space.Compact, { style: { width: '100%', marginTop: '8px' }, children: [_jsx(Input, { placeholder: t('collections.tagPlaceholder') || '输入标签名称...', value: newTag, onChange: (e) => setNewTag(e.target.value), onPressEnter: handleAddTag }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleAddTag, children: t('collections.add') || '添加' })] })] }), _jsxs("div", { children: [_jsxs(Text, { type: "secondary", children: [t('collections.suggestedTags') || '常用标签', ":"] }), _jsx("div", { style: { marginTop: '8px' }, children: _jsx(Space, { size: "small", wrap: true, children: ['待学习', '重要', '工作相关', 'LLM', 'CV', 'NLP', '工具', '论文', '代码'].map((tag) => (_jsxs(Tag, { style: { cursor: 'pointer' }, onClick: () => {
                                                if (!editingTags.includes(tag)) {
                                                    setEditingTags([...editingTags, tag]);
                                                }
                                            }, children: [_jsx(PlusOutlined, {}), " ", tag] }, tag))) }) })] })] })) })] }));
};
export default CollectionsPage;
