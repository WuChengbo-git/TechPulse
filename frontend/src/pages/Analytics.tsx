import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Typography, Space, Spin, Alert, Select, 
  Statistic, Progress, Tag, Button, DatePicker, Radio
} from 'antd'
import { 
  ArrowUpOutlined, ArrowDownOutlined, FireOutlined, 
  RobotOutlined, GithubOutlined, FileTextOutlined, 
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { Column, Line, Pie, WordCloud } from '@ant-design/charts'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

interface TechCard {
  id: number
  title: string
  source: string
  stars?: number
  forks?: number
  created_at: string
  chinese_tags?: string[]
  tech_stack?: string[]
  ai_category?: string[]
}

interface AnalyticsData {
  totalCards: number
  sourceDistribution: Array<{ source: string; count: number; percentage: number }>
  techTrends: Array<{ tech: string; count: number; growth: number }>
  dailyStats: Array<{ date: string; count: number; source: string }>
  popularTags: Array<{ text: string; value: number }>
  topProjects: Array<{ name: string; stars: number; source: string }>
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<TechCard[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState(7) // 默认7天
  const [chartType, setChartType] = useState<'column' | 'line' | 'pie'>('column')
  
  // 获取卡片数据
  const fetchCards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/cards/?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setCards(data)
        processAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 处理分析数据
  const processAnalyticsData = (cardsData: TechCard[]) => {
    const now = dayjs()
    const cutoffDate = now.subtract(timeRange, 'day')
    
    // 过滤时间范围内的数据
    const filteredCards = cardsData.filter(card => 
      dayjs(card.created_at).isAfter(cutoffDate)
    )
    
    // 计算来源分布
    const sourceCount = filteredCards.reduce((acc, card) => {
      acc[card.source] = (acc[card.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const totalCards = filteredCards.length
    const sourceDistribution = Object.entries(sourceCount).map(([source, count]) => ({
      source,
      count,
      percentage: Math.round((count / totalCards) * 100)
    }))
    
    // 计算技术趋势
    const techCount = filteredCards.reduce((acc, card) => {
      const techs = [
        ...(card.tech_stack || []),
        ...(card.chinese_tags || []),
        ...(card.ai_category || [])
      ]
      techs.forEach(tech => {
        if (tech && tech.trim()) {
          acc[tech] = (acc[tech] || 0) + 1
        }
      })
      return acc
    }, {} as Record<string, number>)
    
    const techTrends = Object.entries(techCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([tech, count]) => ({
        tech,
        count,
        growth: Math.random() * 100 - 50 // 模拟增长率
      }))
    
    // 计算每日统计
    const dailyStats: Array<{ date: string; count: number; source: string }> = []
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = now.subtract(i, 'day').format('YYYY-MM-DD')
      const dayCards = filteredCards.filter(card => 
        dayjs(card.created_at).format('YYYY-MM-DD') === date
      )
      
      const sources = ['github', 'arxiv', 'huggingface', 'zenn']
      sources.forEach(source => {
        const count = dayCards.filter(card => card.source === source).length
        dailyStats.push({ date, count, source })
      })
    }
    
    // 生成词云数据
    const popularTags = Object.entries(techCount)
      .slice(0, 50)
      .map(([text, value]) => ({ text, value }))
    
    // 获取热门项目
    const topProjects = filteredCards
      .filter(card => card.stars && card.stars > 0)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 10)
      .map(card => ({
        name: card.title.split('/').pop() || card.title,
        stars: card.stars || 0,
        source: card.source
      }))
    
    setAnalyticsData({
      totalCards,
      sourceDistribution,
      techTrends,
      dailyStats,
      popularTags,
      topProjects
    })
  }
  
  useEffect(() => {
    fetchCards()
  }, [])
  
  useEffect(() => {
    if (cards.length > 0) {
      processAnalyticsData(cards)
    }
  }, [timeRange, cards])
  
  // 获取来源图标
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <GithubOutlined style={{ color: '#24292e' }} />
      case 'arxiv':
        return <FileTextOutlined style={{ color: '#b31b1b' }} />
      case 'huggingface':
        return <RobotOutlined style={{ color: '#ff6f00' }} />
      case 'zenn':
        return <FileTextOutlined style={{ color: '#3ea8ff' }} />
      default:
        return null
    }
  }
  
  // 获取来源颜色
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'github':
        return '#24292e'
      case 'arxiv':
        return '#b31b1b'
      case 'huggingface':
        return '#ff6f00'
      case 'zenn':
        return '#3ea8ff'
      default:
        return '#1890ff'
    }
  }
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载数据分析...</div>
      </div>
    )
  }
  
  if (!analyticsData) {
    return (
      <Alert
        message="暂无数据"
        description="没有找到可分析的数据"
        type="info"
        showIcon
      />
    )
  }
  
  // 图表配置
  const sourceChartConfig = {
    data: analyticsData.sourceDistribution,
    xField: 'source',
    yField: 'count',
    colorField: 'source',
    color: (datum: any) => getSourceColor(datum.source),
    label: {
      position: 'middle' as const,
      style: { fill: '#FFFFFF', fontWeight: 'bold' }
    },
    meta: {
      source: { alias: '数据源' },
      count: { alias: '数量' }
    }
  }
  
  const trendChartConfig = {
    data: analyticsData.dailyStats,
    xField: 'date',
    yField: 'count',
    seriesField: 'source',
    color: ['#24292e', '#b31b1b', '#ff6f00', '#3ea8ff'],
    point: { size: 3 },
    smooth: true,
    meta: {
      date: { alias: '日期' },
      count: { alias: '数量' },
      source: { alias: '来源' }
    }
  }
  
  const techPieConfig = {
    data: analyticsData.techTrends.slice(0, 10),
    angleField: 'count',
    colorField: 'tech',
    radius: 0.8,
    label: {
      type: 'outer' as const,
      content: '{name}: {percentage}'
    }
  }
  
  const wordCloudConfig = {
    data: analyticsData.popularTags,
    wordField: 'text',
    weightField: 'value',
    colorField: 'text',
    wordStyle: {
      fontFamily: 'Verdana',
      fontSize: [8, 32] as [number, number],
      rotation: 0
    },
    interactions: [{ type: 'element-active' }]
  }
  
  return (
    <div>
      {/* 头部控制区 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              📊 技术趋势分析
            </Title>
            <Text type="secondary">实时技术情报数据分析和可视化</Text>
          </div>
          
          <Space>
            <Select 
              value={timeRange} 
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value={7}>最近7天</Option>
              <Option value={14}>最近14天</Option>
              <Option value={30}>最近30天</Option>
            </Select>
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchCards}
              loading={loading}
            >
              刷新数据
            </Button>
          </Space>
        </div>
      </Card>
      
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={analyticsData.totalCards}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="热门技术"
              value={analyticsData.techTrends[0]?.tech || 'N/A'}
              prefix={<ArrowUpOutlined style={{ color: '#1890ff' }} />}
              suffix={`(${analyticsData.techTrends[0]?.count || 0}项目)`}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="主要来源"
              value={analyticsData.sourceDistribution[0]?.source.toUpperCase() || 'N/A'}
              prefix={getSourceIcon(analyticsData.sourceDistribution[0]?.source || '')}
              suffix={`${analyticsData.sourceDistribution[0]?.percentage || 0}%`}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="技术标签"
              value={analyticsData.popularTags.length}
              prefix={<Tag />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      
      {/* 图表区域 */}
      <Row gutter={[16, 16]}>
        {/* 数据源分布 */}
        <Col xs={24} lg={12}>
          <Card 
            title="数据源分布" 
            extra={
              <Radio.Group 
                value={chartType} 
                onChange={(e) => setChartType(e.target.value)}
                size="small"
              >
                <Radio.Button value="column"><BarChartOutlined /></Radio.Button>
                <Radio.Button value="pie"><PieChartOutlined /></Radio.Button>
              </Radio.Group>
            }
          >
            {chartType === 'column' ? (
              <Column {...sourceChartConfig} height={300} />
            ) : (
              <Pie {...techPieConfig} height={300} />
            )}
          </Card>
        </Col>
        
        {/* 趋势图 */}
        <Col xs={24} lg={12}>
          <Card title="每日新增趋势" extra={<LineChartOutlined />}>
            <Line {...trendChartConfig} height={300} />
          </Card>
        </Col>
        
        {/* 技术热门度排行 */}
        <Col xs={24} lg={12}>
          <Card title="技术热门度排行">
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {analyticsData.techTrends.slice(0, 15).map((item, index) => (
                <div key={item.tech} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={index < 3 ? 'gold' : index < 10 ? 'blue' : 'default'}>
                      #{index + 1}
                    </Tag>
                    <Text>{item.tech}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong>{item.count}</Text>
                    {item.growth > 0 ? (
                      <ArrowUpOutlined style={{ color: '#3f8600' }} />
                    ) : (
                      <ArrowDownOutlined style={{ color: '#cf1322' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        
        {/* 技术词云 */}
        <Col xs={24} lg={12}>
          <Card title="技术关键词云">
            <WordCloud {...wordCloudConfig} height={300} />
          </Card>
        </Col>
        
        {/* 热门项目 */}
        <Col xs={24}>
          <Card title="热门项目排行">
            <Row gutter={[16, 16]}>
              {analyticsData.topProjects.map((project, index) => (
                <Col xs={24} sm={12} md={8} lg={6} key={project.name}>
                  <Card size="small" hoverable>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Tag color={index < 3 ? 'gold' : 'blue'}>#{index + 1}</Tag>
                      {getSourceIcon(project.source)}
                    </div>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>
                      {project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name}
                    </Title>
                    <Statistic
                      value={project.stars}
                      suffix="⭐"
                      valueStyle={{ fontSize: '14px', color: '#faad14' }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Analytics