import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Button, message, Typography, Space, Badge, 
  Statistic, List, Tag, Tabs, Input, Select, Progress, Alert
} from 'antd'
import { 
  RobotOutlined, SyncOutlined, DatabaseOutlined, 
  SearchOutlined, DownloadOutlined, HeartOutlined, ApiOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const { TabPane } = Tabs
const { Option } = Select

interface HuggingFaceModel {
  id: string
  name: string
  description: string
  author: string
  downloads: number
  likes: number
  tags: string[]
  pipeline_tag: string
  url: string
  created_at: string
  last_modified: string
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

  // Pipeline类型映射
  const pipelineNames: Record<string, string> = {
    'text-generation': 'テキスト生成',
    'text-classification': 'テキスト分類',
    'token-classification': 'トークン分類',
    'question-answering': '質問応答',
    'fill-mask': 'マスク予測',
    'summarization': '要約',
    'translation': '翻訳',
    'text2text-generation': 'テキスト変換',
    'conversational': '対話',
    'image-classification': '画像分類',
    'object-detection': '物体検出',
    'image-segmentation': '画像分割',
    'speech-recognition': '音声認識',
    'text-to-speech': '音声合成'
  }

  // 获取Hugging Face数据
  const fetchHuggingFaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?source=huggingface&limit=100')
      if (response.ok) {
        const data = await response.json()
        setModels(data)
        
        // 模拟统计数据
        const pipelineDistribution = data.reduce((acc: Record<string, number>, model: HuggingFaceModel) => {
          acc[model.pipeline_tag] = (acc[model.pipeline_tag] || 0) + 1
          return acc
        }, {})

        const allTags = data.flatMap((model: HuggingFaceModel) => model.tags)
        const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
          acc[tag] = (acc[tag] || 0) + 1
          return acc
        }, {})

        const mockStats: HuggingFaceStats = {
          total_models: data.length,
          total_datasets: Math.floor(data.length * 0.3), // 假设数据集是模型的30%
          today_new: data.filter((model: HuggingFaceModel) => 
            new Date(model.created_at).toDateString() === new Date().toDateString()
          ).length,
          pipeline_distribution: pipelineDistribution,
          top_tags: Object.entries(tagCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([tag]) => tag),
          last_update: new Date().toISOString()
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Failed to fetch Hugging Face data:', error)
      message.error('Hugging Face データの取得に失敗しました')
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
        message.success(`Hugging Face データ更新完了！${result.count || 0} 件の新しいモデルを取得しました`)
        await fetchHuggingFaceData()
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      message.error('Hugging Face データの更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 过滤模型
  const filteredModels = models.filter(model => {
    const matchesSearch = !searchQuery || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPipeline = pipelineFilter === 'all' || model.pipeline_tag === pipelineFilter
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'popular' && model.downloads > 1000) ||
      (activeTab === 'recent' && new Date(model.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (activeTab === 'text' && model.pipeline_tag.includes('text')) ||
      (activeTab === 'vision' && model.pipeline_tag.includes('image'))
    
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
              title="人気タスク"
              value={stats?.pipeline_distribution ? 
                pipelineNames[Object.keys(stats.pipeline_distribution)[0]] || 'テキスト生成' : 
                'テキスト生成'
              }
              prefix={<SearchOutlined style={{ color: '#722ed1' }} />}
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
              <Option value="text-generation">テキスト生成</Option>
              <Option value="text-classification">テキスト分類</Option>
              <Option value="question-answering">質問応答</Option>
              <Option value="translation">翻訳</Option>
              <Option value="image-classification">画像分類</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Tab导航 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane tab={`全て (${models.length})`} key="all" />
        <TabPane tab={`人気 (${models.filter(m => m.downloads > 1000).length})`} key="popular" />
        <TabPane tab="最近" key="recent" />
        <TabPane tab="テキスト関連" key="text" />
        <TabPane tab="ビジョン関連" key="vision" />
      </Tabs>

      {/* 主要内容 */}
      <Row gutter={16}>
        {/* 模型列表 */}
        <Col xs={24} lg={16}>
          <Card title={`🤖 ${t('huggingface.models')}`} style={{ minHeight: '600px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <span>データを読み込み中...</span>
              </div>
            ) : (
              <List
                dataSource={filteredModels}
                renderItem={(model) => (
                  <List.Item
                    actions={[
                      <Button 
                        key="view" 
                        type="link" 
                        href={model.url} 
                        target="_blank"
                        icon={<RobotOutlined />}
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
                            <Tag color="orange" size="small">
                              {pipelineNames[model.pipeline_tag] || model.pipeline_tag}
                            </Tag>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            {model.tags.slice(0, 5).map(tag => (
                              <Tag key={tag} size="small" style={{ fontSize: '10px' }}>
                                {tag}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            作成者: {model.author}
                          </Text>
                          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8, marginTop: 4 }}>
                            {model.description}
                          </Paragraph>
                          <Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <DownloadOutlined /> {formatNumber(model.downloads)} ダウンロード
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <HeartOutlined /> {model.likes} いいね
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              作成: {new Date(model.created_at).toLocaleDateString()}
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
                    `${range[0]}-${range[1]} / ${total} モデル`
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
              message="大規模言語モデルが人気"
              description="最近では、GPT系列やLLaMAベースのモデルが注目を集めています。マルチモーダルモデルも増加傾向。"
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div>
              <Title level={5}>人気のタグ</Title>
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
    </div>
  )
}

export default HuggingFacePage