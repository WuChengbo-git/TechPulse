import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Tag, Timeline, Avatar, Button, Progress, Divider } from 'antd'
import { LineChartOutlined, StarOutlined, ForkOutlined, FireOutlined, ClockCircleOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text, Paragraph } = Typography

interface TechCard {
  id: number
  title: string
  source: 'github' | 'arxiv' | 'huggingface' | 'zenn'
  stars?: number
  summary?: string
  created_at: string
  chinese_tags?: string[]
}

interface Stats {
  total_cards: number
  today_cards: number
  sources_stats: Record<string, number>
  trending_tags: Array<{ tag: string; count: number }>
}

const Overview: React.FC = () => {
  const { t } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentCards, setRecentCards] = useState<TechCard[]>([])
  const [trendingCards, setTrendingCards] = useState<TechCard[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      
      // 获取卡片数据
      const recentRes = await fetch('/api/v1/cards/?limit=20')
      
      if (recentRes.ok) {
        const recentData = await recentRes.json()
        setRecentCards(recentData)
        setTrendingCards(recentData.filter((card: TechCard) => card.stars && card.stars > 10).slice(0, 8))
        
        // 计算统计数据
        const sourceStats = recentData.reduce((acc: Record<string, number>, card: TechCard) => {
          acc[card.source] = (acc[card.source] || 0) + 1
          return acc
        }, {})
        
        const tagCounts: Record<string, number> = {}
        recentData.forEach((card: TechCard) => {
          card.chinese_tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })
        
        const trending_tags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([tag, count]) => ({ tag, count }))
        
        const today = new Date().toDateString()
        const todayCards = recentData.filter((card: TechCard) => 
          new Date(card.created_at).toDateString() === today
        )
        
        setStats({
          total_cards: recentData.length,
          today_cards: todayCards.length,
          sources_stats: sourceStats,
          trending_tags
        })
      }
    } catch (err) {
      console.error('Failed to fetch overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverviewData()
  }, [])

  const getSourceIcon = (source: string) => {
    const iconMap = {
      github: <GithubOutlined style={{ color: '#24292e' }} />,
      arxiv: <FileTextOutlined style={{ color: '#b31b1b' }} />,
      huggingface: <RobotOutlined style={{ color: '#ff6f00' }} />,
      zenn: <EditOutlined style={{ color: '#3ea8ff' }} />
    }
    return iconMap[source as keyof typeof iconMap] || null
  }

  const getSourceName = (source: string) => {
    const nameMap = {
      github: 'GitHub',
      arxiv: 'arXiv',
      huggingface: 'Hugging Face', 
      zenn: 'Zenn'
    }
    return nameMap[source as keyof typeof nameMap] || source
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>{t('overview.loading')}</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>{t('overview.title')}</Title>
        <Text type="secondary">{t('overview.subtitle')}</Text>
      </div>

      {/* 核心统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="総データ量"
              value={stats?.total_cards || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LineChartOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="本日の新規"
              value={stats?.today_cards || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
              suffix="件"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="人気プロジェクト"
              value={trendingCards.filter(c => (c.stars || 0) > 1000).length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FireOutlined />}
              suffix="個"
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="データソース"
              value={Object.keys(stats?.sources_stats || {}).length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
              suffix="個"
            />
          </Card>
        </Col>
      </Row>

      {/* 数据源分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="📊 データソース分散" extra={<Button size="small">詳細を表示</Button>}>
            <Row gutter={[8, 8]}>
              {Object.entries(stats?.sources_stats || {}).map(([source, count]) => (
                <Col span={12} key={source}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '8px 12px', 
                    background: '#fafafa', 
                    borderRadius: '6px',
                    marginBottom: '8px'
                  }}>
                    {getSourceIcon(source)}
                    <div style={{ marginLeft: 8, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong style={{ fontSize: '12px' }}>{getSourceName(source)}</Text>
                        <Text style={{ fontSize: '12px', color: '#1890ff' }}>{count}</Text>
                      </div>
                      <Progress 
                        percent={Math.round((count / (stats?.total_cards || 1)) * 100)} 
                        size="small" 
                        showInfo={false}
                        strokeColor="#1890ff"
                      />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="🔥 人気タグ" extra={<Button size="small">タグクラウド</Button>}>
            <div style={{ minHeight: '200px' }}>
              {stats?.trending_tags ? (
                <Space wrap size="small">
                  {stats.trending_tags.slice(0, 20).map((tagInfo, index) => (
                    <Tag 
                      key={index}
                      color={[
                        'magenta', 'red', 'volcano', 'orange', 'gold',
                        'lime', 'green', 'cyan', 'blue', 'geekblue', 
                        'purple'
                      ][index % 11]}
                      style={{ 
                        fontSize: `${Math.max(12, 16 - index * 0.3)}px`,
                        padding: '4px 8px'
                      }}
                    >
                      {tagInfo.tag} ({tagInfo.count})
                    </Tag>
                  ))}
                </Space>
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '60px 0' }}>
                  タグデータがありません
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最新内容和热门项目 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="⏰ 最新コンテンツ" 
            extra={<Button size="small">全て表示</Button>}
            style={{ height: '500px' }}
          >
            <Timeline style={{ maxHeight: '400px', overflow: 'auto' }}>
              {recentCards.map((card) => (
                <Timeline.Item 
                  key={card.id}
                  dot={<Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                    {getSourceIcon(card.source)}
                  </Avatar>}
                >
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: '13px' }}>
                        {card.title.length > 40 ? card.title.substring(0, 40) + '...' : card.title}
                      </Text>
                      <Tag size="small" color="blue">{card.source.toUpperCase()}</Tag>
                    </div>
                    
                    {card.summary && (
                      <Paragraph 
                        ellipsis={{ rows: 2 }} 
                        style={{ fontSize: '11px', color: '#666', margin: 0 }}
                      >
                        {card.summary}
                      </Paragraph>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <div>
                        {card.chinese_tags?.slice(0, 2).map((tag, i) => (
                          <Tag key={i} size="small" color="green">{tag}</Tag>
                        ))}
                      </div>
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {new Date(card.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="🌟 人気プロジェクト" 
            extra={<Button size="small">全て表示</Button>}
            style={{ height: '500px' }}
          >
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {trendingCards.map((card, index) => (
                <div key={card.id} style={{ 
                  padding: '12px 0', 
                  borderBottom: index < trendingCards.length - 1 ? '1px solid #f0f0f0' : 'none' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ 
                      minWidth: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: index < 3 ? ['#ff4d4f', '#fa8c16', '#fadb14'][index] : '#d9d9d9',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text strong style={{ fontSize: '13px' }}>
                          {card.title.length > 30 ? card.title.substring(0, 30) + '...' : card.title}
                        </Text>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        {card.stars !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StarOutlined style={{ color: '#faad14', fontSize: '12px' }} />
                            <Text style={{ fontSize: '11px' }}>{card.stars.toLocaleString()}</Text>
                          </div>
                        )}
                        <Tag size="small" color="blue">{card.source.toUpperCase()}</Tag>
                      </div>
                      
                      {card.summary && (
                        <Paragraph 
                          ellipsis={{ rows: 1 }} 
                          style={{ fontSize: '11px', color: '#666', margin: 0 }}
                        >
                          {card.summary}
                        </Paragraph>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Overview