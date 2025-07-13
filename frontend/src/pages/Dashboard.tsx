import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Spin, Alert, Button, Tag, Space } from 'antd'
import { GithubOutlined, FileTextOutlined, RobotOutlined, SyncOutlined } from '@ant-design/icons'

const { Title, Paragraph } = Typography

interface TechCard {
  id: number
  title: string
  source: 'github' | 'arxiv' | 'huggingface'
  original_url: string
  summary?: string
  chinese_tags?: string[]
  trial_suggestion?: string
  status: string
  created_at: string
}

const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<TechCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards?limit=20')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
        setError(null)
      } else {
        setError('Failed to fetch cards')
      }
    } catch (err) {
      setError('Network error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  const triggerDataCollection = async () => {
    try {
      const response = await fetch('/api/v1/sources/collect', { method: 'POST' })
      if (response.ok) {
        alert('数据收集已开始，请稍后刷新页面查看新内容')
      }
    } catch (err) {
      alert('启动数据收集失败: ' + err)
    }
  }

  useEffect(() => {
    fetchCards()
  }, [])

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <GithubOutlined />
      case 'arxiv':
        return <FileTextOutlined />
      case 'huggingface':
        return <RobotOutlined />
      default:
        return null
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'github':
        return '#24292e'
      case 'arxiv':
        return '#b31b1b'
      case 'huggingface':
        return '#ff6f00'
      default:
        return '#1890ff'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载技术情报中...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>📊 技术情报仪表盘</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<SyncOutlined />}
            onClick={fetchCards}
          >
            刷新
          </Button>
          <Button 
            icon={<SyncOutlined />}
            onClick={triggerDataCollection}
          >
            收集新数据
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {cards.length === 0 && !loading && (
        <Alert
          message="暂无数据"
          description="点击"收集新数据"按钮开始抓取技术情报"
          type="info"
          showIcon
        />
      )}

      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={card.id}>
            <Card
              hoverable
              size="small"
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: getSourceColor(card.source) }}>
                    {getSourceIcon(card.source)}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 'normal' }}>
                    {card.title.length > 30 ? card.title.substring(0, 30) + '...' : card.title}
                  </span>
                </div>
              }
              extra={
                <Tag color={getSourceColor(card.source)}>
                  {card.source.toUpperCase()}
                </Tag>
              }
              actions={[
                <a 
                  href={card.original_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px' }}
                >
                  查看原文
                </a>
              ]}
            >
              {card.summary && (
                <Paragraph 
                  ellipsis={{ rows: 3, expandable: false }}
                  style={{ fontSize: '12px', marginBottom: 12 }}
                >
                  {card.summary}
                </Paragraph>
              )}
              
              {card.chinese_tags && card.chinese_tags.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  {card.chinese_tags.slice(0, 3).map((tag, index) => (
                    <Tag key={index} size="small" style={{ fontSize: '10px' }}>
                      {tag}
                    </Tag>
                  ))}
                  {card.chinese_tags.length > 3 && (
                    <Tag size="small" style={{ fontSize: '10px' }}>
                      +{card.chinese_tags.length - 3}
                    </Tag>
                  )}
                </div>
              )}
              
              <div style={{ fontSize: '10px', color: '#999', marginTop: 8 }}>
                {new Date(card.created_at).toLocaleDateString('zh-CN')}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Dashboard