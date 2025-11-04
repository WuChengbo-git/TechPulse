import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, message, Typography, Space,
  Statistic, List, Tag, Tabs, Input, Select, Progress, Alert, Modal, Divider
} from 'antd'
import {
  FileTextOutlined, SyncOutlined, BookOutlined,
  SearchOutlined, CalendarOutlined, LinkOutlined, EyeOutlined,
  MessageOutlined, SendOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import QualityBadge from '../components/QualityBadge'
import CardSkeleton from '../components/CardSkeleton'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface ArxivPaper {
  id: number
  title: string
  source: string
  original_url: string
  summary?: string
  chinese_tags?: string[]
  ai_category?: string[]
  created_at: string
  quality_score?: number  // 质量评分
  // arXiv特有字段
  authors?: string[]
  abstract?: string
  categories?: string[]
  published_date?: string
  updated_date?: string
  pdf_url?: string
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
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<ArxivPaper | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{user: string, ai: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // arXiv分类映射
  const categoryNames: Record<string, string> = {
    'cs.AI': t('arxiv.catAI'),
    'cs.CL': t('arxiv.catNLP'),
    'cs.CV': t('arxiv.catCV'),
    'cs.LG': t('arxiv.catML'),
    'cs.RO': t('arxiv.catRobotics'),
    'cs.SE': t('arxiv.catSE'),
    'stat.ML': t('arxiv.catStatML'),
    'math.OC': t('arxiv.catOptimization')
  }

  // 获取arXiv数据
  const fetchArxivData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=arxiv&limit=100')
      if (response.ok) {
        const data = await response.json()
        // 确保数据是数组格式
        const papersArray = Array.isArray(data) ? data : []
        console.log('ArXiv data sample:', papersArray[0]) // 调试信息
        
        // 处理数据，适配 TechCard 结构
        const processedPapers = papersArray.map((paper: any) => {
          // 使用 TechCard 的 original_url 字段
          const originalUrl = paper.original_url || ''
          
          // 生成 PDF URL（arXiv 特有）
          let pdfUrl = paper.pdf_url || ''
          if (!pdfUrl && originalUrl && originalUrl.includes('arxiv.org/abs/')) {
            pdfUrl = originalUrl.replace('/abs/', '/pdf/') + '.pdf'
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
          }
        })
        setPapers(processedPapers)
        
        // 模拟统计数据
        const categories = processedPapers.reduce((acc: Record<string, number>, paper: any) => {
          // 确保categories存在且是数组
          const paperCategories = paper.categories || []
          if (Array.isArray(paperCategories)) {
            paperCategories.forEach(cat => {
              acc[cat] = (acc[cat] || 0) + 1
            })
          }
          return acc
        }, {})

        const mockStats: ArxivStats = {
          total_papers: processedPapers.length,
          today_new: processedPapers.filter((paper: any) => {
            if (!paper.created_at) return false
            try {
              return new Date(paper.created_at).toDateString() === new Date().toDateString()
            } catch {
              return false
            }
          }).length,
          categories,
          top_authors: ['Geoffrey Hinton', 'Yann LeCun', 'Yoshua Bengio', 'Andrew Ng'],
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      } else {
        throw new Error('Failed to fetch data')
      }
    } catch (error) {
      console.error('Failed to fetch arXiv data:', error)
      message.error(t('arxiv.fetchDataFailed'))
      // 设置空数据以防止页面崩溃
      setPapers([])
      setStats({
        total_papers: 0,
        today_new: 0,
        categories: {},
        top_authors: [],
        last_update: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  // 打开详细信息Modal
  const openDetailModal = (paper: ArxivPaper) => {
    setSelectedPaper(paper)
    setDetailModalVisible(true)
    setChatHistory([])
    setChatMessage('')
  }

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedPaper) return
    
    setChatLoading(true)
    try {
      const userMessage = chatMessage.trim()
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
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, {
          user: userMessage,
          ai: data.response || t('arxiv.cannotAnswer')
        }])
        setChatMessage('')
      } else {
        message.error(t('arxiv.sendMessageFailed'))
      }
    } catch (error) {
      console.error('Chat error:', error)
      message.error(t('arxiv.sendMessageFailed'))
    } finally {
      setChatLoading(false)
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
    if (!paper) return false
    
    const matchesSearch = !searchQuery || 
      (paper.title && paper.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (paper.abstract && paper.abstract.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (paper.summary && paper.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const paperCategories = paper.categories || []
    const matchesCategory = categoryFilter === 'all' || 
      (Array.isArray(paperCategories) && paperCategories.includes(categoryFilter))
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'recent' && paper.created_at && 
        new Date(paper.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === 'ai' && (
        (Array.isArray(paperCategories) && 
          paperCategories.some(cat => cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能')))) ||
        (paper.summary && paper.summary.toLowerCase().includes('ai')) ||
        (paper.title && paper.title.toLowerCase().includes('ai'))
      )) ||
      (activeTab === 'cv' && (
        (Array.isArray(paperCategories) && 
          paperCategories.some(cat => cat && (cat.includes('计算机视觉') || cat.includes('computer vision') || cat.includes('cv')))) ||
        (paper.summary && (paper.summary.toLowerCase().includes('vision') || paper.summary.toLowerCase().includes('视觉')))
      ))
    
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
              value={papers.filter(p => {
                const categories = p.categories || []
                return Array.isArray(categories) && categories.some(cat => 
                  cat && (cat.includes('AI') || cat.includes('机器学习') || cat.includes('人工智能'))
                ) || (p.summary && p.summary.toLowerCase().includes('ai'))
              }).length}
              prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('arxiv.mainCategory')}
              value={stats?.categories ?
                (categoryNames[Object.keys(stats.categories)[0]] || Object.keys(stats.categories)[0] || t('arxiv.defaultCategory')) :
                t('arxiv.defaultCategory')
              }
              prefix={<CalendarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: '20px' }}
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
        <TabPane tab={`${t('arxiv.all')} (${papers.length})`} key="all" />
        <TabPane tab={`${t('arxiv.recent')} (${papers.filter(p => {
          if (!p.created_at) return false
          try {
            return new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          } catch {
            return false
          }
        }).length})`} key="recent" />
        <TabPane tab={t('arxiv.aiRelated')} key="ai" />
        <TabPane tab={t('arxiv.computerVision')} key="cv" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 论文列表 */}
        <Col xs={24} lg={16}>
          <Card title={`📚 ${t('arxiv.papers')}`} style={{ minHeight: '600px' }}>
            {loading && papers.length === 0 ? (
              <CardSkeleton count={5} grid={false} />
            ) : filteredPapers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>暂无arXiv论文数据</span>
              </div>
            ) : (
              <List
                dataSource={filteredPapers}
                renderItem={(paper) => (
                  <List.Item
                    actions={[
                      <Button
                        key="detail"
                        type="primary"
                        style={{ fontSize: "12px" }}
                        icon={<EyeOutlined />}
                        onClick={() => openDetailModal(paper)}
                      >
                        {t('arxiv.viewDetails')}
                      </Button>,
                      <Button 
                        key="abstract" 
                        type="link" 
                        icon={<LinkOutlined />}
                        disabled={!paper.original_url}
                        onClick={() => {
                          if (paper.original_url) {
                            window.open(paper.original_url, '_blank')
                          } else {
                            message.warning(t('arxiv.abstractLinkUnavailable'))
                          }
                        }}
                      >
                        {t('arxiv.abstract')}
                      </Button>,
                      <Button 
                        key="pdf" 
                        type="link" 
                        style={{ color: '#b31b1b' }}
                        disabled={!paper.pdf_url}
                        onClick={() => {
                          if (paper.pdf_url) {
                            window.open(paper.pdf_url, '_blank')
                          } else {
                            message.warning(t('arxiv.pdfLinkUnavailable'))
                          }
                        }}
                      >
                        {t('arxiv.pdf')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <Text strong>
                              {paper.title || t('arxiv.noTitle')}
                            </Text>
                            {paper.quality_score !== undefined && (
                              <QualityBadge score={paper.quality_score} style={{ fontSize: "12px" }} />
                            )}
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {(paper.categories || []).map((cat, index) => (
                              <Tag key={index} color="red" style={{ fontSize: "12px" }}>
                                {categoryNames[cat] || cat}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 8 }}>
                            {paper.abstract || paper.summary || t('arxiv.noAbstract')}
                          </Paragraph>
                          <Space>
                            <Text type="secondary">
                              <CalendarOutlined /> {t('arxiv.published')}: {paper.created_at ? new Date(paper.created_at).toLocaleDateString() : t('arxiv.unknown')}
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
                    `${range[0]}-${range[1]} / ${total} 篇论文`
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
                      style={{ fontSize: "12px" }} 
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

      {/* 详细信息Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#b31b1b' }} />
            论文详细信息
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedPaper && (
          <div>
            {/* 论文基本信息 */}
            <Card style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {selectedPaper.title}
              </Title>
              
              <div style={{ marginBottom: 12 }}>
                {(selectedPaper.categories || []).map((cat, index) => (
                  <Tag key={index} color="red">
                    {categoryNames[cat] || cat}
                  </Tag>
                ))}
              </div>

              {selectedPaper.authors && (
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{t('arxiv.author')}</Text>
                  <Text>{selectedPaper.authors.join(', ')}</Text>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <Text strong>{t('arxiv.publishTime')}</Text>
                <Text>{selectedPaper.created_at ? new Date(selectedPaper.created_at).toLocaleDateString() : t('arxiv.unknown')}</Text>
              </div>

              <Divider />

              <div>
                <Title level={5}>{t('arxiv.fullAbstract')}</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                  {selectedPaper.abstract || selectedPaper.summary || t('arxiv.noAbstract')}
                </Paragraph>
              </div>

              <Divider />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    if (selectedPaper.original_url) {
                      window.open(selectedPaper.original_url, '_blank')
                    }
                  }}
                  disabled={!selectedPaper.original_url}
                >
                  查看原文
                </Button>
                <Button
                  type="default"
                  style={{ color: '#b31b1b' }}
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    if (selectedPaper.pdf_url) {
                      window.open(selectedPaper.pdf_url, '_blank')
                    }
                  }}
                  disabled={!selectedPaper.pdf_url}
                >
                  下载PDF
                </Button>
              </div>
            </Card>

            {/* AI聊天功能 */}
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                关于这篇论文的问答
              </div>
            }>
              {/* 聊天历史 */}
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    您可以问我关于这篇论文的任何问题
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
                  placeholder={t('arxiv.askQuestionPlaceholder')}
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

export default ArxivPage