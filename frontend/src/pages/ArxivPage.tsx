import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Button, message, Typography, Space, Badge, 
  Statistic, List, Tag, Tabs, Input, Select, Progress, Alert
} from 'antd'
import { 
  FileTextOutlined, SyncOutlined, BookOutlined, 
  SearchOutlined, CalendarOutlined, UserOutlined, LinkOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  categories: string[]
  published_date: string
  updated_date: string
  url: string
  pdf_url: string
  citations?: number
}

interface ArxivStats {
  total_papers: number
  today_new: number
  categories: Record<string, number>
  top_authors: string[]
  last_update: string
}

const ArxivPage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [papers, setPapers] = useState<ArxivPaper[]>([])
  const [stats, setStats] = useState<ArxivStats | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // arXiv分类映射
  const categoryNames: Record<string, string> = {
    'cs.AI': 'AI・Machine Learning',
    'cs.CL': 'Natural Language Processing',
    'cs.CV': 'Computer Vision',
    'cs.LG': 'Machine Learning',
    'cs.RO': 'Robotics',
    'cs.SE': 'Software Engineering',
    'stat.ML': 'Statistical Machine Learning',
    'math.OC': 'Optimization and Control'
  }

  // 获取arXiv数据
  const fetchArxivData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=arxiv&limit=100')
      if (response.ok) {
        const data = await response.json()
        setPapers(data)
        
        // 模拟统计数据
        const categories = data.reduce((acc: Record<string, number>, paper: ArxivPaper) => {
          paper.categories.forEach(cat => {
            acc[cat] = (acc[cat] || 0) + 1
          })
          return acc
        }, {})

        const mockStats: ArxivStats = {
          total_papers: data.length,
          today_new: data.filter((paper: ArxivPaper) => 
            new Date(paper.published_date).toDateString() === new Date().toDateString()
          ).length,
          categories,
          top_authors: ['Geoffrey Hinton', 'Yann LeCun', 'Yoshua Bengio', 'Andrew Ng'],
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch arXiv data:', error)
      message.error('Failed to fetch arXiv data')
    } finally {
      setLoading(false)
    }
  }

  // 更新arXiv数据
  const updateArxivData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/sources/collect/arxiv', { method: 'POST' })
      
      if (response.ok) {
        const result = await response.json()
        message.success(`arXiv data updated successfully! ${result.count || 0} new papers retrieved`)
        await fetchArxivData()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      message.error('Failed to update arXiv data')
    } finally {
      setLoading(false)
    }
  }

  // 过滤论文
  const filteredPapers = papers.filter(paper => {
    const matchesSearch = !searchQuery || 
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = categoryFilter === 'all' || paper.categories.includes(categoryFilter)
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'recent' && new Date(paper.published_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === 'ai' && paper.categories.some(cat => cat.includes('cs.AI') || cat.includes('cs.LG'))) ||
      (activeTab === 'cv' && paper.categories.some(cat => cat.includes('cs.CV')))
    
    return matchesSearch && matchesCategory && matchesTab
  })

  useEffect(() => {
    fetchArxivData()
  }, [])

  return (
    <div>
      {/* 头部区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileTextOutlined style={{ color: '#b31b1b' }} />
              {t('arxiv.title')}
            </Title>
            <Text type="secondary">{t('arxiv.subtitle')}</Text>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={updateArxivData}
              loading={loading}
            >
              {t('arxiv.updateData')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('arxiv.totalPapers')}
              value={stats?.total_papers || 0}
              prefix={<FileTextOutlined style={{ color: '#b31b1b' }} />}
              valueStyle={{ color: '#b31b1b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('arxiv.todayNew')}
              value={stats?.today_new || 0}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('arxiv.aiRelated')}
              value={papers.filter(p => p.categories.some(cat => 
                cat.includes('cs.AI') || cat.includes('cs.LG') || cat.includes('cs.CL')
              )).length}
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('arxiv.mainCategory')}
              value={stats?.categories ? Object.keys(stats.categories)[0] || 'cs.AI' : 'cs.AI'}
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder={t('arxiv.searchPlaceholder')}
              allowClear
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 150 }}
              placeholder={t('arxiv.categoryFilter')}
            >
              <Option value="all">{t('arxiv.allCategories')}</Option>
              <Option value="cs.AI">AI・Machine Learning</Option>
              <Option value="cs.CL">Natural Language Processing</Option>
              <Option value="cs.CV">Computer Vision</Option>
              <Option value="cs.LG">Machine Learning</Option>
              <Option value="cs.RO">Robotics</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tab导航 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={`All (${papers.length})`} key="all" />
        <TabPane tab={`Recent (${papers.filter(p => 
          new Date(p.published_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length})`} key="recent" />
        <TabPane tab="AI Related" key="ai" />
        <TabPane tab="Computer Vision" key="cv" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 论文列表 */}
        <Col xs={24} lg={16}>
          <Card title={`📚 ${t('arxiv.papers')}`} style={{ minHeight: '600px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>Loading data...</span>
              </div>
            ) : (
              <List
                dataSource={filteredPapers}
                renderItem={(paper) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="abstract" 
                        type="link" 
                        href={paper.url} 
                        target="_blank"
                        icon={<LinkOutlined />}
                      >
                        {t('arxiv.abstract')}
                      </Button>,
                      <Button 
                        key="pdf" 
                        type="link" 
                        href={paper.pdf_url} 
                        target="_blank"
                        style={{ color: '#b31b1b' }}
                      >
                        {t('arxiv.pdf')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 4 }}>
                            {paper.title}
                          </Text>
                          <div style={{ marginBottom: 8 }}>
                            {paper.categories.map(cat => (
                              <Tag key={cat} color="red">
                                {categoryNames[cat] || cat}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 8 }}>
                            <UserOutlined style={{ marginRight: 4 }} />
                            <Text type="secondary">
                              {paper.authors.slice(0, 3).join(', ')}
                              {paper.authors.length > 3 && ` and ${paper.authors.length - 3} others`}
                            </Text>
                          </div>
                          <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 8 }}>
                            {paper.abstract}
                          </Paragraph>
                          <Space>
                            <Text type="secondary">
                              <CalendarOutlined /> {t('arxiv.published')}: {new Date(paper.published_date).toLocaleDateString()}
                            </Text>
                            {paper.updated_date !== paper.published_date && (
                              <Text type="secondary">
                                {t('arxiv.updated')}: {new Date(paper.updated_date).toLocaleDateString()}
                              </Text>
                            )}
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
                    `${range[0]}-${range[1]} / ${total} papers`
                }}
              />
            )}
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 分类统计 */}
          <Card title={`📊 ${t('arxiv.categoryStats')}`} style={{ marginBottom: 16 }}>
            <div>
              {stats?.categories && Object.entries(stats.categories)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([category, count]) => (
                <div key={category} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <Text style={{ fontSize: '12px' }}>
                    {categoryNames[category] || category}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Progress 
                      percent={Math.round((count / (stats?.total_papers || 1)) * 100)} 
                      size="small" 
                      style={{ width: '60px' }}
                      showInfo={false}
                    />
                    <Text style={{ fontSize: '12px', minWidth: '20px' }}>{count}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 研究趋势 */}
          <Card title={`📈 ${t('arxiv.researchTrends')}`}>
            <Alert
              message="AI & Machine Learning Field Active"
              description="Recent submissions show an increasing trend in research on large language models and computer vision."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div>
              <Title level={5}>Hot Research Keywords</Title>
              <Space wrap>
                <Tag color="magenta">Transformer</Tag>
                <Tag color="red">Large Language Models</Tag>
                <Tag color="volcano">Computer Vision</Tag>
                <Tag color="orange">Reinforcement Learning</Tag>
                <Tag color="gold">Neural Networks</Tag>
                <Tag color="lime">Deep Learning</Tag>
                <Tag color="green">Natural Language Processing</Tag>
                <Tag color="cyan">Robotics</Tag>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ArxivPage