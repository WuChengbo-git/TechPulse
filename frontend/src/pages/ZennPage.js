import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, message, Typography, Space, Badge, Statistic, List, Tag, Tabs, Input, Select, Avatar, Modal, Divider } from 'antd';
import { EditOutlined, SyncOutlined, UserOutlined, SearchOutlined, LikeOutlined, LinkOutlined, CalendarOutlined, BookOutlined, EyeOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from '../components/QualityBadge';
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const ZennPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    // 打开详细信息Modal
    const openDetailModal = (article) => {
        setSelectedArticle(article);
        setDetailModalVisible(true);
        setChatHistory([]);
        setChatMessage('');
    };
    // 发送聊天消息
    const sendChatMessage = async () => {
        if (!chatMessage.trim() || !selectedArticle)
            return;
        setChatLoading(true);
        try {
            const userMessage = chatMessage.trim();
            const response = await fetch('/api/v1/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `${t('zenn.aboutThisArticle')} "${selectedArticle.title}"，${userMessage}`,
                    context: {
                        title: selectedArticle.title,
                        content_excerpt: selectedArticle.content_excerpt,
                        author: selectedArticle.author_name,
                        tags: selectedArticle.tags,
                        url: selectedArticle.original_url
                    }
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, {
                        user: userMessage,
                        ai: data.response || t('zenn.cannotAnswer')
                    }]);
                setChatMessage('');
            }
            else {
                message.error(t('zenn.sendMessageFailed'));
            }
        }
        catch (error) {
            console.error('Chat error:', error);
            message.error(t('zenn.sendMessageFailed'));
        }
        finally {
            setChatLoading(false);
        }
    };
    // 获取Zenn数据
    const fetchZennData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/cards/?source=zenn&limit=100');
            if (response.ok) {
                const data = await response.json();
                console.log('Zenn data sample:', data[0]); // 调试信息
                // 处理数据，适配 TechCard 结构
                const processedArticles = data.map((article) => ({
                    ...article,
                    url: article.original_url || article.url || '',
                    content_excerpt: article.summary || article.content_excerpt || '',
                    tags: article.chinese_tags || article.tags || [],
                    // 设置默认值
                    author_name: article.author_name || t('zenn.anonymous'),
                    likes_count: article.likes_count || 0,
                    comments_count: article.comments_count || 0,
                    emoji: article.emoji || '📝',
                    type: article.type || 'article',
                    is_premium: article.is_premium || false,
                    published_at: article.created_at || new Date().toISOString()
                }));
                setArticles(processedArticles);
                // 模拟统计数据
                const authorCounts = processedArticles.reduce((acc, article) => {
                    const author = article.author_name || t('zenn.anonymous');
                    acc[author] = (acc[author] || 0) + 1;
                    return acc;
                }, {});
                const allTags = processedArticles.flatMap((article) => article.tags || []);
                const tagCounts = allTags.reduce((acc, tag) => {
                    if (tag)
                        acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
                const mockStats = {
                    total_articles: processedArticles.length,
                    today_new: processedArticles.filter((article) => {
                        if (!article.published_at)
                            return false;
                        try {
                            return new Date(article.published_at).toDateString() === new Date().toDateString();
                        }
                        catch {
                            return false;
                        }
                    }).length,
                    total_likes: processedArticles.reduce((sum, article) => sum + (article.likes_count || 0), 0),
                    top_authors: Object.entries(authorCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([name, articles]) => ({ name, articles: articles })),
                    popular_tags: Object.entries(tagCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 15)
                        .map(([tag]) => tag),
                    last_update: new Date().toISOString()
                };
                setStats(mockStats);
            }
        }
        catch (error) {
            console.error('Failed to fetch Zenn data:', error);
            message.error('Failed to fetch Zenn data');
        }
        finally {
            setLoading(false);
        }
    };
    // 更新Zenn数据
    const updateZennData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/sources/collect/zenn', { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                message.success(`Zenn data updated successfully! ${result.count || 0} new articles retrieved`);
                await fetchZennData();
            }
            else {
                throw new Error('Update failed');
            }
        }
        catch (error) {
            message.error('Failed to update Zenn data');
        }
        finally {
            setLoading(false);
        }
    };
    // 过滤文章
    const filteredArticles = articles.filter(article => {
        const matchesSearch = !searchQuery ||
            (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (article.content_excerpt && article.content_excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (article.author_name && article.author_name.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = typeFilter === 'all' || article.type === typeFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'popular' && (article.likes_count || 0) > 10) ||
            (activeTab === 'recent' && article.published_at &&
                new Date(article.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
            (activeTab === 'premium' && article.is_premium);
        return matchesSearch && matchesType && matchesTab;
    });
    useEffect(() => {
        fetchZennData();
    }, []);
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(EditOutlined, { style: { color: '#3ea8ff' } }), t('zenn.title')] }), _jsx(Text, { type: "secondary", children: t('zenn.subtitle') })] }), _jsx(Space, { children: _jsx(Button, { type: "primary", icon: _jsx(SyncOutlined, {}), onClick: updateZennData, loading: loading, children: t('zenn.updateData') }) })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('zenn.totalArticles'), value: stats?.total_articles || 0, prefix: _jsx(BookOutlined, { style: { color: '#3ea8ff' } }), valueStyle: { color: '#3ea8ff' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('zenn.todayNew'), value: stats?.today_new || 0, prefix: _jsx(EditOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('zenn.totalLikes'), value: stats?.total_likes || 0, prefix: _jsx(LikeOutlined, { style: { color: '#ff4d4f' } }), valueStyle: { color: '#ff4d4f' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('zenn.activeAuthors'), value: stats?.top_authors?.length || 0, prefix: _jsx(UserOutlined, { style: { color: '#722ed1' } }), valueStyle: { color: '#722ed1' } }) }) })] }), _jsx(Card, { style: { marginBottom: 16 }, children: _jsxs(Row, { gutter: 16, align: "middle", children: [_jsx(Col, { flex: "auto", children: _jsx(Search, { placeholder: t('zenn.searchPlaceholder'), allowClear: true, onChange: (e) => setSearchQuery(e.target.value), prefix: _jsx(SearchOutlined, {}) }) }), _jsx(Col, { children: _jsxs(Select, { value: typeFilter, onChange: setTypeFilter, style: { width: 120 }, placeholder: t('zenn.typeFilter'), children: [_jsx(Option, { value: "all", children: t('zenn.allTypes') }), _jsx(Option, { value: "article", children: t('zenn.article') }), _jsx(Option, { value: "book", children: t('zenn.book') }), _jsx(Option, { value: "scrap", children: t('zenn.scrap') })] }) })] }) }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: `${t('zenn.all')} (${articles.length})` }, "all"), _jsx(TabPane, { tab: `${t('zenn.popular')} (${articles.filter(a => (a.likes_count || 0) > 10).length})` }, "popular"), _jsx(TabPane, { tab: t('zenn.recent') }, "recent"), _jsx(TabPane, { tab: t('zenn.premiumArticles') }, "premium")] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(Card, { title: `📝 ${t('zenn.articles')}`, style: { minHeight: '600px' }, children: loading ? (_jsx("div", { style: { textAlign: 'center', padding: '50px' }, children: _jsx("span", { children: "Loading data..." }) })) : (_jsx(List, { dataSource: filteredArticles, renderItem: (article) => (_jsx(List.Item, { actions: [
                                        _jsx(Button, { type: "primary", size: "small", icon: _jsx(EyeOutlined, {}), onClick: () => openDetailModal(article), children: t('zenn.viewDetails') }, "detail"),
                                        _jsx(Button, { type: "link", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                                if (article.url) {
                                                    window.open(article.url, '_blank');
                                                }
                                                else {
                                                    message.warning(t('zenn.articleLinkUnavailable'));
                                                }
                                            }, children: t('zenn.readArticle') }, "view")
                                    ], children: _jsx(List.Item.Meta, { avatar: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("span", { style: { fontSize: '24px' }, children: article.emoji || '📝' }), _jsx(Avatar, { src: article.author_avatar, size: "small", icon: _jsx(UserOutlined, {}) })] }), title: _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }, children: [_jsx(Text, { strong: true, children: article.title || t('zenn.noTitle') }), article.quality_score !== undefined && (_jsx(QualityBadge, { score: article.quality_score, size: "small" })), _jsx(Tag, { color: "blue", children: article.type === 'article' ? t('zenn.article') :
                                                                article.type === 'book' ? t('zenn.book') : t('zenn.scrap') }), article.is_premium && (_jsx(Tag, { color: "gold", children: t('zenn.premium') }))] }), _jsx("div", { style: { marginBottom: 8 }, children: (article.tags || []).slice(0, 4).map(tag => (_jsx(Tag, { color: "cyan", children: tag }, tag))) })] }), description: _jsxs("div", { children: [_jsx("div", { style: { marginBottom: 8 }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["Author: ", article.author_name || t('zenn.anonymous')] }) }), _jsx(Paragraph, { ellipsis: { rows: 2 }, style: { marginBottom: 8 }, children: article.content_excerpt || t('zenn.noSummary') }), _jsxs(Space, { children: [_jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [_jsx(LikeOutlined, {}), " ", article.likes_count || 0, " ", t('zenn.likes')] }), _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83D\uDCAC ", article.comments_count || 0, " ", t('zenn.comments')] }), _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [_jsx(CalendarOutlined, {}), " ", article.published_at ? new Date(article.published_at).toLocaleDateString() : t('zenn.unknown')] })] })] }) }) })), pagination: {
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} articles`
                                } })) }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { title: `👥 ${t('zenn.popularAuthors')}`, style: { marginBottom: 16 }, children: _jsx(List, { size: "small", dataSource: stats?.top_authors || [], renderItem: (author, index) => (_jsx(List.Item, { children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Badge, { count: index + 1, style: {
                                                                backgroundColor: index < 3 ? ['#f50', '#fa8c16', '#fadb14'][index] : '#d9d9d9'
                                                            } }), _jsx(Text, { style: { fontSize: '12px' }, children: author.name })] }), _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [author.articles, " ", t('zenn.articles')] })] }) })) }) }), _jsxs(Card, { title: `🏷️ ${t('zenn.popularTags')}`, children: [_jsx(Space, { wrap: true, children: stats?.popular_tags.map((tag, index) => (_jsx(Tag, { color: [
                                                'magenta', 'red', 'volcano', 'orange', 'gold',
                                                'lime', 'green', 'cyan', 'blue', 'geekblue',
                                                'purple'
                                            ][index % 11], style: {
                                                fontSize: `${Math.max(10, 14 - index * 0.2)}px`,
                                                marginBottom: 4
                                            }, children: tag }, tag))) }), _jsxs("div", { style: { marginTop: 16, padding: 16, backgroundColor: '#f6ffed', borderRadius: 6 }, children: [_jsxs(Title, { level: 5, style: { color: '#389e0d', margin: 0, marginBottom: 8 }, children: ["\uD83D\uDCA1 ", t('zenn.aboutZenn')] }), _jsx(Text, { style: { fontSize: '12px', color: '#52c41a' }, children: t('zenn.aboutZennDesc') })] })] })] })] }), _jsx(Modal, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(EditOutlined, { style: { color: '#3ea8ff' } }), "\u6587\u7AE0\u8BE6\u7EC6\u4FE1\u606F"] }), open: detailModalVisible, onCancel: () => setDetailModalVisible(false), width: 900, footer: null, style: { top: 20 }, children: selectedArticle && (_jsxs("div", { children: [_jsxs(Card, { style: { marginBottom: 16 }, children: [_jsxs(Title, { level: 4, style: { marginBottom: 16 }, children: [_jsx("span", { style: { fontSize: '24px', marginRight: 8 }, children: selectedArticle.emoji || '📝' }), selectedArticle.title || t('zenn.noTitle')] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Tag, { color: "blue", children: selectedArticle.type === 'article' ? t('zenn.article') :
                                                selectedArticle.type === 'book' ? t('zenn.book') : t('zenn.scrap') }), selectedArticle.is_premium && (_jsx(Tag, { color: "gold", children: t('zenn.premium') })), (selectedArticle.tags || []).slice(0, 4).map(tag => (_jsx(Tag, { color: "cyan", children: tag }, tag)))] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('zenn.author') }), _jsx(Text, { children: selectedArticle.author_name || t('zenn.anonymous') })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('zenn.publishTime') }), _jsx(Text, { children: selectedArticle.published_at ? new Date(selectedArticle.published_at).toLocaleDateString() : t('zenn.unknown') })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx(Title, { level: 5, children: t('zenn.fullSummary') }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', textAlign: 'justify' }, children: selectedArticle.content_excerpt || t('zenn.noSummary') })] }), _jsx(Divider, {}), _jsx("div", { style: { display: 'flex', gap: 12 }, children: _jsx(Button, { type: "primary", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                            if (selectedArticle.original_url) {
                                                window.open(selectedArticle.original_url, '_blank');
                                            }
                                        }, disabled: !selectedArticle.original_url, children: "\u9605\u8BFB\u5168\u6587" }) })] }), _jsxs(Card, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(MessageOutlined, { style: { color: '#1890ff' } }), "\u5173\u4E8E\u8FD9\u7BC7\u6587\u7AE0\u7684\u95EE\u7B54"] }), children: [_jsx("div", { style: { maxHeight: 300, overflowY: 'auto', marginBottom: 16 }, children: chatHistory.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: 20 }, children: "\u60A8\u53EF\u4EE5\u95EE\u6211\u5173\u4E8E\u8FD9\u7BC7Zenn\u6587\u7AE0\u7684\u4EFB\u4F55\u95EE\u9898" })) : (chatHistory.map((chat, index) => (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsxs("div", { style: {
                                                    backgroundColor: '#e6f7ff',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    marginBottom: 8
                                                }, children: [_jsx(Text, { strong: true, children: "\u60A8: " }), _jsx(Text, { children: chat.user })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#f6ffed',
                                                    padding: 8,
                                                    borderRadius: 6
                                                }, children: [_jsx(Text, { strong: true, style: { color: '#52c41a' }, children: "AI: " }), _jsx(Text, { children: chat.ai })] })] }, index)))) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Input, { value: chatMessage, onChange: (e) => setChatMessage(e.target.value), placeholder: t('zenn.askQuestionPlaceholder'), onPressEnter: sendChatMessage, disabled: chatLoading }), _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: sendChatMessage, loading: chatLoading, disabled: !chatMessage.trim(), children: "\u53D1\u9001" })] })] })] })) })] }));
};
export default ZennPage;
