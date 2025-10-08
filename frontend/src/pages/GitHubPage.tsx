import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Button, Progress, message, Typography, Space, Badge,
  Statistic, Timeline, Alert, Modal, List, Tag, Tabs, Input, Select, Divider
} from 'antd'
import {
  GithubOutlined, SyncOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, EyeOutlined, StarOutlined, ForkOutlined,
  SearchOutlined, FilterOutlined, TrophyOutlined, MessageOutlined, SendOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import QualityBadge from '../components/QualityBadge'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface GitHubRepo {
  id: number
  title: string
  description?: string
  summary?: string
  original_url: string
  url?: string  // 兼容字段
  stars?: number
  forks?: number
  language?: string
  trending_score?: number
  quality_score?: number  // 质量评分
  created_at: string
  source: string
}

interface GitHubStats {
  total_repos: number
  today_new: number
  trending_repos: number
  top_languages: string[]
  last_update: string
}

const GitHubPage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [stats, setStats] = useState<GitHubStats | null>(null)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [updateHistory, setUpdateHistory] = useState<any[]>([])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{user: string, ai: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // 打开详细信息Modal
  const openDetailModal = (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setDetailModalVisible(true)
    setChatHistory([])
    setChatMessage('')
  }

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedRepo) return
    
    setChatLoading(true)
    try {
      const userMessage = chatMessage.trim()
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `关于这个GitHub仓库 "${selectedRepo.title}"，${userMessage}`,
          context: {
            title: selectedRepo.title,
            description: selectedRepo.description || selectedRepo.summary,
            language: selectedRepo.language,
            stars: selectedRepo.stars,
            forks: selectedRepo.forks,
            url: selectedRepo.original_url
          }
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, {
          user: userMessage,
          ai: data.response || '抱歉，我无法回答这个问题。'
        }])
        setChatMessage('')
      } else {
        message.error('发送消息失败')
      }
    } catch (error) {
      console.error('Chat error:', error)
      message.error('发送消息失败')
    } finally {
      setChatLoading(false)
    }
  }

  // 获取GitHub数据
  const fetchGitHubData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=github&limit=100')
      if (response.ok) {
        const data = await response.json()
        console.log('GitHub data sample:', data[0]) // 调试信息
        // 处理数据，适配 TechCard 结构
        const processedRepos = data.map((repo: any) => ({
          ...repo,
          url: repo.original_url || repo.url, // 使用 original_url 作为主要URL
          description: repo.summary || repo.description || ''
        }))
        setRepos(processedRepos)
        
        // 模拟统计数据
        const mockStats: GitHubStats = {
          total_repos: processedRepos.length,
          today_new: processedRepos.filter((repo: any) => 
            new Date(repo.created_at).toDateString() === new Date().toDateString()
          ).length,
          trending_repos: processedRepos.filter((repo: any) => (repo.stars || 0) > 1000).length,
          top_languages: ['Python', 'JavaScript', 'TypeScript', 'Go', 'Rust'],
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub data:', error)
      message.error('Failed to fetch GitHub data')
    } finally {
      setLoading(false)
    }
  }

  // 更新GitHub数据
  const updateGitHubData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/sources/collect/github', { method: 'POST' })
      
      if (response.ok) {
        const result = await response.json()
        message.success(`GitHub data update completed! Retrieved ${result.count || 0} new repositories`)
        
        // 添加更新历史
        setUpdateHistory(prev => [{
          time: new Date().toLocaleString(),
          count: result.count || 0,
          status: 'success'
        }, ...prev.slice(0, 9)])
        
        await fetchGitHubData()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      message.error('Failed to update GitHub data')
      setUpdateHistory(prev => [{
        time: new Date().toLocaleString(),
        count: 0,
        status: 'error'
      }, ...prev.slice(0, 9)])
    } finally {
      setLoading(false)
    }
  }

  // 预览trending数据
  const previewTrending = async () => {
    try {
      const response = await fetch('/api/v1/sources/github/daily-trending')
      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        setPreviewModalVisible(true)
      } else {
        message.error('Preview failed')
      }
    } catch (err) {
      message.error('Preview failed: ' + err)
    }
  }

  // 过滤仓库
  const filteredRepos = repos.filter(repo => {
    const matchesSearch = !searchQuery || 
      repo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesLanguage = languageFilter === 'all' || repo.language === languageFilter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'trending' && (repo.stars || 0) > 100) ||
      (activeTab === 'popular' && (repo.stars || 0) > 1000) ||
      (activeTab === 'recent' && new Date(repo.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    
    return matchesSearch && matchesLanguage && matchesTab
  })

  useEffect(() => {
    fetchGitHubData()
  }, [])

  return (
    <div>
      {/* 头部区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <GithubOutlined style={{ color: '#24292e' }} />
              {t('github.title')}
            </Title>
            <Text type="secondary">{t('github.subtitle')}</Text>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={updateGitHubData}
              loading={loading}
            >
              {t('github.updateData')}
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={previewTrending}
            >
              {t('github.trendingPreview')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('github.totalRepos')}
              value={stats?.total_repos || 0}
              prefix={<GithubOutlined style={{ color: '#24292e' }} />}
              valueStyle={{ color: '#24292e' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('github.todayNew')}
              value={stats?.today_new || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('github.trendingRepos')}
              value={stats?.trending_repos || 0}
              prefix={<TrophyOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('github.topLanguage')}
              value={stats?.top_languages?.[0] || 'Python'}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder={t('github.searchPlaceholder')}
              allowClear
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              value={languageFilter}
              onChange={setLanguageFilter}
              style={{ width: 120 }}
              placeholder={t('github.languageFilter')}
            >
              <Option value="all">{t('github.allLanguages')}</Option>
              <Option value="Python">Python</Option>
              <Option value="JavaScript">JavaScript</Option>
              <Option value="TypeScript">TypeScript</Option>
              <Option value="Go">Go</Option>
              <Option value="Rust">Rust</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tab导航 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={`${t('github.all')} (${repos.length})`} key="all" />
        <TabPane tab={`${t('github.trending')} (${repos.filter(r => (r.stars || 0) > 100).length})`} key="trending" />
        <TabPane tab={`${t('github.popular')} (${repos.filter(r => (r.stars || 0) > 1000).length})`} key="popular" />
        <TabPane tab={t('github.recent')} key="recent" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 仓库列表 */}
        <Col xs={24} lg={16}>
          <Card title={`📦 ${t('github.repositories')}`} style={{ minHeight: '600px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              <List
                dataSource={filteredRepos}
                renderItem={(repo) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="detail" 
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetailModal(repo)}
                      >
                        详细查看
                      </Button>,
                      <Button 
                        key="view" 
                        type="link" 
                        icon={<LinkOutlined />}
                        onClick={() => {
                          if (repo.url) {
                            window.open(repo.url, '_blank')
                          } else {
                            message.warning('仓库链接不可用')
                          }
                        }}
                      >
                        {t('common.view')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text strong>{repo.title}</Text>
                          {repo.quality_score !== undefined && (
                            <QualityBadge score={repo.quality_score} size="small" />
                          )}
                          {repo.language && (
                            <Tag color="blue" size="small">{repo.language}</Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                            {repo.description}
                          </Paragraph>
                          <Space>
                            <Text type="secondary">
                              <StarOutlined /> {repo.stars}
                            </Text>
                            <Text type="secondary">
                              <ForkOutlined /> {repo.forks}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {new Date(repo.created_at).toLocaleDateString()}
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
                    `${range[0]}-${range[1]} / ${total} repositories`
                }}
              />
            )}
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 更新历史 */}
          <Card title={`⏱️ ${t('github.updateHistory')}`} style={{ marginBottom: 16, height: '300px', overflow: 'auto' }}>
            {updateHistory.length > 0 ? (
              <Timeline>
                {updateHistory.map((item, index) => (
                  <Timeline.Item
                    key={index}
                    dot={item.status === 'success' ? 
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    }
                  >
                    <div>
                      <Text strong>GitHub</Text>
                      {item.status === 'success' && (
                        <Text type="success"> (+{item.count})</Text>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {item.time}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {t('github.noUpdateRecords')}
              </div>
            )}
          </Card>

          {/* 人気言语统计 */}
          <Card title={`📊 ${t('github.languageStats')}`}>
            <div>
              {stats?.top_languages?.map((lang, index) => (
                <div key={lang} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < (stats.top_languages?.length || 0) - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  <Text>{lang}</Text>
                  <Progress 
                    percent={Math.max(10, 100 - index * 20)} 
                    size="small" 
                    style={{ width: '100px' }}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* GitHub Trending 预览模态框 */}
      <Modal
        title={t('dataSources.previewTitle')}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            {t('dataSources.close')}
          </Button>,
          <Button 
            key="update" 
            type="primary"
            onClick={() => {
              setPreviewModalVisible(false)
              updateGitHubData()
            }}
          >
            {t('dataSources.saveData')}
          </Button>
        ]}
      >
        {previewData && (
          <div>
            <Alert
              message={`Found ${previewData.total_count || 0} trending projects`}
              description="Below is a preview of today's latest trending projects"
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            {previewData.python_trending && previewData.python_trending.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={4}>Python Projects</Title>
                {previewData.python_trending.slice(0, 5).map((repo: any, index: number) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{repo.title}</Text>
                      <Space>
                        <Text>⭐ {repo.stars}</Text>
                        <Text type="secondary">Score: {repo.trending_score?.toFixed(1)}</Text>
                      </Space>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {repo.description}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 详细信息Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GithubOutlined style={{ color: '#24292e' }} />
            仓库详细信息
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedRepo && (
          <div>
            {/* 仓库基本信息 */}
            <Card style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {selectedRepo.title}
              </Title>
              
              <div style={{ marginBottom: 12 }}>
                {selectedRepo.language && (
                  <Tag color="blue">{selectedRepo.language}</Tag>
                )}
                <Tag color="gold">
                  <StarOutlined /> {selectedRepo.stars} stars
                </Tag>
                <Tag color="green">
                  <ForkOutlined /> {selectedRepo.forks} forks
                </Tag>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>创建时间: </Text>
                <Text>{selectedRepo.created_at ? new Date(selectedRepo.created_at).toLocaleDateString() : '未知'}</Text>
              </div>

              <Divider />

              <div>
                <Title level={5}>完整描述</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                  {selectedRepo.description || selectedRepo.summary || '暂无描述'}
                </Paragraph>
              </div>

              <Divider />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    if (selectedRepo.original_url) {
                      window.open(selectedRepo.original_url, '_blank')
                    }
                  }}
                  disabled={!selectedRepo.original_url}
                >
                  查看仓库
                </Button>
              </div>
            </Card>

            {/* AI聊天功能 */}
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                关于这个仓库的问答
              </div>
            }>
              {/* 聊天历史 */}
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    您可以问我关于这个GitHub仓库的任何问题
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
                  placeholder="问一下关于这个仓库的问题..."
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

export default GitHubPage