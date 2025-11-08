import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, message, Typography, Space, Statistic, List, Tag, Tabs, Input, Select, Progress, Alert, Modal, Divider } from 'antd';
import { RobotOutlined, SyncOutlined, DatabaseOutlined, SearchOutlined, DownloadOutlined, HeartOutlined, ApiOutlined, EyeOutlined, MessageOutlined, SendOutlined, LinkOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import QualityBadge from '../components/QualityBadge';
import CardSkeleton from '../components/CardSkeleton';
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;
const HuggingFacePage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState([]);
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pipelineFilter, setPipelineFilter] = useState('all');
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [chatLoading, setChatLoading] = useState(false);
    // Pipeline类型映射
    const pipelineNames = {
        'text-generation': t('huggingface.taskTextGeneration'),
        'text-classification': t('huggingface.taskTextClassification'),
        'token-classification': t('huggingface.taskTokenClassification'),
        'question-answering': t('huggingface.taskQuestionAnswering'),
        'fill-mask': t('huggingface.taskFillMask'),
        'summarization': t('huggingface.taskSummarization'),
        'translation': t('huggingface.taskTranslation'),
        'text2text-generation': t('huggingface.taskText2Text'),
        'conversational': t('huggingface.taskConversational'),
        'image-classification': t('huggingface.taskImageClassification'),
        'object-detection': t('huggingface.taskObjectDetection'),
        'image-segmentation': t('huggingface.taskImageSegmentation'),
        'image-to-text': t('huggingface.taskImageToText'),
        'text-to-speech': t('huggingface.taskTextToSpeech')
    };
    // 打开详细信息Modal
    const openDetailModal = (model) => {
        setSelectedModel(model);
        setDetailModalVisible(true);
        setChatHistory([]);
        setChatMessage('');
    };
    // 发送聊天消息
    const sendChatMessage = async () => {
        if (!chatMessage.trim() || !selectedModel)
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
                    message: `关于这个HuggingFace模型 "${selectedModel.title}"，${userMessage}`,
                    context: {
                        title: selectedModel.title,
                        description: selectedModel.description,
                        author: selectedModel.author,
                        pipeline_tag: selectedModel.pipeline_tag,
                        downloads: selectedModel.downloads,
                        url: selectedModel.original_url
                    }
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setChatHistory(prev => [...prev, {
                        user: userMessage,
                        ai: data.response || t('huggingface.cannotAnswer')
                    }]);
                setChatMessage('');
            }
            else {
                message.error(t('huggingface.sendMessageFailed'));
            }
        }
        catch (error) {
            console.error('Chat error:', error);
            message.error(t('huggingface.sendMessageFailed'));
        }
        finally {
            setChatLoading(false);
        }
    };
    // 获取Hugging Face数据
    const fetchHuggingFaceData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/cards/?source=huggingface&limit=100');
            if (response.ok) {
                const data = await response.json();
                console.log('HuggingFace data sample:', data[0]); // 调试信息
                // 处理数据，适配 TechCard 结构
                const processedModels = data.map((model) => ({
                    ...model,
                    name: model.title || model.name || '',
                    description: model.summary || model.description || '',
                    url: model.original_url || model.url || '',
                    tags: model.chinese_tags || model.tags || [],
                    pipeline_tag: model.pipeline_tag || 'unknown'
                }));
                setModels(processedModels);
                // 模拟统计数据
                const pipelineDistribution = processedModels.reduce((acc, model) => {
                    const pipeline = model.pipeline_tag || 'unknown';
                    acc[pipeline] = (acc[pipeline] || 0) + 1;
                    return acc;
                }, {});
                const allTags = processedModels.flatMap((model) => model.tags || []);
                const tagCounts = allTags.reduce((acc, tag) => {
                    if (tag)
                        acc[tag] = (acc[tag] || 0) + 1;
                    return acc;
                }, {});
                const mockStats = {
                    total_models: processedModels.length,
                    total_datasets: Math.floor(processedModels.length * 0.3),
                    today_new: processedModels.filter((model) => {
                        if (!model.created_at)
                            return false;
                        try {
                            return new Date(model.created_at).toDateString() === new Date().toDateString();
                        }
                        catch {
                            return false;
                        }
                    }).length,
                    pipeline_distribution: pipelineDistribution,
                    top_tags: Object.entries(tagCounts)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([tag]) => tag),
                    last_update: new Date().toISOString()
                };
                setStats(mockStats);
            }
        }
        catch (error) {
            console.error('Failed to fetch Hugging Face data:', error);
            message.error('Failed to fetch Hugging Face data');
        }
        finally {
            setLoading(false);
        }
    };
    // 更新Hugging Face数据
    const updateHuggingFaceData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/v1/sources/collect/huggingface', { method: 'POST' });
            if (response.ok) {
                const result = await response.json();
                message.success(`Hugging Face data updated successfully! ${result.count || 0} new models retrieved`);
                await fetchHuggingFaceData();
            }
            else {
                throw new Error('Update failed');
            }
        }
        catch (error) {
            message.error('Failed to update Hugging Face data');
        }
        finally {
            setLoading(false);
        }
    };
    // 过滤模型
    const filteredModels = models.filter(model => {
        const matchesSearch = !searchQuery ||
            (model.name && model.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (model.author && model.author.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesPipeline = pipelineFilter === 'all' || model.pipeline_tag === pipelineFilter;
        const matchesTab = activeTab === 'all' ||
            (activeTab === 'popular' && (model.downloads || 0) > 1000) ||
            (activeTab === 'recent' && new Date(model.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
            (activeTab === 'text' && model.pipeline_tag && model.pipeline_tag.includes('text')) ||
            (activeTab === 'vision' && model.pipeline_tag && model.pipeline_tag.includes('image'));
        return matchesSearch && matchesPipeline && matchesTab;
    });
    // 格式化数字
    const formatNumber = (num) => {
        if (num >= 1000000)
            return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000)
            return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };
    useEffect(() => {
        fetchHuggingFaceData();
    }, []);
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(RobotOutlined, { style: { color: '#ff6f00' } }), t('huggingface.title')] }), _jsx(Text, { type: "secondary", children: t('huggingface.subtitle') })] }), _jsx(Space, { children: _jsx(Button, { type: "primary", icon: _jsx(SyncOutlined, {}), onClick: updateHuggingFaceData, loading: loading, children: t('huggingface.updateData') }) })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('huggingface.totalModels'), value: stats?.total_models || 0, prefix: _jsx(ApiOutlined, { style: { color: '#ff6f00' } }), valueStyle: { color: '#ff6f00' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('huggingface.totalDatasets'), value: stats?.total_datasets || 0, prefix: _jsx(DatabaseOutlined, { style: { color: '#1890ff' } }), valueStyle: { color: '#1890ff' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('huggingface.todayNew'), value: stats?.today_new || 0, prefix: _jsx(RobotOutlined, { style: { color: '#52c41a' } }), valueStyle: { color: '#52c41a' } }) }) }), _jsx(Col, { xs: 24, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('huggingface.popularTask'), value: stats?.pipeline_distribution ?
                                    pipelineNames[Object.keys(stats.pipeline_distribution)[0]] || t('huggingface.taskTextGeneration') :
                                    t('huggingface.taskTextGeneration'), prefix: _jsx(SearchOutlined, { style: { color: '#722ed1' } }), valueStyle: { color: '#722ed1', fontSize: '20px' } }) }) })] }), _jsx(Card, { style: { marginBottom: 16 }, children: _jsxs(Row, { gutter: 16, align: "middle", children: [_jsx(Col, { flex: "auto", children: _jsx(Search, { placeholder: t('huggingface.searchPlaceholder'), allowClear: true, onChange: (e) => setSearchQuery(e.target.value), prefix: _jsx(SearchOutlined, {}) }) }), _jsx(Col, { children: _jsxs(Select, { value: pipelineFilter, onChange: setPipelineFilter, style: { width: 150 }, placeholder: t('huggingface.taskFilter'), children: [_jsx(Option, { value: "all", children: t('huggingface.allTasks') }), _jsx(Option, { value: "text-generation", children: "\u6587\u672C\u751F\u6210" }), _jsx(Option, { value: "text-classification", children: "\u6587\u672C\u5206\u7C7B" }), _jsx(Option, { value: "question-answering", children: "\u95EE\u7B54\u7CFB\u7EDF" }), _jsx(Option, { value: "translation", children: "\u673A\u5668\u7FFB\u8BD1" }), _jsx(Option, { value: "image-classification", children: "\u56FE\u50CF\u5206\u7C7B" })] }) })] }) }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: `${t('huggingface.all')} (${models.length})` }, "all"), _jsx(TabPane, { tab: `${t('huggingface.popular')} (${models.filter(m => (m.downloads || 0) > 1000).length})` }, "popular"), _jsx(TabPane, { tab: t('huggingface.recent') }, "recent"), _jsx(TabPane, { tab: t('huggingface.textRelated') }, "text"), _jsx(TabPane, { tab: t('huggingface.visionRelated') }, "vision")] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { xs: 24, lg: 16, children: _jsx(Card, { title: `🤖 ${t('huggingface.models')}`, style: { minHeight: '600px' }, children: loading && models.length === 0 ? (_jsx(CardSkeleton, { count: 5, grid: false })) : filteredModels.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: '50px' }, children: _jsx("span", { children: "Loading data..." }) })) : (_jsx(List, { dataSource: filteredModels, renderItem: (model) => (_jsx(List.Item, { actions: [
                                        _jsx(Button, { type: "primary", size: "small", icon: _jsx(EyeOutlined, {}), onClick: () => openDetailModal(model), children: t('huggingface.viewDetails') }, "detail"),
                                        _jsx(Button, { type: "link", href: model.url, target: "_blank", icon: _jsx(LinkOutlined, {}), children: t('common.view') }, "view")
                                    ], children: _jsx(List.Item.Meta, { title: _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }, children: [_jsx(Text, { strong: true, children: model.name }), model.quality_score !== undefined && (_jsx(QualityBadge, { score: model.quality_score, size: "small" })), _jsx(Tag, { color: "orange", children: pipelineNames[model.pipeline_tag || ''] || model.pipeline_tag || 'unknown' })] }), _jsx("div", { style: { marginBottom: 8 }, children: (model.tags || []).slice(0, 5).map(tag => (_jsx(Tag, { style: { fontSize: '10px' }, children: tag }, tag))) })] }), description: _jsxs("div", { children: [_jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [t('huggingface.author'), ": ", model.author] }), _jsx(Paragraph, { ellipsis: { rows: 2 }, style: { marginBottom: 8, marginTop: 4 }, children: model.description }), _jsxs(Space, { children: [_jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [_jsx(DownloadOutlined, {}), " ", formatNumber(model.downloads || 0), " ", t('huggingface.downloads')] }), _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [_jsx(HeartOutlined, {}), " ", model.likes, " ", t('huggingface.likes')] }), _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: [t('huggingface.created'), ": ", new Date(model.created_at).toLocaleDateString()] })] })] }) }) })), pagination: {
                                    pageSize: 10,
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} models`
                                } })) }) }), _jsxs(Col, { xs: 24, lg: 8, children: [_jsx(Card, { title: `📊 ${t('huggingface.taskDistribution')}`, style: { marginBottom: 16 }, children: _jsx("div", { children: stats?.pipeline_distribution && Object.entries(stats.pipeline_distribution)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 8)
                                        .map(([pipeline, count]) => (_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 0',
                                            borderBottom: '1px solid #f0f0f0'
                                        }, children: [_jsx(Text, { style: { fontSize: '12px' }, children: pipelineNames[pipeline] || pipeline }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(Progress, { percent: Math.round((count / (stats?.total_models || 1)) * 100), size: "small", style: { width: '60px' }, showInfo: false, strokeColor: "#ff6f00" }), _jsx(Text, { style: { fontSize: '12px', minWidth: '20px' }, children: count })] })] }, pipeline))) }) }), _jsxs(Card, { title: `🔥 ${t('huggingface.trends')}`, children: [_jsx(Alert, { message: "Large Language Models are Popular", description: "Recently, GPT series and LLaMA-based models have been attracting attention. Multimodal models are also on the rise.", type: "success", showIcon: true, style: { marginBottom: 16 } }), _jsxs("div", { children: [_jsx(Title, { level: 5, children: "Popular Tags" }), _jsx(Space, { wrap: true, children: stats?.top_tags.slice(0, 12).map((tag, index) => (_jsx(Tag, { color: ['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'][index % 11], children: tag }, tag))) })] })] })] })] }), _jsx(Modal, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(RobotOutlined, { style: { color: '#ff6f00' } }), "\u6A21\u578B\u8BE6\u7EC6\u4FE1\u606F"] }), open: detailModalVisible, onCancel: () => setDetailModalVisible(false), width: 900, footer: null, style: { top: 20 }, children: selectedModel && (_jsxs("div", { children: [_jsxs(Card, { style: { marginBottom: 16 }, children: [_jsx(Title, { level: 4, style: { marginBottom: 16 }, children: selectedModel.name }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Tag, { color: "orange", children: pipelineNames[selectedModel.pipeline_tag || ''] || selectedModel.pipeline_tag || 'unknown' }), (selectedModel.tags || []).slice(0, 5).map(tag => (_jsx(Tag, { style: { fontSize: '10px' }, children: tag }, tag)))] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('huggingface.author') }), _jsx(Text, { children: selectedModel.author })] }), _jsxs("div", { style: { marginBottom: 12 }, children: [_jsx(Text, { strong: true, children: t('huggingface.downloadCount') }), _jsx(Text, { children: formatNumber(selectedModel.downloads || 0) })] }), _jsx(Divider, {}), _jsxs("div", { children: [_jsx(Title, { level: 5, children: t('huggingface.fullDescription') }), _jsx(Paragraph, { style: { whiteSpace: 'pre-wrap', textAlign: 'justify' }, children: selectedModel.description || t('huggingface.noDescription') })] }), _jsx(Divider, {}), _jsx("div", { style: { display: 'flex', gap: 12 }, children: _jsx(Button, { type: "primary", icon: _jsx(LinkOutlined, {}), onClick: () => {
                                            if (selectedModel.original_url) {
                                                window.open(selectedModel.original_url, '_blank');
                                            }
                                        }, disabled: !selectedModel.original_url, children: "\u67E5\u770B\u6A21\u578B" }) })] }), _jsxs(Card, { title: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(MessageOutlined, { style: { color: '#1890ff' } }), "\u5173\u4E8E\u8FD9\u4E2A\u6A21\u578B\u7684\u95EE\u7B54"] }), children: [_jsx("div", { style: { maxHeight: 300, overflowY: 'auto', marginBottom: 16 }, children: chatHistory.length === 0 ? (_jsx("div", { style: { textAlign: 'center', color: '#999', padding: 20 }, children: "\u60A8\u53EF\u4EE5\u95EE\u6211\u5173\u4E8E\u8FD9\u4E2AHuggingFace\u6A21\u578B\u7684\u4EFB\u4F55\u95EE\u9898" })) : (chatHistory.map((chat, index) => (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsxs("div", { style: {
                                                    backgroundColor: '#e6f7ff',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    marginBottom: 8
                                                }, children: [_jsx(Text, { strong: true, children: "\u60A8: " }), _jsx(Text, { children: chat.user })] }), _jsxs("div", { style: {
                                                    backgroundColor: '#f6ffed',
                                                    padding: 8,
                                                    borderRadius: 6
                                                }, children: [_jsx(Text, { strong: true, style: { color: '#52c41a' }, children: "AI: " }), _jsx(Text, { children: chat.ai })] })] }, index)))) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(Input, { value: chatMessage, onChange: (e) => setChatMessage(e.target.value), placeholder: t('huggingface.askQuestionPlaceholder'), onPressEnter: sendChatMessage, disabled: chatLoading }), _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: sendChatMessage, loading: chatLoading, disabled: !chatMessage.trim(), children: "\u53D1\u9001" })] })] })] })) })] }));
};
export default HuggingFacePage;
