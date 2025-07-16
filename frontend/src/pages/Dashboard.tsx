import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Typography, Spin, Alert, Button, Tag, Space, Select, Modal, message, Tabs, Input, Badge, Divider } from 'antd'
import { GithubOutlined, FileTextOutlined, RobotOutlined, SyncOutlined, TranslationOutlined, SettingOutlined, SearchOutlined, StarOutlined, ForkOutlined, ExclamationCircleOutlined, EyeOutlined, CloudDownloadOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Search } = Input
const { TabPane } = Tabs

interface TechCard {
  id: number
  title: string
  source: 'github' | 'arxiv' | 'huggingface'
  original_url: string
  summary?: string
  chinese_tags?: string[]
  ai_category?: string[]
  tech_stack?: string[]
  license?: string
  stars?: number
  forks?: number
  issues?: number
  trial_suggestion?: string
  status: string
  created_at: string
}

interface Language {
  code: string
  name: string
  flag: string
}

const Dashboard: React.FC = () => {
  const [cards, setCards] = useState<TechCard[]>([])
  const [filteredCards, setFilteredCards] = useState<TechCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [languages, setLanguages] = useState<Record<string, Language>>({})
  const [currentLanguage, setCurrentLanguage] = useState('zh')
  const [translationLoading, setTranslationLoading] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const fetchCards = async (source?: string) => {
    try {
      setLoading(true)
      let url = '/api/v1/cards/?limit=50'
      if (source && source !== 'all') {
        url += `&source=${source}`
      }
      const response = await fetch(url)
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

  // 过滤卡片
  const filterCards = () => {
    let filtered = cards

    // 按来源过滤
    if (activeTab !== 'all') {
      filtered = filtered.filter(card => card.source === activeTab)
    }

    // 按搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(query) ||
        card.summary?.toLowerCase().includes(query) ||
        card.chinese_tags?.some(tag => tag.toLowerCase().includes(query)) ||
        card.ai_category?.some(cat => cat.toLowerCase().includes(query)) ||
        card.tech_stack?.some(tech => tech.toLowerCase().includes(query))
      )
    }

    setFilteredCards(filtered)
  }

  // 显示详情
  const showDetail = (card: TechCard) => {
    setSelectedCard(card)
    setDetailModalVisible(true)
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

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/v1/languages')
      if (response.ok) {
        const data = await response.json()
        setLanguages(data.languages)
        setCurrentLanguage(data.current_language)
      }
    } catch (err) {
      console.error('Failed to fetch languages:', err)
    }
  }

  const fetchServiceStatus = async () => {
    try {
      const response = await fetch('/api/v1/status')
      if (response.ok) {
        const data = await response.json()
        setServiceStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch service status:', err)
    }
  }

  const handleLanguageChange = async (language: string) => {
    try {
      const response = await fetch('/api/v1/language/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language })
      })
      if (response.ok) {
        setCurrentLanguage(language)
        message.success(`语言已切换到 ${languages[language]?.name}`)
      }
    } catch (err) {
      message.error('语言切换失败')
    }
  }

  const translateCard = async (cardId: number) => {
    if (!serviceStatus?.ai_service_available) {
      message.warning('AI服务未配置，无法翻译')
      return
    }

    try {
      setTranslationLoading(true)
      const response = await fetch('/api/v1/translate/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardId, target_language: currentLanguage })
      })
      
      if (response.ok) {
        const data = await response.json()
        Modal.info({
          title: '翻译结果',
          content: (
            <div>
              <p><strong>原文摘要：</strong></p>
              <p>{data.original_summary}</p>
              <p><strong>翻译摘要：</strong></p>
              <p>{data.translated_summary}</p>
              {data.translated_trial_suggestion && (
                <>
                  <p><strong>试用建议：</strong></p>
                  <p>{data.translated_trial_suggestion}</p>
                </>
              )}
            </div>
          ),
          width: 600
        })
      } else {
        message.error('翻译失败')
      }
    } catch (err) {
      message.error('翻译失败: ' + err)
    } finally {
      setTranslationLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
    fetchLanguages()
    fetchServiceStatus()
  }, [])

  // 当cards、activeTab或searchQuery变化时重新过滤
  useEffect(() => {
    filterCards()
  }, [cards, activeTab, searchQuery])

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

  // 保存到Notion
  const saveToNotion = async (card: TechCard) => {
    try {
      const response = await fetch('/api/v1/notion/save-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id })
      })
      
      if (response.ok) {
        message.success('已保存到Notion!')
        setDetailModalVisible(false)
      } else {
        message.error('保存失败')
      }
    } catch (err) {
      message.error('保存失败: ' + err)
    }
  }

  return (
    <div>
      {/* 头部区域 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={2}>🚀 TechPulse 技术情报仪表盘</Title>
          <Space>
            <Select
              value={currentLanguage}
              onChange={handleLanguageChange}
              style={{ width: 120 }}
              placeholder="选择语言"
            >
              {Object.entries(languages).map(([code, lang]) => (
                <Select.Option key={code} value={code}>
                  {lang.flag} {lang.name}
                </Select.Option>
              ))}
            </Select>
            {serviceStatus && (
              <Tag color={serviceStatus.ai_service_available ? 'green' : 'red'}>
                AI服务: {serviceStatus.ai_service_available ? '已连接' : '未配置'}
              </Tag>
            )}
          </Space>
        </div>

        {/* 搜索和操作栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Search
            placeholder="搜索项目、技术栈、标签..."
            allowClear
            style={{ width: 400 }}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefix={<SearchOutlined />}
          />
          <Space>
            <Button 
              type="primary" 
              icon={<SyncOutlined />}
              onClick={() => fetchCards(activeTab === 'all' ? undefined : activeTab)}
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

      {/* Tab导航 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ marginBottom: 24 }}
      >
        <TabPane 
          tab={<span><SettingOutlined />全部 ({cards.length})</span>} 
          key="all" 
        />
        <TabPane 
          tab={<span><GithubOutlined />GitHub ({cards.filter(c => c.source === 'github').length})</span>} 
          key="github" 
        />
        <TabPane 
          tab={<span><FileTextOutlined />arXiv ({cards.filter(c => c.source === 'arxiv').length})</span>} 
          key="arxiv" 
        />
        <TabPane 
          tab={<span><RobotOutlined />Hugging Face ({cards.filter(c => c.source === 'huggingface').length})</span>} 
          key="huggingface" 
        />
      </Tabs>

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>加载技术情报中...</div>
        </div>
      )}

      {/* 无数据提示 */}
      {filteredCards.length === 0 && !loading && (
        <Alert
          message="暂无数据"
          description={cards.length === 0 ? "点击「收集新数据」按钮开始抓取技术情报" : "没有找到匹配的内容，尝试调整搜索条件"}
          type="info"
          showIcon
        />
      )}

      {/* 卡片列表 */}
      <Row gutter={[16, 16]}>
        {filteredCards.map((card) => (
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
                    {card.title.length > 25 ? card.title.substring(0, 25) + '...' : card.title}
                  </span>
                </div>
              }
              extra={
                <Tag color={getSourceColor(card.source)}>
                  {card.source.toUpperCase()}
                </Tag>
              }
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => showDetail(card)}
                  style={{ fontSize: '12px' }}
                >
                  详情
                </Button>,
                <a 
                  href={card.original_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: '12px' }}
                >
                  原文
                </a>,
                <Button
                  type="text"
                  size="small"
                  icon={<TranslationOutlined />}
                  onClick={() => translateCard(card.id)}
                  loading={translationLoading}
                  disabled={!serviceStatus?.ai_service_available}
                  style={{ fontSize: '12px' }}
                >
                  翻译
                </Button>
              ]}
            >
              {/* GitHub项目统计信息 */}
              {card.source === 'github' && (
                <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                  {card.stars !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <Text style={{ fontSize: '12px' }}>{card.stars}</Text>
                    </div>
                  )}
                  {card.forks !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ForkOutlined style={{ color: '#1890ff' }} />
                      <Text style={{ fontSize: '12px' }}>{card.forks}</Text>
                    </div>
                  )}
                  {card.license && (
                    <Tag size="small" color="geekblue">{card.license}</Tag>
                  )}
                </div>
              )}

              {/* 摘要 */}
              {card.summary && (
                <Paragraph 
                  ellipsis={{ rows: 3, expandable: false }}
                  style={{ fontSize: '12px', marginBottom: 12 }}
                >
                  {card.summary}
                </Paragraph>
              )}

              {/* AI分类标签 */}
              {card.ai_category && card.ai_category.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: '10px', color: '#666' }}>AI分类: </Text>
                  {card.ai_category.slice(0, 2).map((cat, index) => (
                    <Tag key={index} color="purple" style={{ fontSize: '10px' }}>
                      {cat}
                    </Tag>
                  ))}
                  {card.ai_category.length > 2 && (
                    <Tag style={{ fontSize: '10px' }}>
                      +{card.ai_category.length - 2}
                    </Tag>
                  )}
                </div>
              )}

              {/* 技术栈 */}
              {card.tech_stack && card.tech_stack.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: '10px', color: '#666' }}>技术栈: </Text>
                  {card.tech_stack.slice(0, 3).map((tech, index) => (
                    <Tag key={index} color="blue" style={{ fontSize: '10px' }}>
                      {tech}
                    </Tag>
                  ))}
                  {card.tech_stack.length > 3 && (
                    <Tag style={{ fontSize: '10px' }}>
                      +{card.tech_stack.length - 3}
                    </Tag>
                  )}
                </div>
              )}
              
              {/* 中文标签 */}
              {card.chinese_tags && card.chinese_tags.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: '10px', color: '#666' }}>标签: </Text>
                  {card.chinese_tags.slice(0, 2).map((tag, index) => (
                    <Tag key={index} color="green" style={{ fontSize: '10px' }}>
                      {tag}
                    </Tag>
                  ))}
                  {card.chinese_tags.length > 2 && (
                    <Tag style={{ fontSize: '10px' }}>
                      +{card.chinese_tags.length - 2}
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

      {/* 详情模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: getSourceColor(selectedCard?.source || '') }}>
              {getSourceIcon(selectedCard?.source || '')}
            </span>
            <span>{selectedCard?.title}</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="original" 
            onClick={() => window.open(selectedCard?.original_url, '_blank')}
          >
            查看原文
          </Button>,
          <Button 
            key="notion" 
            type="primary" 
            icon={<CloudDownloadOutlined />}
            onClick={() => selectedCard && saveToNotion(selectedCard)}
          >
            保存到Notion
          </Button>
        ]}
      >
        {selectedCard && (
          <div>
            {/* 基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Space size="large">
                <Tag color={getSourceColor(selectedCard.source)}>
                  {selectedCard.source.toUpperCase()}
                </Tag>
                {selectedCard.source === 'github' && (
                  <>
                    {selectedCard.stars !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <StarOutlined style={{ color: '#faad14' }} />
                        <Text>{selectedCard.stars.toLocaleString()} Stars</Text>
                      </div>
                    )}
                    {selectedCard.forks !== undefined && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ForkOutlined style={{ color: '#1890ff' }} />
                        <Text>{selectedCard.forks.toLocaleString()} Forks</Text>
                      </div>
                    )}
                    {selectedCard.license && (
                      <Tag color="geekblue">{selectedCard.license}</Tag>
                    )}
                  </>
                )}
              </Space>
            </div>

            {/* 摘要 */}
            {selectedCard.summary && (
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>📝 项目摘要</Title>
                <Paragraph>{selectedCard.summary}</Paragraph>
              </div>
            )}

            {/* AI分类标签 */}
            {selectedCard.ai_category && selectedCard.ai_category.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>🤖 AI分类</Title>
                <Space wrap>
                  {selectedCard.ai_category.map((cat, index) => (
                    <Tag key={index} color="purple">
                      {cat}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 技术栈 */}
            {selectedCard.tech_stack && selectedCard.tech_stack.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>⚙️ 技术栈</Title>
                <Space wrap>
                  {selectedCard.tech_stack.map((tech, index) => (
                    <Tag key={index} color="blue">
                      {tech}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 中文标签 */}
            {selectedCard.chinese_tags && selectedCard.chinese_tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>🏷️ 标签</Title>
                <Space wrap>
                  {selectedCard.chinese_tags.map((tag, index) => (
                    <Tag key={index} color="green">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 试用建议 */}
            {selectedCard.trial_suggestion && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>💡 试用建议</Title>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f0f0f0', 
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9'
                }}>
                  <Paragraph>{selectedCard.trial_suggestion}</Paragraph>
                </div>
              </div>
            )}

            {/* 创建时间 */}
            <div style={{ textAlign: 'right', color: '#999', fontSize: '12px' }}>
              创建时间: {new Date(selectedCard.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Dashboard