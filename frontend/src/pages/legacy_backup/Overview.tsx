import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Space, Tag, Timeline, Avatar, Button, Progress, Divider, Modal, Badge, Empty, Checkbox } from 'antd'
import { LineChartOutlined, StarOutlined, FireOutlined, ClockCircleOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, ArrowUpOutlined, LinkOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import { translateTags } from '../utils/translateTags'

const { Title, Text, Paragraph } = Typography

interface TechCard {
  id: number
  title: string
  source: 'github' | 'arxiv' | 'huggingface' | 'zenn'
  stars?: number
  summary?: string
  created_at: string
  chinese_tags?: string[]
  url?: string
  description?: string
  author?: string
  language?: string
}

interface Stats {
  total_cards: number
  today_cards: number
  sources_stats: Record<string, number>
  trending_tags: Array<{ tag: string; count: number }>
}

const Overview: React.FC = () => {
  const { t, language } = useLanguage()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentCards, setRecentCards] = useState<TechCard[]>([])
  const [trendingCards, setTrendingCards] = useState<TechCard[]>([])
  const [loading, setLoading] = useState(true)
  // 保留modal相关状态以备需要时使用详情查看
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  // 信息源选择状态
  const [selectedSources, setSelectedSources] = useState<string[]>(['github', 'arxiv', 'huggingface', 'zenn'])
  // 热门标签翻译状态
  const [translatedTags, setTranslatedTags] = useState<Array<{ tag: string; count: number }>>([])
  // 不需要存储所有数据，直接过滤

  const fetchOverviewData = async () => {
    try {
      setLoading(true)
      
      // 获取卡片数据 - 增加更多数据用于筛选
      const recentRes = await fetch('/api/v1/cards/?limit=100')
      
      if (recentRes.ok) {
        const allData = await recentRes.json()
        // 直接过滤数据
        
        // 应用信息源过滤
        const filteredData = allData.filter((card: TechCard) => selectedSources.includes(card.source))
        
        // 最新内容：按时间排序，取前10个
        const recentData = filteredData
          .sort((a: TechCard, b: TechCard) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 10)
        
        // 热门内容：按stars排序，排除已在最新内容中的项目
        const recentIds = new Set(recentData.map((card: TechCard) => card.id))
        const trendingData = filteredData
          .filter((card: TechCard) => card.stars && card.stars > 10 && !recentIds.has(card.id))
          .sort((a: TechCard, b: TechCard) => (b.stars || 0) - (a.stars || 0))
          .slice(0, 8)
        
        setRecentCards(recentData)
        setTrendingCards(trendingData)
        
        // 计算统计数据 - 基于过滤后的数据
        const sourceStats = filteredData.reduce((acc: Record<string, number>, card: TechCard) => {
          acc[card.source] = (acc[card.source] || 0) + 1
          return acc
        }, {})
        
        const tagCounts: Record<string, number> = {}
        filteredData.forEach((card: TechCard) => {
          card.chinese_tags?.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })
        
        const trending_tags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
          .map(([tag, count]) => ({ tag, count }))
        
        const today = new Date().toDateString()
        const todayCards = filteredData.filter((card: TechCard) => 
          new Date(card.created_at).toDateString() === today
        )
        
        setStats({
          total_cards: filteredData.length,
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
  }, [selectedSources]) // 依赖信息源选择变化

  // 当语言或热门标签变化时翻译标签
  useEffect(() => {
    const handleTagTranslation = async () => {
      if (!stats?.trending_tags || stats.trending_tags.length === 0) {
        setTranslatedTags([])
        return
      }

      // 如果是中文，直接使用原标签
      if (language === 'zh-CN') {
        setTranslatedTags(stats.trending_tags)
        return
      }

      // 翻译标签
      const tagTexts = stats.trending_tags.map(t => t.tag)
      const translated = await translateTags(tagTexts, language)

      // 组合翻译结果和计数
      const translatedWithCounts = stats.trending_tags.map((item, index) => ({
        tag: translated[index],
        count: item.count
      }))

      setTranslatedTags(translatedWithCounts)
    }

    handleTagTranslation()
  }, [language, stats?.trending_tags])
  
  // 信息源选项
  const sourceOptions = [
    { label: 'GitHub', value: 'github', icon: <GithubOutlined style={{ color: '#24292e' }} /> },
    { label: 'arXiv', value: 'arxiv', icon: <FileTextOutlined style={{ color: '#b31b1b' }} /> },
    { label: 'Hugging Face', value: 'huggingface', icon: <RobotOutlined style={{ color: '#ff6f00' }} /> },
    { label: 'Zenn', value: 'zenn', icon: <EditOutlined style={{ color: '#3ea8ff' }} /> }
  ]
  
  const handleSourceChange = (sources: string[]) => {
    setSelectedSources(sources.length > 0 ? sources : ['github']) // 至少选择一个源
  }
  
  const selectAllSources = () => {
    setSelectedSources(['github', 'arxiv', 'huggingface', 'zenn'])
  }
  
  const clearAllSources = () => {
    setSelectedSources(['github']) // 默认保留GitHub
  }

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

  const handleCardClick = (card: TechCard) => {
    setSelectedCard(card)
    setModalVisible(true)
  }

  const handleModalClose = () => {
    setModalVisible(false)
    setSelectedCard(null)
  }


  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>{t('overview.loading')}</div>
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>{t('overview.title')}</Title>
            <Text type="secondary">{t('overview.subtitle')}</Text>
          </div>
          <div style={{ minWidth: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text strong>{t('overview.selectSources')}</Text>
              <Space>
                <Button
                  type="link"
                  size="small"
                  onClick={selectAllSources}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {t('overview.selectAll')}
                </Button>
                <Text type="secondary">|</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={clearAllSources}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {t('overview.clearAll')}
                </Button>
              </Space>
            </div>
            <Checkbox.Group 
              value={selectedSources} 
              onChange={handleSourceChange}
              style={{ width: '100%' }}
            >
              <Row gutter={[8, 8]}>
                {sourceOptions.map(option => (
                  <Col span={12} key={option.value}>
                    <Checkbox value={option.value}>
                      <Space>
                        {option.icon}
                        <span style={{ fontSize: '12px' }}>{option.label}</span>
                      </Space>
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
            <Text type="secondary" style={{ fontSize: '11px', marginTop: 4, display: 'block' }}>
              已选择 {selectedSources.length} / {sourceOptions.length} 个数据源
            </Text>
          </div>
        </div>
      </div>

      {/* 核心统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('overview.totalData')}
              value={stats?.total_cards || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LineChartOutlined />}
              suffix={t('overview.count')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('overview.todayNew')}
              value={stats?.today_cards || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ArrowUpOutlined />}
              suffix={t('overview.count')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('overview.hotProjects')}
              value={trendingCards.filter(c => (c.stars || 0) > 1000).length}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<FireOutlined />}
              suffix={t('overview.unit')}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={t('overview.dataSources')}
              value={Object.keys(stats?.sources_stats || {}).length}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ClockCircleOutlined />}
              suffix={t('overview.unit')}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据源分布 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={t('overview.dataSourceDistribution')} extra={<Button size="small">{t('overview.viewDetails')}</Button>}>
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
          <Card title={t('overview.hotTags')} extra={<Button size="small">{t('overview.tagCloud')}</Button>}>
            <div style={{ minHeight: '200px' }}>
              {translatedTags.length > 0 ? (
                <Space wrap size="small">
                  {translatedTags.slice(0, 20).map((tagInfo, index) => (
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
                  {t('overview.noTagData')}
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
            title={t('overview.latestContent')} 
            extra={<Button size="small">{t('overview.viewAll')}</Button>}
            style={{ height: '500px' }}
            styles={{ body: { padding: '16px', paddingTop: '12px' } }}
          >
            <Timeline 
              style={{ 
                maxHeight: '400px', 
                overflow: 'auto', 
                paddingTop: '8px',
                paddingRight: '8px'
              }}
              items={recentCards.map((card) => ({
                key: card.id,
                dot: (
                  <Avatar 
                    size="small" 
                    style={{ 
                      backgroundColor: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                  >
                    {getSourceIcon(card.source)}
                  </Avatar>
                ),
                children: (
                  <div 
                    style={{ marginBottom: 12, paddingLeft: '4px', cursor: 'pointer' }}
                    onClick={() => card.url ? window.open(card.url, '_blank') : handleCardClick(card)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <Text strong style={{ fontSize: '13px', lineHeight: '1.4', flex: 1, minWidth: 0, color: '#1890ff' }}>
                        {card.title.length > 35 ? card.title.substring(0, 35) + '...' : card.title}
                      </Text>
                      <Tag color="blue" style={{ flexShrink: 0 }}>{card.source.toUpperCase()}</Tag>
                    </div>
                    
                    {card.summary && (
                      <Paragraph 
                        ellipsis={{ rows: 2 }} 
                        style={{ 
                          fontSize: '11px', 
                          color: '#666', 
                          margin: '4px 0 6px 0',
                          lineHeight: '1.3'
                        }}
                      >
                        {card.summary}
                      </Paragraph>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-end', 
                      marginTop: 6,
                      gap: 8
                    }}>
                      <div style={{ flex: 1 }}>
                        {card.chinese_tags?.slice(0, 2).map((tag, i) => (
                          <Tag key={i} color="green" style={{ marginBottom: 2, fontSize: '11px' }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                      <Text type="secondary" style={{ 
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {new Date(card.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={t('overview.hotProjectsRank')} 
            extra={<Button size="small">{t('overview.viewAll')}</Button>}
            style={{ height: '500px' }}
          >
            <div style={{ maxHeight: '400px', overflow: 'auto' }}>
              {trendingCards.length === 0 ? (
                <Empty 
                  description={t('overview.noTagData')}
                  style={{ padding: '60px 20px' }}
                />
              ) : (
                trendingCards.map((card, index) => (
                <div 
                  key={card.id} 
                  style={{ 
                    padding: '12px 0', 
                    borderBottom: index < trendingCards.length - 1 ? '1px solid #f0f0f0' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => card.url ? window.open(card.url, '_blank') : handleCardClick(card)}
                >
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
                        <Text strong style={{ fontSize: '13px', color: '#1890ff' }}>
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
                        <Tag color="blue">{card.source.toUpperCase()}</Tag>
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
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 详情模态框 */}
      <Modal
        title={null}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={700}
      >
        {selectedCard && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {getSourceIcon(selectedCard.source)}
                <Title level={4} style={{ margin: 0, flex: 1 }}>
                  {selectedCard.title}
                </Title>
                <Tag color="blue">{selectedCard.source.toUpperCase()}</Tag>
              </div>
              
              <Button 
                type="primary" 
                icon={<LinkOutlined />} 
                href={selectedCard.url} 
                target="_blank"
                style={{ marginBottom: 16 }}
              >
                {t('overview.viewOriginal')}
              </Button>
            </div>

            <Divider />

            <div style={{ marginBottom: 20 }}>
              <Title level={5}>{t('overview.summary')}</Title>
              {selectedCard.summary ? (
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedCard.summary}
                </Paragraph>
              ) : (
                <Empty description={t('overview.noSummary')} />
              )}
            </div>

            {selectedCard.chinese_tags && selectedCard.chinese_tags.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <Title level={5}>{t('overview.tags')}</Title>
                <Space wrap>
                  {selectedCard.chinese_tags.map((tag, index) => (
                    <Tag key={index} color="green">{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {selectedCard.stars !== undefined && (
                  <Badge count={selectedCard.stars} showZero color="#faad14">
                    <StarOutlined style={{ color: '#faad14' }} />
                  </Badge>
                )}
                <Text type="secondary">
                  {t('overview.source')}: {getSourceName(selectedCard.source)}
                </Text>
              </div>
              <Text type="secondary">
                {new Date(selectedCard.created_at).toLocaleDateString()}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Overview