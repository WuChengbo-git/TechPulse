import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, message, Typography, Space, Statistic, List, Tag, Tabs, Input, Select, Progress, Alert, Modal, Divider } from 'antd';
import { FileTextOutlined, SyncOutlined, BookOutlined, SearchOutlined, CalendarOutlined, LinkOutlined, EyeOutlined, MessageOutlined, SendOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from '../components/QualityBadge';
import CardSkeleton from '../components/CardSkeleton';
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const ArxivPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [papers, setPapers] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    // arXiv分类映射
    const categoryNames = {
        'cs.AI': t('arxiv.catAI'),
        'cs.CL': t('arxiv.catNLP'),
        'cs.CV': t('arxiv.catCV'),
        'cs.LG': t('arxiv.catML'),
        'cs.RO': t('arxiv.catRobotics'),
        'cs.SE': t('arxiv.catSE'),
        'stat.ML': t('arxiv.catStatML'),
        'math.OC': t('arxiv.catOptimization')
    };
    // 获取arXiv数据
    const fetchArxivData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/cards/?source=arxiv&limit=100');
            if (response.ok) {
                const data = await response.json();
                // 确保数据是数组格式
                const papersArray = Array.isArray(data) ? data : [];
                console.log('ArXiv data sample:', papersArray[0]); // 调试信息
                // 处理数据，适配 TechCard 结构
                const processedPapers = papersArray.map((paper) => {
                    // 使用 TechCard 的 original_url 字段
                    const originalUrl = paper.original_url || '';
                    // 生成 PDF URL（arXiv 特有）
                    let pdfUrl = paper.pdf_url || '';
                    if (!pdfUrl && originalUrl && originalUrl.includes('arxiv.org/abs/')) {
                        pdfUrl = originalUrl.replace('/abs/', '/pdf/') + '.pdf';
                    }
                    return {
                        ...paper,
                        // 保持原有字段
                        original_url: originalUrl,
                        // 添加 PDF URL
                        pdf_url: pdfUrl,
                        // 将 summary 作为 abstract 使用
                        abstract: paper.summary || paper.abstract || '',
                        // 将 chinese_tags 作为 categories 使用
                        categories: paper.chinese_tags || paper.categories || []
                    };
                });
                setPapers(processedPapers);
                // 模拟统计数据
                const categories = processedPapers.reduce((acc, paper) => {
                    // 确保categories存在且是数组
                    const paperCategories = paper.categories || [];
                    if (Array.isArray(paperCategories)) {
                        paperCategories.forEach(cat => {
                            acc[cat] = (acc[cat] || 0) + 1;
                        });
                    }
                    return acc;
                }, {});
                const mockStats = {
                    total_papers: processedPapers.length,
                    today_new: processedPapers.filter((paper) => {
                        if (!paper.created_at)
                            return false;
                        try {
                            return new Date(paper.created_at).toDateString() === new Date().toDateString();
                        }
                        catch {
                            return false;
                        }
                    }).length,
                    categories,
                    top_authors: ['Geoffrey Hinton', 'Yann LeCun', 'Yoshua Bengio', 'Andrew Ng'],
                    last_update: new Date().toISOString()
                };
                setStats(mockStats);
            }
            else {
                throw new Error('Failed to fetch data');
            }
        }
        catch (error) {
            console.error('Failed to fetch arXiv data:', error);
            message.error(t('arxiv.fetchDataFailed'));
            // 设置空数据以防止页面崩溃
            setPapers([]);
            setStats({
                total_papers: 0,
                today_new: 0,
                categories: {},
                top_authors: [],
                last_update: new Date().toISOString()
            });
        }
        finally {
            setLoading(false);
        }
    };
    // 打开详细信息Modal
    const openDetailModal = (paper) => {
        setSelectedPaper(paper);
        setDetailModalVisible(true);
        setChatHistory([]);
        setChatMessage('');
    };
    // 发送聊天消息
    const sendChatMessage = async () => {
        if (!chatMessage.trim() || !selectedPaper)
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
                    message: `关于这篇arXiv论文 "${selectedPaper.title}"，${userMessage}`,
                    context: {
                        title: selectedPaper.title,
                        abstract: selectedPaper.abstract || selectedPaper.summary,
                        categories: selectedPaper.categories,
                        authors: selectedPaper.authors,
                        url: selectedPaper.original_url
                    }
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, {
                        user: userMessage,
                        ai: data.response || t('arxiv.cannotAnswer')
                    }]);
                setChatMessage('');
            }
            else {
                message.error(t('arxiv.sendMessageFailed'));
            }
        }
        catch (error) {
            console.error('Chat error:', error);
            message.error(t('arxiv.sendMessageFailed'));
        }
        finally {
            setChatLoading(false);
        }
    };
    // 更新arXiv数据
    const updateArxivData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/sources/collect/arxiv', { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                message.success(`arXiv data updated successfully! ${result.count || 0} new papers retrieved`);
                await fetchArxivData();
            }
            else {
                throw new Error('Update failed');
            }
        }
        catch (error) {
            message.error('Failed to update arXiv data');
        }
        finally {
            setLoading(false);
        }
    };
    // 过滤论文
    const filteredPapers = papers.filter(paper => {
        if (!paper)
            return false;
        const matchesSearch = !searchQuery ||
            (paper.title && paper.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (paper.abstract && paper.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (paper.summary && paper.summary.toLowerCase().includes(searchQuery.toLowerCase()));
        const paperCategories = paper.categories || [];
        const matchesCategory = categoryFilter === 'all' ||
            (Array.isArray(paperCategories) && paperCategories.includes(categoryFilter));
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'recent' && paper.created_at &&
                new Date(paper.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
            (activeTab === 'ai' && ((Array.isArray(paperCategories) &&
                paperCategories.some(cat => cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能')))) ||
                (paper.summary && paper.summary.toLowerCase().includes('ai')) ||
                (paper.title && paper.title.toLowerCase().includes('ai')))) ||
            (activeTab === 'cv' && ((Array.isArray(paperCategories) &&
                paperCategories.some(cat => cat && (cat.includes('计算机视觉') || cat.includes('computer vision') || cat.includes('cv')))) ||
                (paper.summary && (paper.summary.toLowerCase().includes('vision') || paper.summary.toLowerCase().includes('视觉')))));
        return matchesSearch && matchesCategory && matchesTab;
    });
    useEffect(() => {
        fetchArxivData();
    }, []);
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(FileTextOutlined, { style: { color: '#b31b1b' } }), t('arxiv.title')] }), _jsx(Text, { type: "secondary", children: t('arxiv.subtitle') })] }), _jsx(Space, { children: _jsx(Button, { type: "primary", icon: _jsx(SyncOutlined, {}), onClick: updateArxivData, loading: loading, children: t('arxiv.updateData') }) })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('arxiv.totalPapers'), value: stats?.total_papers || 0, prefix: _jsx(FileTextOutlined, { style: { color: '#b31b1b' } }), valueStyle: { color: '#b31b1b' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('arxiv.todayNew'), value: stats?.today_new || 0, prefix: _jsx(BookOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('arxiv.aiRelated'), value: papers.filter(p => {
                                    const categories = p.categories || [];
                                    return Array.isArray(categories) && categories.some(cat => cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能'))) || (p.summary && p.summary.toLowerCase().includes('ai'));
                                }).length, prefix: _jsx(SearchOutlined, { style: { color: '#1890ff' } }), valueStyle: { color: '#1890ff' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('arxiv.mainCategory'), value: stats?.categories ?
                                    (categoryNames[Object.keys(stats.categories)[0]] || Object.keys(stats.categories)[0] || t('arxiv.defaultCategory')) :
                                    t('arxiv.defaultCategory'), prefix: _jsx(CalendarOutlined, { style: { color: '#fa8c16' } }), valueStyle: { color: '#fa8c16', fontSize: '20px' } }) }) })] }), _jsx(Card, { style: { marginBottom: 16 }, children: _jsxs(Row, { gutter: 16, align: "middle", children: [_jsx(Col, { flex: "auto", children: _jsx(Search, { placeholder: t('arxiv.searchPlaceholder'), allowClear: true, onChange: (e) => setSearchQuery(e.target.value), prefix: _jsx(SearchOutlined, {}) }) }), _jsx(Col, { children: _jsxs(Select, { value: categoryFilter, onChange: setCategoryFilter, style: { width: 150 }, placeholder: t('arxiv.categoryFilter'), children: [_jsx(Option, { value: "all", children: t('arxiv.allCategories') }), _jsx(Option, { value: "cs.AI", children: "AI\u30FBMachine Learning" }), _jsx(Option, { value: "cs.CL", children: "Natural Language Processing" }), _jsx(Option, { value: "cs.CV", children: "Computer Vision" }), _jsx(Option, { value: "cs.LG", children: "Machine Learning" }), _jsx(Option, { value: "cs.RO", children: "Robotics" })] }) })] }) }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: `${t('arxiv.all')} (${papers.length})` }, "all"), _jsx(TabPane, { tab: `${t('arxiv.recent')} (${papers.filter(p => {
                            if (!p.created_at)
                                return false;
                            try {
                                return new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            }
                            catch {
                                return false;
                            }
                        }).length})` }, "recent"), _jsx(TabPane, { tab: t('arxiv.aiRelated') }, "ai"), _jsx(TabPane, { tab: t('arxiv.computerVision') }, "cv")] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(Card, { title: `📚 ${t('arxiv.papers')}`, style: { minHeight: '600px' }, children: loading && papers.length === 0 ? (_jsx(CardSkeleton, { count: 5, grid: false })) : filteredPapers.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: '50px' }, children: _jsx("span", { children: "\u6682\u65E0arXiv\u8BBA\u6587\u6570\u636E" }) })) : (_jsx(List, { dataSource: filteredPapers, renderItem: (paper) => (_jsx(List.Item, { actions: [
                                        _jsx(Button, { type: "primary", style: { fontSize: "12px" }, icon: _jsx(EyeOutlined, {}), onClick: () => openDetailModal(paper), children: t('arxiv.viewDetails') }, "detail"),
                                        _jsx(Button, { type: "link", icon: _jsx(LinkOutlined, {}), disabled: !paper.original_url, onClick: () => {
                                                if (paper.original_url) {
                                                    window.open(paper.original_url, '_blank');
                                                }
                                                else {
                                                    message.warning(t('arxiv.abstractLinkUnavailable'));
                                                }
                                            }, children: t('arxiv.abstract') }, "abstract"),
                                        _jsx(Button, { type: "link", style: { color: '#b31b1b' }, disabled: !paper.pdf_url, onClick: () => {
                                                if (paper.pdf_url) {
                                                    window.open(paper.pdf_url, '_blank');
                                                }
                                                else {
                                                    message.warning(t('arxiv.pdfLinkUnavailable'));
                                                }
                                            }, children: t('arxiv.pdf') }, "pdf")
                                    ], children: _jsx(List.Item.Meta, { title: _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }, children: [_jsx(Text, { strong: true, children: paper.title || t('arxiv.noTitle') }), paper.quality_score !== undefined && (_jsx(QualityBadge, { score: paper.quality_score, style: { fontSize: "12px" } }))] }), _jsx("div", { style: { marginBottom: 8 }, children: (paper.categories || []).map((cat, index) => (_jsx(Tag, { color: "red", style: { fontSize: "12px" }, children: categoryNames[cat] || cat }, index))) })] }), description: _jsxs("div", { children: [_jsx(Paragraph, { ellipsis: { rows: 3 }, style: { marginBottom: 8 }, children: paper.abstract || paper.summary || t('arxiv.noAbstract') }), _jsx(Space, { children: _jsxs(Text, { type: "secondary", children: [_jsx(CalendarOutlined, {}), " ", t('arxiv.published'), ": ", paper.created_at ? new Date(paper.created_at).toLocaleDateString() : t('arxiv.unknown')] }) })] }) }) })), pagination: {
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} 篇论文`
                                } })) }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { title: `📊 ${t('arxiv.categoryStats')}`, style: { marginBottom: 16 }, children: _jsx("div", { children: stats?.categories && Object.entries(stats.categories)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 8)
                                        .map(([category, count]) => (_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid #f0f0f0'
                                        }, children: [_jsx(Text, { style: { fontSize: '12px' }, children: categoryNames[category] || category }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Progress, { percent: Math.round((count / (stats?.total_papers || 1)) * 100), style: { fontSize: "12px" }, style: { width: '60px' }, showInfo: false }), _jsx(Text, { style: { fontSize: '12px', minWidth: '20px' }, children: count })] })] }, category))) }) }), _jsxs(Card, { title: `📈 ${t('arxiv.researchTrends')}`, children: [_jsx(Alert, { message: "AI & Machine Learning Field Active", description: "Recent submissions show an increasing trend in research on large language models and computer vision.", type: "info", showIcon: true, style: { marginBottom: 16 } }), _jsxs("div", { children: [_jsx(Title, { level: 5, children: "Hot Research Keywords" }), _jsxs(Space, { wrap: true, children: [_jsx(Tag, { color: "magenta", children: "Transformer" }), _jsx(Tag, { color: "red", children: "Large Language Models" }), _jsx(Tag, { color: "volcano", children: "Computer Vision" }), _jsx(Tag, { color: "orange", children: "Reinforcement Learning" }), _jsx(Tag, { color: "gold", children: "Neural Networks" }), _jsx(Tag, { color: "lime", children: "Deep Learning" }), _jsx(Tag, { color: "green", children: "Natural Language Processing" }), _jsx(Tag, { color: "cyan", children: "Robotics" })] })] })] })] })] }), _jsx(Modal, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(FileTextOutlined, { style: { color: '#b31b1b' } }), "\u8BBA\u6587\u8BE6\u7EC6\u4FE1\u606F"] }), open: detailModalVisible, onCancel: () => setDetailModalVisible(false), width: 900, footer: null, style: { top: 20 }, children: selectedPaper && (_jsxs("div", { children: [_jsxs(Card, { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 4, style: { marginBottom: 16 }, children: selectedPaper.title }), _jsx("div", { style: { marginBottom: 12 }, children: (selectedPaper.categories || []).map((cat, index) => (_jsx(Tag, { color: "red", children: categoryNames[cat] || cat }, index))) }), selectedPaper.authors && (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('arxiv.author') }), _jsx(Text, { children: selectedPaper.authors.join(', ') })] })), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('arxiv.publishTime') }), _jsx(Text, { children: selectedPaper.created_at ? new Date(selectedPaper.created_at).toLocaleDateString() : t('arxiv.unknown') })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx(Title, { level: 5, children: t('arxiv.fullAbstract') }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', textAlign: 'justify' }, children: selectedPaper.abstract || selectedPaper.summary || t('arxiv.noAbstract') })] }), _jsx(Divider, {}), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsx(Button, { type: "primary", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                                if (selectedPaper.original_url) {
                                                    window.open(selectedPaper.original_url, '_blank');
                                                }
                                            }, disabled: !selectedPaper.original_url, children: "\u67E5\u770B\u539F\u6587" }), _jsx(Button, { type: "default", style: { color: '#b31b1b' }, icon: _jsx(FileTextOutlined, {}), onClick: () => {
                                                if (selectedPaper.pdf_url) {
                                                    window.open(selectedPaper.pdf_url, '_blank');
                                                }
                                            }, disabled: !selectedPaper.pdf_url, children: "\u4E0B\u8F7DPDF" })] })] }), _jsxs(Card, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(MessageOutlined, { style: { color: '#1890ff' } }), "\u5173\u4E8E\u8FD9\u7BC7\u8BBA\u6587\u7684\u95EE\u7B54"] }), children: [_jsx("div", { style: { maxHeight: 300, overflowY: 'auto', marginBottom: 16 }, children: chatHistory.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: 20 }, children: "\u60A8\u53EF\u4EE5\u95EE\u6211\u5173\u4E8E\u8FD9\u7BC7\u8BBA\u6587\u7684\u4EFB\u4F55\u95EE\u9898" })) : (chatHistory.map((chat, index) => (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsxs("div", { style: {
                                                    backgroundColor: '#e6f7ff',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    marginBottom: 8
                                                }, children: [_jsx(Text, { strong: true, children: "\u60A8: " }), _jsx(Text, { children: chat.user })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#f6ffed',
                                                    padding: 8,
                                                    borderRadius: 6
                                                }, children: [_jsx(Text, { strong: true, style: { color: '#52c41a' }, children: "AI: " }), _jsx(Text, { children: chat.ai })] })] }, index)))) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Input, { value: chatMessage, onChange: (e) => setChatMessage(e.target.value), placeholder: t('arxiv.askQuestionPlaceholder'), onPressEnter: sendChatMessage, disabled: chatLoading }), _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: sendChatMessage, loading: chatLoading, disabled: !chatMessage.trim(), children: "\u53D1\u9001" })] })] })] })) })] }));
};
export default ArxivPage;
