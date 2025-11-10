import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Button, message, Typography, Space, Badge, 
  Statistic, List, Tag, Tabs, Input, Select, Avatar, Modal, Divider
} from 'antd'
import { 
  EditOutlined, SyncOutlined, UserOutlined, 
  SearchOutlined, LikeOutlined, LinkOutlined,
  CalendarOutlined, BookOutlined, EyeOutlined, MessageOutlined, SendOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import QualityBadge from '../components/QualityBadge'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface ZennArticle {
  id: number
  title: string
  source: string
  original_url: string
  summary?: string
  chinese_tags?: string[]
  created_at: string
  quality_score?: number
  // Zenn特有字段
  content_excerpt?: string
  author_name?: string
  author_avatar?: string
  published_at?: string
  updated_at?: string
  url?: string  // 兼容字段
  likes_count?: number
  comments_count?: number
  emoji?: string
  tags?: string[]
  type?: 'article' | 'book' | 'scrap'
  is_premium?: boolean
}

interface ZennStats {
  total_articles: number
  today_new: number
  total_likes: number
  top_authors: Array<{ name: string; articles: number }>
  popular_tags: string[]
  last_update: string
}

const ZennPage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [articles, setArticles] = useState<ZennArticle[]>([])
  const [stats, setStats] = useState<ZennStats | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<ZennArticle | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{user: string, ai: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // 打开详细信息Modal
  const openDetailModal = (article: ZennArticle) => {
    setSelectedArticle(article)
    setDetailModalVisible(true)
    setChatHistory([])
    setChatMessage('')
  }

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedArticle) return
    
    setChatLoading(true)
    try {
      const userMessage = chatMessage.trim()
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
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, {
          user: userMessage,
          ai: data.response || t('zenn.cannotAnswer')
        }])
        setChatMessage('')
      } else {
        message.error(t('zenn.sendMessageFailed'))
      }
    } catch (error) {
      console.error('Chat error:', error)
      message.error(t('zenn.sendMessageFailed'))
    } finally {
      setChatLoading(false)
    }
  }

  // 获取Zenn数据
  const fetchZennData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=zenn&limit=100')
      if (response.ok) {
        const data = await response.json()
        console.log('Zenn data sample:', data[0]) // 调试信息
        
        // 处理数据，适配 TechCard 结构
        const processedArticles = data.map((article: any) => ({
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
        }))
        setArticles(processedArticles)
        
        // 模拟统计数据
        const authorCounts = processedArticles.reduce((acc: Record<string, number>, article: any) => {
          const author = article.author_name || t('zenn.anonymous')
          acc[author] = (acc[author] || 0) + 1
          return acc
        }, {})

        const allTags = processedArticles.flatMap((article: any) => article.tags || [])
        const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
          if (tag) acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})

        const mockStats: ZennStats = {
          total_articles: processedArticles.length,
          today_new: processedArticles.filter((article: any) => {
            if (!article.published_at) return false
            try {
              return new Date(article.published_at).toDateString() === new Date().toDateString()
            } catch {
              return false
            }
          }).length,
          total_likes: processedArticles.reduce((sum: number, article: any) => sum + (article.likes_count || 0), 0),
          top_authors: Object.entries(authorCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([name, articles]) => ({ name, articles: articles as number })),
          popular_tags: Object.entries(tagCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 15)
            .map(([tag]) => tag),
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch Zenn data:', error)
      message.error('Failed to fetch Zenn data')
    } finally {
      setLoading(false)
    }
  }

  // 更新Zenn数据
  const updateZennData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/sources/collect/zenn', { method: 'POST' })
      
      if (response.ok) {
        const result = await response.json()
        message.success(`Zenn data updated successfully! ${result.count || 0} new articles retrieved`)
        await fetchZennData()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      message.error('Failed to update Zenn data')
    } finally {
      setLoading(false)
    }
  }

  // 过滤文章
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchQuery || 
      (article.title && article.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.content_excerpt && article.content_excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (article.author_name && article.author_name.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = typeFilter === 'all' || article.type === typeFilter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'popular' && (article.likes_count || 0) > 10) ||
      (activeTab === 'recent' && article.published_at && 
        new Date(article.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === 'premium' && article.is_premium)
    
    return matchesSearch && matchesType && matchesTab
  })

  useEffect(() => {
    fetchZennData()
  }, [])

  return (
    <div>
      {/* 头部区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <EditOutlined style={{ color: '#3ea8ff' }} />
              {t('zenn.title')}
            </Title>
            <Text type="secondary">{t('zenn.subtitle')}</Text>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={updateZennData}
              loading={loading}
            >
              {t('zenn.updateData')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('zenn.totalArticles')}
              value={stats?.total_articles || 0}
              prefix={<BookOutlined style={{ color: '#3ea8ff' }} />}
              valueStyle={{ color: '#3ea8ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('zenn.todayNew')}
              value={stats?.today_new || 0}
              prefix={<EditOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('zenn.totalLikes')}
              value={stats?.total_likes || 0}
              prefix={<LikeOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('zenn.activeAuthors')}
              value={stats?.top_authors?.length || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder={t('zenn.searchPlaceholder')}
              allowClear
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 120 }}
              placeholder={t('zenn.typeFilter')}
            >
              <Option value="all">{t('zenn.allTypes')}</Option>
              <Option value="article">{t('zenn.article')}</Option>
              <Option value="book">{t('zenn.book')}</Option>
              <Option value="scrap">{t('zenn.scrap')}</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tab导航 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={`${t('zenn.all')} (${articles.length})`} key="all" />
        <TabPane tab={`${t('zenn.popular')} (${articles.filter(a => (a.likes_count || 0) > 10).length})`} key="popular" />
        <TabPane tab={t('zenn.recent')} key="recent" />
        <TabPane tab={t('zenn.premiumArticles')} key="premium" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 文章列表 */}
        <Col xs={24} lg={16}>
          <Card title={`📝 ${t('zenn.articles')}`} style={{ minHeight: '600px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>Loading data...</span>
              </div>
            ) : (
              <List
                dataSource={filteredArticles}
                renderItem={(article) => (
                  <List.Item
                    actions={[
                      <Button
                        key="detail"
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetailModal(article)}
                      >
                        {t('zenn.viewDetails')}
                      </Button>,
                      <Button 
                        key="view" 
                        type="link" 
                        icon={<LinkOutlined />}
                        onClick={() => {
                          if (article.url) {
                            window.open(article.url, '_blank')
                          } else {
                            message.warning(t('zenn.articleLinkUnavailable'))
                          }
                        }}
                      >
                        {t('zenn.readArticle')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '24px' }}>{article.emoji || '📝'}</span>
                          <Avatar 
                            src={article.author_avatar} 
                            size="small"
                            icon={<UserOutlined />}
                          />
                        </div>
                      }
                      title={
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <Text strong>{article.title || t('zenn.noTitle')}</Text>
                            {article.quality_score !== undefined && (
                              <QualityBadge score={article.quality_score} size="small" />
                            )}
                            <Tag color="blue">
                              {article.type === 'article' ? t('zenn.article') :
                               article.type === 'book' ? t('zenn.book') : t('zenn.scrap')}
                            </Tag>
                            {article.is_premium && (
                              <Tag color="gold">{t('zenn.premium')}</Tag>
                            )}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {(article.tags || []).slice(0, 4).map(tag => (
                              <Tag key={tag} color="cyan">
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Author: {article.author_name || t('zenn.anonymous')}
                            </Text>
                          </div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                            {article.content_excerpt || t('zenn.noSummary')}
                          </Paragraph>
                          <Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <LikeOutlined /> {article.likes_count || 0} {t('zenn.likes')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              💬 {article.comments_count || 0} {t('zenn.comments')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <CalendarOutlined /> {article.published_at ? new Date(article.published_at).toLocaleDateString() : t('zenn.unknown')}
                            </Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} / ${total} articles`
                }}
              />
            )}
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 人气作者 */}
          <Card title={`👥 ${t('zenn.popularAuthors')}`} style={{ marginBottom: 16 }}>
            <List
              size="small"
              dataSource={stats?.top_authors || []}
              renderItem={(author, index) => (
                <List.Item>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Badge 
                        count={index + 1} 
                        style={{ 
                          backgroundColor: index < 3 ? ['#f50', '#fa8c16', '#fadb14'][index] : '#d9d9d9' 
                        }}
                      />
                      <Text style={{ fontSize: '12px' }}>{author.name}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {author.articles} {t('zenn.articles')}
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          {/* 人气标签 */}
          <Card title={`🏷️ ${t('zenn.popularTags')}`}>
            <Space wrap>
              {stats?.popular_tags.map((tag, index) => (
                <Tag 
                  key={tag}
                  color={[
                    'magenta', 'red', 'volcano', 'orange', 'gold',
                    'lime', 'green', 'cyan', 'blue', 'geekblue', 
                    'purple'
                  ][index % 11]}
                  style={{ 
                    fontSize: `${Math.max(10, 14 - index * 0.2)}px`,
                    marginBottom: 4
                  }}
                >
                  {tag}
                </Tag>
              ))}
            </Space>
            
            <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f6ffed', borderRadius: 6 }}>
              <Title level={5} style={{ color: '#389e0d', margin: 0, marginBottom: 8 }}>
                💡 {t('zenn.aboutZenn')}
              </Title>
              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                {t('zenn.aboutZennDesc')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细信息Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: '#3ea8ff' }} />
            文章详细信息
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedArticle && (
          <div>
            {/* 文章基本信息 */}
            <Card style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '24px', marginRight: 8 }}>{selectedArticle.emoji || '📝'}</span>
                {selectedArticle.title || t('zenn.noTitle')}
              </Title>

              <div style={{ marginBottom: 12 }}>
                <Tag color="blue">
                  {selectedArticle.type === 'article' ? t('zenn.article') :
                   selectedArticle.type === 'book' ? t('zenn.book') : t('zenn.scrap')}
                </Tag>
                {selectedArticle.is_premium && (
                  <Tag color="gold">{t('zenn.premium')}</Tag>
                )}
                {(selectedArticle.tags || []).slice(0, 4).map(tag => (
                  <Tag key={tag} color="cyan">
                    {tag}
                  </Tag>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>{t('zenn.author')}</Text>
                <Text>{selectedArticle.author_name || t('zenn.anonymous')}</Text>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>{t('zenn.publishTime')}</Text>
                <Text>{selectedArticle.published_at ? new Date(selectedArticle.published_at).toLocaleDateString() : t('zenn.unknown')}</Text>
              </div>

              <Divider />

              <div>
                <Title level={5}>{t('zenn.fullSummary')}</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                  {selectedArticle.content_excerpt || t('zenn.noSummary')}
                </Paragraph>
              </div>

              <Divider />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    if (selectedArticle.original_url) {
                      window.open(selectedArticle.original_url, '_blank')
                    }
                  }}
                  disabled={!selectedArticle.original_url}
                >
                  阅读全文
                </Button>
              </div>
            </Card>

            {/* AI聊天功能 */}
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                关于这篇文章的问答
              </div>
            }>
              {/* 聊天历史 */}
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    您可以问我关于这篇Zenn文章的任何问题
                  </div>
                ) : (
                  chatHistory.map((chat, index) => (
                    <div key={index} style={{ marginBottom: 16 }}>
                      <div style={{ 
                        backgroundColor: '#e6f7ff', 
                        padding: 8, 
                        borderRadius: 6, 
                        marginBottom: 8 
                      }}>
                        <Text strong>您: </Text>
                        <Text>{chat.user}</Text>
                      </div>
                      <div style={{ 
                        backgroundColor: '#f6ffed', 
                        padding: 8, 
                        borderRadius: 6 
                      }}>
                        <Text strong style={{ color: '#52c41a' }}>AI: </Text>
                        <Text>{chat.ai}</Text>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 消息输入 */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder={t('zenn.askQuestionPlaceholder')}
                  onPressEnter={sendChatMessage}
                  disabled={chatLoading}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendChatMessage}
                  loading={chatLoading}
                  disabled={!chatMessage.trim()}
                >
                  发送
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ZennPage