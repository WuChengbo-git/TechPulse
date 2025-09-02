import React, { useState, useRef, useEffect } from 'react'
import { 
  Card, Input, Button, List, Avatar, Typography, Space, Alert, Spin, 
  Divider, Tag, Row, Col, Tooltip, message, Modal, Collapse 
} from 'antd'
import { 
  SendOutlined, LinkOutlined, RobotOutlined, UserOutlined, 
  ClearOutlined, CopyOutlined, QuestionCircleOutlined,
  GlobalOutlined, CodeOutlined, FileTextOutlined, BookOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Text, Title, Paragraph } = Typography
const { TextArea } = Input
const { Panel } = Collapse

interface ChatMessage {
  id: string
  type: 'user' | 'ai' | 'system'
  content: string
  timestamp: Date
  isUrl?: boolean
  urlAnalysis?: URLAnalysis
}

interface URLAnalysis {
  url: string
  title: string
  content_summary: string
  key_points: string[]
  analysis: string
  tags: string[]
  content_type: string
}

interface ConversationHistory {
  role: string
  content: string
}

const Chat: React.FC = () => {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentUrl, setCurrentUrl] = useState('')
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<URLAnalysis | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  // 初始化消息
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'system',
      content: t('chat.welcome'),
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [])
  
  // 检查是否为URL
  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }
  
  // 分析URL
  const analyzeUrl = async (url: string, customPrompt?: string) => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/v1/chat/analyze-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          custom_prompt: customPrompt
        }),
      })
      
      if (!response.ok) {
        throw new Error('URL analysis failed')
      }
      
      const analysis: URLAnalysis = await response.json()
      
      // 添加分析结果消息
      const analysisMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: t('chat.analysisComplete'),
        timestamp: new Date(),
        isUrl: true,
        urlAnalysis: analysis
      }
      
      setMessages(prev => [...prev, analysisMessage])
      setCurrentUrl(url)
      setCurrentAnalysis(analysis)
      
      // 更新建议
      setSuggestions([
        t('chat.suggestions.techStack'),
        t('chat.suggestions.quickStart'),
        t('chat.suggestions.practicalValue'),
        t('chat.suggestions.attention')
      ])
      
      message.success('Analysis complete!')
      
    } catch (error) {
      console.error('URL analysis failed:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      message.error('Analysis failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 发送聊天消息
  const sendChatMessage = async (message: string) => {
    try {
      setIsLoading(true)
      
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
      })
      
      if (!response.ok) {
        throw new Error('Chat failed')
      }
      
      const chatResponse = await response.json()
      
      // 添加AI回复
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: chatResponse.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      // 更新对话历史
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: chatResponse.response }
      ])
      
      // 更新建议
      if (chatResponse.suggestions) {
        setSuggestions(chatResponse.suggestions)
      }
      
    } catch (error) {
      console.error('Chat failed:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Response failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      message.error('Message send failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  // 处理发送
  const handleSend = async () => {
    if (!inputValue.trim()) return
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    const currentInput = inputValue
    setInputValue('')
    
    // 检查是否为URL
    if (isValidUrl(currentInput)) {
      await analyzeUrl(currentInput)
    } else {
      await sendChatMessage(currentInput)
    }
  }
  
  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }
  
  // 清空聊天
  const clearChat = () => {
    setMessages([])
    setConversationHistory([])
    setCurrentUrl('')
    setSuggestions([])
    setCurrentAnalysis(null)
    
    // 重新添加欢迎消息
    const welcomeMessage: ChatMessage = {
      id: 'welcome-new',
      type: 'system',
      content: '🔄 Chat cleared. You can start a new conversation!',
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }
  
  // 复制内容
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('Copied to clipboard')
  }
  
  // 获取内容类型图标
  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'github_repository':
        return <CodeOutlined style={{ color: '#24292e' }} />
      case 'tech_blog':
        return <FileTextOutlined style={{ color: '#1890ff' }} />
      case 'documentation':
        return <BookOutlined style={{ color: '#52c41a' }} />
      case 'academic_paper':
        return <FileTextOutlined style={{ color: '#722ed1' }} />
      case 'news':
        return <GlobalOutlined style={{ color: '#fa8c16' }} />
      default:
        return <GlobalOutlined style={{ color: '#666' }} />
    }
  }
  
  // 获取内容类型名称
  const getContentTypeName = (contentType: string) => {
    const types: Record<string, string> = {
      'github_repository': 'GitHub Repository',
      'tech_blog': 'Tech Blog',
      'documentation': 'Technical Documentation',
      'academic_paper': 'Academic Paper',
      'news': 'Tech News',
      'technical_content': 'Technical Content',
      'general_web_page': 'General Web Page'
    }
    return types[contentType] || 'Web Page Content'
  }
  
  // 渲染消息
  const renderMessage = (msg: ChatMessage) => {
    const isUser = msg.type === 'user'
    const isSystem = msg.type === 'system'
    
    return (
      <div key={msg.id} style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-start',
          gap: 8
        }}>
          {!isUser && (
            <Avatar 
              icon={isSystem ? <RobotOutlined /> : <RobotOutlined />} 
              style={{ 
                backgroundColor: isSystem ? '#52c41a' : '#1890ff',
                flexShrink: 0
              }} 
            />
          )}
          
          <Card
            size="small"
            style={{
              maxWidth: '70%',
              backgroundColor: isUser ? '#1890ff' : isSystem ? '#f6ffed' : '#fff',
              border: isUser ? 'none' : isSystem ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
            }}
            bodyStyle={{ 
              padding: '12px 16px',
              color: isUser ? '#fff' : 'inherit'
            }}
          >
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {msg.content}
            </div>
            
            {/* URL分析结果 */}
            {msg.urlAnalysis && (
              <div style={{ marginTop: 12 }}>
                <Divider style={{ margin: '12px 0' }} />
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getContentTypeIcon(msg.urlAnalysis.content_type)}
                    <Text strong>{getContentTypeName(msg.urlAnalysis.content_type)}</Text>
                  </div>
                  
                  <Text strong style={{ fontSize: '14px' }}>
                    {msg.urlAnalysis.title}
                  </Text>
                  
                  <div>
                    {msg.urlAnalysis.tags.map((tag, index) => (
                      <Tag key={index} size="small" style={{ marginBottom: 4 }}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  
                  <Space>
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      onClick={() => {
                        setCurrentAnalysis(msg.urlAnalysis!)
                        setAnalysisModalVisible(true)
                      }}
                    >
                      {t('chat.detailAnalysis')}
                    </Button>
                    <Button 
                      size="small" 
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(msg.urlAnalysis!.content_summary)}
                    >
                      {t('chat.copySummary')}
                    </Button>
                  </Space>
                </Space>
              </div>
            )}
            
            <div style={{ 
              marginTop: 8, 
              fontSize: '12px', 
              opacity: 0.7,
              textAlign: 'right'
            }}>
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </Card>
          
          {isUser && (
            <Avatar 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#faad14', flexShrink: 0 }} 
            />
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ color: '#1890ff' }} />
              {t('chat.title')}
            </Title>
            <Text type="secondary">{t('chat.subtitle')}</Text>
          </div>
          
          <Space>
            {currentUrl && (
              <Tooltip title={t('chat.currentPage')}>
                <Tag color="blue" icon={<LinkOutlined />}>
                  {currentUrl.length > 30 ? currentUrl.substring(0, 30) + '...' : currentUrl}
                </Tag>
              </Tooltip>
            )}
            <Button 
              icon={<ClearOutlined />} 
              onClick={clearChat}
              type="text"
            >
              {t('chat.clearChat')}
            </Button>
          </Space>
        </div>
      </Card>
      
      {/* 聊天区域 */}
      <Card 
        style={{ 
          flex: 1, 
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column'
        }}
        bodyStyle={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: '16px'
        }}
      >
        <div 
          ref={chatContainerRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            paddingRight: 8,
            marginBottom: 16
          }}
        >
          {messages.map(renderMessage)}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Spin>
                <div style={{ marginTop: 8 }}>{t('chat.aiThinking')}</div>
              </Spin>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 建议区域 */}
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>{t('chat.suggestedQuestions')}</Text>
            <div style={{ marginTop: 8 }}>
              {suggestions.map((suggestion, index) => (
                <Tag 
                  key={index}
                  style={{ 
                    margin: '2px 4px 2px 0', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Tag>
              ))}
            </div>
          </div>
        )}
        
        {/* 输入区域 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            autoSize={{ minRows: 1, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            style={{ flex: 1 }}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSend}
            loading={isLoading}
            style={{ height: 'auto' }}
          >
            {t('chat.send')}
          </Button>
        </div>
        
        <Text type="secondary" style={{ fontSize: '11px', marginTop: 4 }}>
          {t('chat.hint')}
        </Text>
      </Card>
      
      {/* 详细分析模态框 */}
      <Modal
        title={t('chat.detailAnalysisTitle')}
        open={analysisModalVisible}
        onCancel={() => setAnalysisModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => {
            if (currentAnalysis) {
              copyToClipboard(currentAnalysis.analysis)
            }
          }}>
            {t('chat.copyAnalysis')}
          </Button>,
          <Button key="close" type="primary" onClick={() => setAnalysisModalVisible(false)}>
            {t('common.close')}
          </Button>
        ]}
        width={800}
      >
        {currentAnalysis && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>{t('chat.titleLabel')}</Text>
              <Paragraph copyable={{ text: currentAnalysis.title }}>
                {currentAnalysis.title}
              </Paragraph>
            </div>
            
            <div>
              <Text strong>{t('chat.link')}</Text>
              <Paragraph copyable={{ text: currentAnalysis.url }}>
                <a href={currentAnalysis.url} target="_blank" rel="noopener noreferrer">
                  {currentAnalysis.url}
                </a>
              </Paragraph>
            </div>
            
            <div>
              <Text strong>{t('chat.contentType')}</Text>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {getContentTypeName(currentAnalysis.content_type)}
              </Tag>
            </div>
            
            <div>
              <Text strong>{t('chat.keyPoints')}</Text>
              <ul style={{ marginTop: 8 }}>
                {currentAnalysis.key_points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <Text strong>{t('chat.detailedAnalysis')}</Text>
              <Paragraph style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#fafafa', 
                padding: 16, 
                borderRadius: 6,
                marginTop: 8
              }}>
                {currentAnalysis.analysis}
              </Paragraph>
            </div>
            
            <div>
              <Text strong>{t('chat.relatedTags')}</Text>
              <div style={{ marginTop: 8 }}>
                {currentAnalysis.tags.map((tag, index) => (
                  <Tag key={index} style={{ marginBottom: 4 }}>
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default Chat