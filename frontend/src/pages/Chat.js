import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Avatar, Typography, Space, Spin, Divider, Tag, Tooltip, message, Modal, Collapse } from 'antd';
import { SendOutlined, LinkOutlined, RobotOutlined, UserOutlined, ClearOutlined, CopyOutlined, GlobalOutlined, CodeOutlined, FileTextOutlined, BookOutlined, EyeOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;
const Chat = () => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState(null);
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    // 初始化消息
    useEffect(() => {
        const welcomeMessage = {
            id: 'welcome',
            type: 'system',
            content: t('chat.welcome'),
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    }, []);
    // 检查是否为URL
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        }
        catch (_) {
            return false;
        }
    };
    // 分析URL
    const analyzeUrl = async (url, customPrompt) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/v1/chat/analyze-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: url,
                    custom_prompt: customPrompt
                }),
            });
            if (!response.ok) {
                throw new Error('URL analysis failed');
            }
            const analysis = await response.json();
            // 添加分析结果消息
            const analysisMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: t('chat.analysisComplete'),
                timestamp: new Date(),
                isUrl: true,
                urlAnalysis: analysis
            };
            setMessages(prev => [...prev, analysisMessage]);
            setCurrentUrl(url);
            setCurrentAnalysis(analysis);
            // 更新建议
            setSuggestions([
                t('chat.suggestions.techStack'),
                t('chat.suggestions.quickStart'),
                t('chat.suggestions.practicalValue'),
                t('chat.suggestions.attention')
            ]);
            message.success('Analysis complete!');
        }
        catch (error) {
            console.error('URL analysis failed:', error);
            const errorMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            message.error('Analysis failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    // 发送聊天消息
    const sendChatMessage = async (message) => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/v1/chat/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context_url: currentUrl || null,
                    conversation_history: conversationHistory
                }),
            });
            if (!response.ok) {
                throw new Error('Chat failed');
            }
            const chatResponse = await response.json();
            // 添加AI回复
            const aiMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: chatResponse.response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
            // 更新对话历史
            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: message },
                { role: 'assistant', content: chatResponse.response }
            ]);
            // 更新建议
            if (chatResponse.suggestions) {
                setSuggestions(chatResponse.suggestions);
            }
        }
        catch (error) {
            console.error('Chat failed:', error);
            const errorMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: `❌ Response failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            message.error('Message send failed');
        }
        finally {
            setIsLoading(false);
        }
    };
    // 处理发送
    const handleSend = async () => {
        if (!inputValue.trim())
            return;
        const userMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue('');
        // 检查是否为URL
        if (isValidUrl(currentInput)) {
            await analyzeUrl(currentInput);
        }
        else {
            await sendChatMessage(currentInput);
        }
    };
    // 处理建议点击
    const handleSuggestionClick = (suggestion) => {
        setInputValue(suggestion);
    };
    // 清空聊天
    const clearChat = () => {
        setMessages([]);
        setConversationHistory([]);
        setCurrentUrl('');
        setSuggestions([]);
        setCurrentAnalysis(null);
        // 重新添加欢迎消息
        const welcomeMessage = {
            id: 'welcome-new',
            type: 'system',
            content: '🔄 Chat cleared. You can start a new conversation!',
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
    };
    // 复制内容
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        message.success('Copied to clipboard');
    };
    // 获取内容类型图标
    const getContentTypeIcon = (contentType) => {
        switch (contentType) {
            case 'github_repository':
                return _jsx(CodeOutlined, { style: { color: '#24292e' } });
            case 'tech_blog':
                return _jsx(FileTextOutlined, { style: { color: '#1890ff' } });
            case 'documentation':
                return _jsx(BookOutlined, { style: { color: '#52c41a' } });
            case 'academic_paper':
                return _jsx(FileTextOutlined, { style: { color: '#722ed1' } });
            case 'news':
                return _jsx(GlobalOutlined, { style: { color: '#fa8c16' } });
            default:
                return _jsx(GlobalOutlined, { style: { color: '#666' } });
        }
    };
    // 获取内容类型名称
    const getContentTypeName = (contentType) => {
        const types = {
            'github_repository': 'GitHub Repository',
            'tech_blog': 'Tech Blog',
            'documentation': 'Technical Documentation',
            'academic_paper': 'Academic Paper',
            'news': 'Tech News',
            'technical_content': 'Technical Content',
            'general_web_page': 'General Web Page'
        };
        return types[contentType] || 'Web Page Content';
    };
    // 渲染消息
    const renderMessage = (msg) => {
        const isUser = msg.type === 'user';
        const isSystem = msg.type === 'system';
        return (_jsx("div", { style: { marginBottom: 16 }, children: _jsxs("div", { style: {
                    display: 'flex',
                    justifyContent: isUser ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 8
                }, children: [!isUser && (_jsx(Avatar, { icon: isSystem ? _jsx(RobotOutlined, {}) : _jsx(RobotOutlined, {}), style: {
                            backgroundColor: isSystem ? '#52c41a' : '#1890ff',
                            flexShrink: 0
                        } })), _jsxs(Card, { size: "small", style: {
                            maxWidth: '70%',
                            backgroundColor: isUser ? '#1890ff' : isSystem ? '#f6ffed' : '#fff',
                            border: isUser ? 'none' : isSystem ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
                        }, bodyStyle: {
                            padding: '12px 16px',
                            color: isUser ? '#fff' : 'inherit'
                        }, children: [_jsx("div", { style: { whiteSpace: 'pre-wrap', lineHeight: '1.6' }, children: msg.content }), msg.urlAnalysis && (_jsxs("div", { style: { marginTop: 12 }, children: [_jsx(Divider, { style: { margin: '12px 0' } }), _jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [getContentTypeIcon(msg.urlAnalysis.content_type), _jsx(Text, { strong: true, children: getContentTypeName(msg.urlAnalysis.content_type) })] }), _jsx(Text, { strong: true, style: { fontSize: '14px' }, children: msg.urlAnalysis.title }), _jsx("div", { children: msg.urlAnalysis.tags.map((tag, index) => (_jsx(Tag, { size: "small", style: { marginBottom: 4 }, children: tag }, index))) }), _jsxs(Space, { children: [_jsx(Button, { size: "small", icon: _jsx(EyeOutlined, {}), onClick: () => {
                                                            setCurrentAnalysis(msg.urlAnalysis);
                                                            setAnalysisModalVisible(true);
                                                        }, children: t('chat.detailAnalysis') }), _jsx(Button, { size: "small", icon: _jsx(CopyOutlined, {}), onClick: () => copyToClipboard(msg.urlAnalysis.content_summary), children: t('chat.copySummary') })] })] })] })), _jsx("div", { style: {
                                    marginTop: 8,
                                    fontSize: '12px',
                                    opacity: 0.7,
                                    textAlign: 'right'
                                }, children: msg.timestamp.toLocaleTimeString() })] }), isUser && (_jsx(Avatar, { icon: _jsx(UserOutlined, {}), style: { backgroundColor: '#faad14', flexShrink: 0 } }))] }) }, msg.id));
    };
    return (_jsxs("div", { style: { height: '100%', display: 'flex', flexDirection: 'column' }, children: [_jsx(Card, { style: { marginBottom: 16 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 3, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(RobotOutlined, { style: { color: '#1890ff' } }), t('chat.title')] }), _jsx(Text, { type: "secondary", children: t('chat.subtitle') })] }), _jsxs(Space, { children: [currentUrl && (_jsx(Tooltip, { title: t('chat.currentPage'), children: _jsx(Tag, { color: "blue", icon: _jsx(LinkOutlined, {}), children: currentUrl.length > 30 ? currentUrl.substring(0, 30) + '...' : currentUrl }) })), _jsx(Button, { icon: _jsx(ClearOutlined, {}), onClick: clearChat, type: "text", children: t('chat.clearChat') })] })] }) }), _jsxs(Card, { style: {
                    flex: 1,
                    marginBottom: 16,
                    display: 'flex',
                    flexDirection: 'column'
                }, bodyStyle: {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px'
                }, children: [_jsxs("div", { ref: chatContainerRef, style: {
                            flex: 1,
                            overflowY: 'auto',
                            paddingRight: 8,
                            marginBottom: 16
                        }, children: [messages.map(renderMessage), isLoading && (_jsx("div", { style: { textAlign: 'center', padding: 20 }, children: _jsx(Spin, { children: _jsx("div", { style: { marginTop: 8 }, children: t('chat.aiThinking') }) }) })), _jsx("div", { ref: messagesEndRef })] }), suggestions.length > 0 && (_jsxs("div", { style: { marginBottom: 16 }, children: [_jsx(Text, { type: "secondary", style: { fontSize: '12px' }, children: t('chat.suggestedQuestions') }), _jsx("div", { style: { marginTop: 8 }, children: suggestions.map((suggestion, index) => (_jsx(Tag, { style: {
                                        margin: '2px 4px 2px 0',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }, onClick: () => handleSuggestionClick(suggestion), children: suggestion }, index))) })] })), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx(TextArea, { value: inputValue, onChange: (e) => setInputValue(e.target.value), placeholder: t('chat.inputPlaceholder'), autoSize: { minRows: 1, maxRows: 4 }, onPressEnter: (e) => {
                                    if (!e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }, style: { flex: 1 } }), _jsx(Button, { type: "primary", icon: _jsx(SendOutlined, {}), onClick: handleSend, loading: isLoading, style: { height: 'auto' }, children: t('chat.send') })] }), _jsx(Text, { type: "secondary", style: { fontSize: '11px', marginTop: 4 }, children: t('chat.hint') })] }), _jsx(Modal, { title: t('chat.detailAnalysisTitle'), open: analysisModalVisible, onCancel: () => setAnalysisModalVisible(false), footer: [
                    _jsx(Button, { icon: _jsx(CopyOutlined, {}), onClick: () => {
                            if (currentAnalysis) {
                                copyToClipboard(currentAnalysis.analysis);
                            }
                        }, children: t('chat.copyAnalysis') }, "copy"),
                    _jsx(Button, { type: "primary", onClick: () => setAnalysisModalVisible(false), children: t('common.close') }, "close")
                ], width: 800, children: currentAnalysis && (_jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.titleLabel') }), _jsx(Paragraph, { copyable: { text: currentAnalysis.title }, children: currentAnalysis.title })] }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.link') }), _jsx(Paragraph, { copyable: { text: currentAnalysis.url }, children: _jsx("a", { href: currentAnalysis.url, target: "_blank", rel: "noopener noreferrer", children: currentAnalysis.url }) })] }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.contentType') }), _jsx(Tag, { color: "blue", style: { marginLeft: 8 }, children: getContentTypeName(currentAnalysis.content_type) })] }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.keyPoints') }), _jsx("ul", { style: { marginTop: 8 }, children: currentAnalysis.key_points.map((point, index) => (_jsx("li", { children: point }, index))) })] }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.detailedAnalysis') }), _jsx(Paragraph, { style: {
                                        whiteSpace: 'pre-wrap',
                                        backgroundColor: '#fafafa',
                                        padding: 16,
                                        borderRadius: 6,
                                        marginTop: 8
                                    }, children: currentAnalysis.analysis })] }), _jsxs("div", { children: [_jsx(Text, { strong: true, children: t('chat.relatedTags') }), _jsx("div", { style: { marginTop: 8 }, children: currentAnalysis.tags.map((tag, index) => (_jsx(Tag, { style: { marginBottom: 4 }, children: tag }, index))) })] })] })) })] }));
};
export default Chat;
