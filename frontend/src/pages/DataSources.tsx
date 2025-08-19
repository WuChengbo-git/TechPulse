import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Progress, message, Typography, Space, Badge, Statistic, Timeline, Alert, Modal } from 'antd'
import { GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, SyncOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, EyeOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface DataSource {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  description: string
  lastUpdate?: string
  status: 'idle' | 'loading' | 'success' | 'error'
  count?: number
  todayCount?: number
  progress?: number
}

interface PreviewData {
  message: string
  python_trending?: any[]
  general_trending?: any[]
  total_count: number
}

const DataSources: React.FC = () => {
  const [sources, setSources] = useState<DataSource[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: <GithubOutlined />,
      color: '#24292e',
      description: '获取最新的开源项目和trending仓库',
      status: 'idle'
    },
    {
      id: 'arxiv',
      name: 'arXiv',
      icon: <FileTextOutlined />,
      color: '#b31b1b', 
      description: '获取最新的学术论文和研究成果',
      status: 'idle'
    },
    {
      id: 'huggingface',
      name: 'Hugging Face',
      icon: <RobotOutlined />,
      color: '#ff6f00',
      description: '获取最新的AI模型和数据集',
      status: 'idle'
    },
    {
      id: 'zenn',
      name: 'Zenn',
      icon: <EditOutlined />,
      color: '#3ea8ff',
      description: '获取日本技术社区的优质文章',
      status: 'idle'
    }
  ])

  const [updateHistory, setUpdateHistory] = useState<any[]>([])
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)

  // 获取数据统计
  const fetchDataStats = async () => {
    try {
      const response = await fetch('/api/v1/cards/stats')
      if (response.ok) {
        const stats = await response.json()
        setSources(prev => prev.map(source => ({
          ...source,
          count: stats[source.id]?.total || 0,
          todayCount: stats[source.id]?.today || 0,
          lastUpdate: stats[source.id]?.last_update
        })))
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  // 更新单个数据源
  const updateSingleSource = async (sourceId: string) => {
    setSources(prev => prev.map(s => 
      s.id === sourceId ? { ...s, status: 'loading', progress: 0 } : s
    ))

    try {
      let endpoint = ''
      switch (sourceId) {
        case 'github':
          endpoint = '/api/v1/sources/collect/github'
          break
        case 'arxiv':
          endpoint = '/api/v1/sources/collect/arxiv'  
          break
        case 'huggingface':
          endpoint = '/api/v1/sources/collect/huggingface'
          break
        case 'zenn':
          endpoint = '/api/v1/sources/collect/zenn'
          break
        default:
          throw new Error('Unknown source')
      }

      const response = await fetch(endpoint, { method: 'POST' })
      
      if (response.ok) {
        const result = await response.json()
        
        setSources(prev => prev.map(s => 
          s.id === sourceId ? { 
            ...s, 
            status: 'success',
            progress: 100,
            todayCount: result.count || 0
          } : s
        ))
        
        message.success(`${sources.find(s => s.id === sourceId)?.name} 数据更新完成！获取了 ${result.count || 0} 条新数据`)
        
        // 添加更新历史
        setUpdateHistory(prev => [{
          source: sources.find(s => s.id === sourceId)?.name,
          time: new Date().toLocaleString(),
          count: result.count || 0,
          status: 'success'
        }, ...prev.slice(0, 9)])
        
        await fetchDataStats()
      } else {
        throw new Error('Update failed')
      }
    } catch (err) {
      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, status: 'error', progress: 0 } : s
      ))
      message.error(`${sources.find(s => s.id === sourceId)?.name} 更新失败: ${err}`)
      
      setUpdateHistory(prev => [{
        source: sources.find(s => s.id === sourceId)?.name,
        time: new Date().toLocaleString(),
        count: 0,
        status: 'error'
      }, ...prev.slice(0, 9)])
    }
  }

  // 预览GitHub trending
  const previewGitHubTrending = async () => {
    try {
      const response = await fetch('/api/v1/sources/github/daily-trending')
      if (response.ok) {
        const data = await response.json()
        setPreviewData(data)
        setPreviewModalVisible(true)
      } else {
        message.error('预览失败')
      }
    } catch (err) {
      message.error('预览失败: ' + err)
    }
  }

  // 全部更新
  const updateAllSources = async () => {
    for (const source of sources) {
      await updateSingleSource(source.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  useEffect(() => {
    fetchDataStats()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'loading':
        return <Badge status="processing" text="更新中" />
      case 'success':
        return <Badge status="success" text="已更新" />
      case 'error':
        return <Badge status="error" text="更新失败" />
      default:
        return <Badge status="default" text="待更新" />
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>📊 数据源管理</Title>
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={updateAllSources}
              loading={sources.some(s => s.status === 'loading')}
            >
              全部更新
            </Button>
            <Button 
              icon={<EyeOutlined />}
              onClick={previewGitHubTrending}
            >
              预览GitHub Trending
            </Button>
          </Space>
        </div>
      </div>

      <Alert
        message="按需更新说明"
        description="现在可以单独更新每个数据源，避免不必要的资源浪费。建议根据需求选择性更新特定数据源。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 数据源卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {sources.map((source) => (
          <Col xs={24} sm={12} lg={6} key={source.id}>
            <Card
              hoverable
              style={{ height: '100%' }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: source.color }}>{source.icon}</span>
                  <span>{source.name}</span>
                </div>
              }
              extra={getStatusBadge(source.status)}
              actions={[
                <Button
                  key="update"
                  type="primary"
                  size="small"
                  icon={<SyncOutlined />}
                  onClick={() => updateSingleSource(source.id)}
                  loading={source.status === 'loading'}
                  disabled={source.status === 'loading'}
                >
                  {source.status === 'loading' ? '更新中' : '更新'}
                </Button>
              ]}
            >
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {source.description}
                </Text>
              </div>

              {source.status === 'loading' && typeof source.progress === 'number' && (
                <Progress percent={source.progress} size="small" style={{ marginBottom: 16 }} />
              )}

              <Row gutter={16}>
                <Col span={12}>
                  <Statistic 
                    title="总数据" 
                    value={source.count || 0} 
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic 
                    title="今日新增" 
                    value={source.todayCount || 0} 
                    valueStyle={{ fontSize: '16px', color: '#52c41a' }}
                  />
                </Col>
              </Row>

              {source.lastUpdate && (
                <div style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                  上次更新: {new Date(source.lastUpdate).toLocaleString()}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 更新历史 */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="📈 数据统计总览" style={{ height: '400px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="总数据量"
                  value={sources.reduce((sum, s) => sum + (s.count || 0), 0)}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="今日新增"
                  value={sources.reduce((sum, s) => sum + (s.todayCount || 0), 0)}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="活跃数据源"
                  value={sources.filter(s => (s.todayCount || 0) > 0).length}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="⏱️ 更新历史" style={{ height: '400px', overflow: 'auto' }}>
            {updateHistory.length > 0 ? (
              <Timeline size="small">
                {updateHistory.map((item, index) => (
                  <Timeline.Item
                    key={index}
                    dot={item.status === 'success' ? 
                      <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                    }
                  >
                    <div>
                      <Text strong>{item.source}</Text>
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
                暂无更新记录
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* GitHub Trending 预览模态框 */}
      <Modal
        title="🔥 GitHub Trending 预览"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="update" 
            type="primary"
            onClick={() => {
              setPreviewModalVisible(false)
              updateSingleSource('github')
            }}
          >
            保存这些数据
          </Button>
        ]}
      >
        {previewData && (
          <div>
            <Alert
              message={`发现 ${previewData.total_count} 个trending项目`}
              description="以下是今日最新的trending项目预览，确认后将保存到数据库"
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            {previewData.python_trending && previewData.python_trending.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={4}>Python 项目 ({previewData.python_trending.length})</Title>
                {previewData.python_trending.slice(0, 5).map((repo, index) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{repo.title}</Text>
                      <Space>
                        <Text>⭐ {repo.stars}</Text>
                        <Text type="secondary">得分: {repo.trending_score?.toFixed(1)}</Text>
                      </Space>
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {repo.description}
                    </Text>
                  </div>
                ))}
              </div>
            )}
            
            {previewData.general_trending && previewData.general_trending.length > 0 && (
              <div>
                <Title level={4}>全语言项目 ({previewData.general_trending.length})</Title>
                {previewData.general_trending.slice(0, 3).map((repo, index) => (
                  <div key={index} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{repo.title}</Text>
                      <Space>
                        <Text>⭐ {repo.stars}</Text>
                        <Text type="secondary">得分: {repo.trending_score?.toFixed(1)}</Text>
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
    </div>
  )
}

export default DataSources