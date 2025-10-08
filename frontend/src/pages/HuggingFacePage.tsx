import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Button, message, Typography, Space, Badge, 
  Statistic, List, Tag, Tabs, Input, Select, Progress, Alert, Modal, Divider
} from 'antd'
import { 
  RobotOutlined, SyncOutlined, DatabaseOutlined, 
  SearchOutlined, DownloadOutlined, HeartOutlined, ApiOutlined,
  EyeOutlined, MessageOutlined, SendOutlined, LinkOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface HuggingFaceModel {
  id: number
  title: string
  source: string
  original_url: string
  summary?: string
  chinese_tags?: string[]
  created_at: string
  // HuggingFace特有字段
  name?: string
  description?: string
  author?: string
  downloads?: number
  likes?: number
  tags?: string[]
  pipeline_tag?: string
  url?: string  // 兼容字段
  last_modified?: string
  model_size?: string
  language?: string[]
}

interface HuggingFaceStats {
  total_models: number
  total_datasets: number
  today_new: number
  pipeline_distribution: Record<string, number>
  top_tags: string[]
  last_update: string
}

const HuggingFacePage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<HuggingFaceModel[]>([])
  const [stats, setStats] = useState<HuggingFaceStats | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [pipelineFilter, setPipelineFilter] = useState('all')
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{user: string, ai: string}>>([])
  const [chatLoading, setChatLoading] = useState(false)

  // Pipeline类型映射
  const pipelineNames: Record<string, string> = {
    'text-generation': '文本生成',
    'text-classification': '文本分类',
    'token-classification': '标记分类',
    'question-answering': '问答系统',
    'fill-mask': '填充遮罩',
    'summarization': '文本摘要',
    'translation': '机器翻译',
    'text2text-generation': '文本到文本生成',
    'conversational': '对话系统',
    'image-classification': '图像分类',
    'object-detection': '目标检测',
    'image-segmentation': '图像分割',
    'speech-recognition': '语音识别',
    'text-to-speech': '文本转语音'
  }

  // 打开详细信息Modal
  const openDetailModal = (model: HuggingFaceModel) => {
    setSelectedModel(model)
    setDetailModalVisible(true)
    setChatHistory([])
    setChatMessage('')
  }

  // 发送聊天消息
  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedModel) return
    
    setChatLoading(true)
    try {
      const userMessage = chatMessage.trim()
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

  // 获取Hugging Face数据
  const fetchHuggingFaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=huggingface&limit=100')
      if (response.ok) {
        const data = await response.json()
        console.log('HuggingFace data sample:', data[0]) // 调试信息
        // 处理数据，适配 TechCard 结构
        const processedModels = data.map((model: any) => ({
          ...model,
          name: model.title || model.name || '',
          description: model.summary || model.description || '',
          url: model.original_url || model.url || '',
          tags: model.chinese_tags || model.tags || [],
          pipeline_tag: model.pipeline_tag || 'unknown'
        }))
        setModels(processedModels)
        
        // 模拟统计数据
        const pipelineDistribution = processedModels.reduce((acc: Record<string, number>, model: any) => {
          const pipeline = model.pipeline_tag || 'unknown'
          acc[pipeline] = (acc[pipeline] || 0) + 1
          return acc
        }, {})

        const allTags = processedModels.flatMap((model: any) => model.tags || [])
        const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
          if (tag) acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})

        const mockStats: HuggingFaceStats = {
          total_models: processedModels.length,
          total_datasets: Math.floor(processedModels.length * 0.3),
          today_new: processedModels.filter((model: any) => {
            if (!model.created_at) return false
            try {
              return new Date(model.created_at).toDateString() === new Date().toDateString()
            } catch {
              return false
            }
          }).length,
          pipeline_distribution: pipelineDistribution,
          top_tags: Object.entries(tagCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 10)
            .map(([tag]) => tag),
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch Hugging Face data:', error)
      message.error('Failed to fetch Hugging Face data')
    } finally {
      setLoading(false)
    }
  }

  // 更新Hugging Face数据
  const updateHuggingFaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/sources/collect/huggingface', { method: 'POST' })
      
      if (response.ok) {
        const result = await response.json()
        message.success(`Hugging Face data updated successfully! ${result.count || 0} new models retrieved`)
        await fetchHuggingFaceData()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      message.error('Failed to update Hugging Face data')
    } finally {
      setLoading(false)
    }
  }

  // 过滤模型
  const filteredModels = models.filter(model => {
    const matchesSearch = !searchQuery || 
      (model.name && model.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (model.author && model.author.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesPipeline = pipelineFilter === 'all' || model.pipeline_tag === pipelineFilter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'popular' && (model.downloads || 0) > 1000) ||
      (activeTab === 'recent' && new Date(model.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === 'text' && model.pipeline_tag && model.pipeline_tag.includes('text')) ||
      (activeTab === 'vision' && model.pipeline_tag && model.pipeline_tag.includes('image'))
    
    return matchesSearch && matchesPipeline && matchesTab
  })

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  useEffect(() => {
    fetchHuggingFaceData()
  }, [])

  return (
    <div>
      {/* 头部区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RobotOutlined style={{ color: '#ff6f00' }} />
              {t('huggingface.title')}
            </Title>
            <Text type="secondary">{t('huggingface.subtitle')}</Text>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={updateHuggingFaceData}
              loading={loading}
            >
              {t('huggingface.updateData')}
            </Button>
          </Space>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('huggingface.totalModels')}
              value={stats?.total_models || 0}
              prefix={<ApiOutlined style={{ color: '#ff6f00' }} />}
              valueStyle={{ color: '#ff6f00' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('huggingface.totalDatasets')}
              value={stats?.total_datasets || 0}
              prefix={<DatabaseOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('huggingface.todayNew')}
              value={stats?.today_new || 0}
              prefix={<RobotOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('huggingface.popularTask')}
              value={stats?.pipeline_distribution ?
                pipelineNames[Object.keys(stats.pipeline_distribution)[0]] || 'Text Generation' :
                'Text Generation'
              }
              prefix={<SearchOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder={t('huggingface.searchPlaceholder')}
              allowClear
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col>
            <Select
              value={pipelineFilter}
              onChange={setPipelineFilter}
              style={{ width: 150 }}
              placeholder={t('huggingface.taskFilter')}
            >
              <Option value="all">{t('huggingface.allTasks')}</Option>
              <Option value="text-generation">文本生成</Option>
              <Option value="text-classification">文本分类</Option>
              <Option value="question-answering">问答系统</Option>
              <Option value="translation">机器翻译</Option>
              <Option value="image-classification">图像分类</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tab导航 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={`${t('huggingface.all')} (${models.length})`} key="all" />
        <TabPane tab={`${t('huggingface.popular')} (${models.filter(m => (m.downloads || 0) > 1000).length})`} key="popular" />
        <TabPane tab={t('huggingface.recent')} key="recent" />
        <TabPane tab={t('huggingface.textRelated')} key="text" />
        <TabPane tab={t('huggingface.visionRelated')} key="vision" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 模型列表 */}
        <Col xs={24} lg={16}>
          <Card title={`🤖 ${t('huggingface.models')}`} style={{ minHeight: '600px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>Loading data...</span>
              </div>
            ) : (
              <List
                dataSource={filteredModels}
                renderItem={(model) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="detail" 
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => openDetailModal(model)}
                      >
                        详细查看
                      </Button>,
                      <Button 
                        key="view" 
                        type="link" 
                        href={model.url} 
                        target="_blank"
                        icon={<LinkOutlined />}
                      >
                        {t('common.view')}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text strong>{model.name}</Text>
                            <Tag color="orange">
                              {pipelineNames[model.pipeline_tag || ''] || model.pipeline_tag || 'unknown'}
                            </Tag>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {(model.tags || []).slice(0, 5).map(tag => (
                              <Tag key={tag} style={{ fontSize: '10px' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {t('huggingface.author')}: {model.author}
                          </Text>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8, marginTop: 4 }}>
                            {model.description}
                          </Paragraph>
                          <Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <DownloadOutlined /> {formatNumber(model.downloads || 0)} {t('huggingface.downloads')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <HeartOutlined /> {model.likes} {t('huggingface.likes')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {t('huggingface.created')}: {new Date(model.created_at).toLocaleDateString()}
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
                    `${range[0]}-${range[1]} / ${total} models`
                }}
              />
            )}
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 任务分布 */}
          <Card title={`📊 ${t('huggingface.taskDistribution')}`} style={{ marginBottom: 16 }}>
            <div>
              {stats?.pipeline_distribution && Object.entries(stats.pipeline_distribution)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 8)
                .map(([pipeline, count]) => (
                <div key={pipeline} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <Text style={{ fontSize: '12px' }}>
                    {pipelineNames[pipeline] || pipeline}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Progress 
                      percent={Math.round((count / (stats?.total_models || 1)) * 100)} 
                      size="small" 
                      style={{ width: '60px' }}
                      showInfo={false}
                      strokeColor="#ff6f00"
                    />
                    <Text style={{ fontSize: '12px', minWidth: '20px' }}>{count}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 人气趋势 */}
          <Card title={`🔥 ${t('huggingface.trends')}`}>
            <Alert
              message="Large Language Models are Popular"
              description="Recently, GPT series and LLaMA-based models have been attracting attention. Multimodal models are also on the rise."
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div>
              <Title level={5}>Popular Tags</Title>
              <Space wrap>
                {stats?.top_tags.slice(0, 12).map((tag, index) => (
                  <Tag 
                    key={tag} 
                    color={['magenta', 'red', 'volcano', 'orange', 'gold', 'lime', 'green', 'cyan', 'blue', 'geekblue', 'purple'][index % 11]}
                  >
                    {tag}
                  </Tag>
                ))}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详细信息Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <RobotOutlined style={{ color: '#ff6f00' }} />
            模型详细信息
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={900}
        footer={null}
        style={{ top: 20 }}
      >
        {selectedModel && (
          <div>
            {/* 模型基本信息 */}
            <Card style={{ marginBottom: 16 }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                {selectedModel.name}
              </Title>
              
              <div style={{ marginBottom: 12 }}>
                <Tag color="orange">
                  {pipelineNames[selectedModel.pipeline_tag || ''] || selectedModel.pipeline_tag || 'unknown'}
                </Tag>
                {(selectedModel.tags || []).slice(0, 5).map(tag => (
                  <Tag key={tag} style={{ fontSize: '10px' }}>
                    {tag}
                  </Tag>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>作者: </Text>
                <Text>{selectedModel.author}</Text>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text strong>下载量: </Text>
                <Text>{formatNumber(selectedModel.downloads || 0)}</Text>
              </div>

              <Divider />

              <div>
                <Title level={5}>完整描述</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                  {selectedModel.description || '暂无描述'}
                </Paragraph>
              </div>

              <Divider />

              <div style={{ display: 'flex', gap: 12 }}>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  onClick={() => {
                    if (selectedModel.original_url) {
                      window.open(selectedModel.original_url, '_blank')
                    }
                  }}
                  disabled={!selectedModel.original_url}
                >
                  查看模型
                </Button>
              </div>
            </Card>

            {/* AI聊天功能 */}
            <Card title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageOutlined style={{ color: '#1890ff' }} />
                关于这个模型的问答
              </div>
            }>
              {/* 聊天历史 */}
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
                {chatHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    您可以问我关于这个HuggingFace模型的任何问题
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
                  placeholder="问一下关于这个模型的问题..."
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

export default HuggingFacePage