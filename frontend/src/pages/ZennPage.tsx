import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Button, message, Typography, Space, Badge, 
  Statistic, List, Tag, Tabs, Input, Select, Avatar
} from 'antd'
import { 
  EditOutlined, SyncOutlined, UserOutlined, 
  SearchOutlined, LikeOutlined, LinkOutlined,
  CalendarOutlined, BookOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

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
          author_name: article.author_name || '匿名',
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
          const author = article.author_name || '匿名'
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
        <TabPane tab={`All (${articles.length})`} key="all" />
        <TabPane tab={`Popular (${articles.filter(a => (a.likes_count || 0) > 10).length})`} key="popular" />
        <TabPane tab="Recent" key="recent" />
        <TabPane tab="Premium Articles" key="premium" />
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
                        key="view" 
                        type="link" 
                        icon={<LinkOutlined />}
                        onClick={() => {
                          if (article.url) {
                            window.open(article.url, '_blank')
                          } else {
                            message.warning('文章链接不可用')
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text strong>{article.title || '无标题'}</Text>
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
                              Author: {article.author_name || '匿名'}
                            </Text>
                          </div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                            {article.content_excerpt || '暂无摘要'}
                          </Paragraph>
                          <Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <LikeOutlined /> {article.likes_count || 0} {t('zenn.likes')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              💬 {article.comments_count || 0} {t('zenn.comments')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <CalendarOutlined /> {article.published_at ? new Date(article.published_at).toLocaleDateString() : '未知'}
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
                      {author.articles} articles
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
                💡 About Zenn
              </Title>
              <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                High-quality technical articles by the Japanese developer community. Features practical content and detailed explanations.
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ZennPage