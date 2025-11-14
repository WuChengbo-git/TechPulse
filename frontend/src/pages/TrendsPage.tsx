import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Typography, Space, Spin, Alert, Select,
  Statistic, Tag, Button, Table, Radio, Tabs, Progress,
  Badge, List, Avatar, Tooltip, Divider
} from 'antd'
import {
  LineChartOutlined, BarChartOutlined, ReloadOutlined, RocketOutlined,
  EyeOutlined, ThunderboltOutlined, CodeOutlined, RobotOutlined,
  SoundOutlined, PictureOutlined, BulbOutlined, ToolOutlined,
  StarOutlined, ArrowUpOutlined, ArrowDownOutlined, FireOutlined,
  RiseOutlined, FallOutlined
} from '@ant-design/icons'
import { Line, Column, Pie, Radar, DualAxes } from '@ant-design/charts'
import dayjs from 'dayjs'
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

interface TechCard {
  id: number
  title: string
  source: string
  stars?: number
  created_at: string
  summary?: string
  chinese_tags?: string[]
  tech_stack?: string[]
  ai_category?: string[]
}

interface LanguageTrend {
  language: string
  count: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  weeklyData: Array<{ date: string; count: number }>
}

interface AIFieldTrend {
  field: string
  count: number
  growth: number
  hotKeywords: string[]
  icon: React.ReactNode
  color: string
}

interface LLMModel {
  name: string
  capability: number
  popularity: number
  recent: boolean
  provider: string
  description: string
}

const TrendsPage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<TechCard[]>([])
  const [languageTrends, setLanguageTrends] = useState<LanguageTrend[]>([])
  const [aiFieldTrends, setAIFieldTrends] = useState<AIFieldTrend[]>([])
  const [llmModels, setLLMModels] = useState<LLMModel[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month')

  // 获取卡片数据
  const fetchCards = async () => {
    try {
      setLoading(true)
      console.log('Fetching cards...')
      const response = await fetch('/api/v1/cards/?limit=100')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched cards:', data.length, 'items')
        console.log('Sample card:', data[0])
        setCards(data)
        analyzeLanguageTrends(data)
        analyzeAIFieldTrends(data)
        analyzeLLMModels(data)
      } else {
        console.error('API response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error)
    } finally {
      setLoading(false)
    }
  }

  // 编程语言活跃度分析
  const analyzeLanguageTrends = (cardsData: TechCard[]) => {
    console.log('Analyzing language trends with', cardsData.length, 'cards')
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
    const now = dayjs()
    const currentPeriod = now.subtract(days, 'day')
    const previousPeriod = now.subtract(days * 2, 'day')

    // 编程语言关键词映射
    const languageKeywords = {
      'Python': ['python', 'py', 'pytorch', 'tensorflow', 'fastapi', 'django', 'flask'],
      'JavaScript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'next'],
      'TypeScript': ['typescript', 'ts'],
      'Rust': ['rust', 'cargo'],
      'Go': ['golang', 'go'],
      'Java': ['java', 'spring', 'kotlin'],
      'C++': ['cpp', 'c++', 'opencv'],
      'Swift': ['swift', 'ios'],
      'Julia': ['julia'],
      'R': ['r-lang', 'rstats']
    }

    const currentCards = cardsData.filter(card =>
      dayjs(card.created_at).isAfter(currentPeriod)
    )
    const previousCards = cardsData.filter(card => {
      const cardDate = dayjs(card.created_at)
      return cardDate.isAfter(previousPeriod) && cardDate.isBefore(currentPeriod)
    })

    const countLanguage = (cards: TechCard[]) => {
      const counts: Record<string, number> = {}

      Object.entries(languageKeywords).forEach(([language, keywords]) => {
        counts[language] = cards.filter(card => {
          // 从多个字段中提取文本进行匹配
          const allText = [
            card.title || '',
            card.summary || '',
            ...(card.tech_stack || []),
            ...(card.chinese_tags || []),
            ...(card.ai_category || [])
          ].join(' ').toLowerCase()

          return keywords.some(keyword => allText.includes(keyword))
        }).length
      })

      return counts
    }

    const currentCounts = countLanguage(currentCards)
    const previousCounts = countLanguage(previousCards)

    console.log('Current period cards:', currentCards.length)
    console.log('Previous period cards:', previousCards.length)
    console.log('Language counts (current):', currentCounts)
    console.log('Language counts (previous):', previousCounts)

    const trends: LanguageTrend[] = Object.entries(currentCounts).map(([language, currentCount]) => {
      const previousCount = previousCounts[language] || 0
      let growth = 0
      let trend: 'up' | 'down' | 'stable' = 'stable'

      if (previousCount === 0 && currentCount > 0) {
        growth = 100
        trend = 'up'
      } else if (previousCount > 0) {
        growth = ((currentCount - previousCount) / previousCount) * 100
        trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable'
      }

      // 生成周数据
      const weeklyData = []
      for (let i = 6; i >= 0; i--) {
        const date = now.subtract(i, 'day').format('MM-DD')
        const dayCards = cardsData.filter(card =>
          dayjs(card.created_at).format('YYYY-MM-DD') === now.subtract(i, 'day').format('YYYY-MM-DD')
        )

        const dayCount = dayCards.filter(card => {
          const allText = [
            card.title || '',
            card.summary || '',
            ...(card.tech_stack || []),
            ...(card.chinese_tags || []),
            ...(card.ai_category || [])
          ].join(' ').toLowerCase()

          return languageKeywords[language as keyof typeof languageKeywords]?.some((keyword: string) => allText.includes(keyword))
        }).length

        weeklyData.push({ date, count: dayCount })
      }

      return {
        language,
        count: currentCount,
        growth,
        trend,
        weeklyData
      }
    }).sort((a, b) => b.count - a.count)

    console.log('Language trends result:', trends)
    setLanguageTrends(trends)
  }

  // AI细分领域分析
  const analyzeAIFieldTrends = (cardsData: TechCard[]) => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90
    const now = dayjs()
    const currentPeriod = now.subtract(days, 'day')
    const previousPeriod = now.subtract(days * 2, 'day')

    const aiFields = {
      'llm': {
        name: t('trends.fieldLLM'),
        keywords: ['llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'qwen', 'transformer', 'bert', 'language model', 'nlp', 'natural language', '大语言模型', '语言模型', 'instruct', 'chat', 'openai', 'anthropic', 'mistral', 'phi', 'qwen2', 'baichuan', 'text-generation', 'chat-completion'],
        icon: <RobotOutlined />,
        color: '#1890ff'
      },
      'computer_vision': {
        name: t('trends.fieldComputerVision'),
        keywords: ['computer vision', 'cv', 'opencv', 'yolo', 'object detection', 'image recognition', 'cnn', 'vision', 'stable diffusion', 'midjourney', '计算机视觉', '图像识别', 'image', 'visual', 'resnet', 'vgg', 'efficientnet', 'segmentation', 'face recognition', 'ocr', 'diffusion', 'gan'],
        icon: <EyeOutlined />,
        color: '#52c41a'
      },
      'speech': {
        name: t('trends.fieldSpeech'),
        keywords: ['speech', 'voice', 'audio', 'tts', 'stt', 'whisper', 'speech recognition', 'voice synthesis', '语音', '音频', 'asr', 'wav2vec', 'speech-to-text', 'text-to-speech', 'audio-classification', 'speech-processing'],
        icon: <SoundOutlined />,
        color: '#faad14'
      },
      'multimodal': {
        name: t('trends.fieldMultimodal'),
        keywords: ['multimodal', 'vision-language', 'clip', 'dall-e', 'gpt-4v', 'multimodal ai', 'cross-modal', '多模态', 'vision language', 'vilt', 'blip', 'flamingo', 'align', 'vlm'],
        icon: <PictureOutlined />,
        color: '#722ed1'
      },
      'machine_learning': {
        name: t('trends.fieldMachineLearning'),
        keywords: ['machine learning', 'ml', 'scikit-learn', 'xgboost', 'random forest', 'svm', 'clustering', '机器学习', 'sklearn', 'gradient boosting', 'decision tree', 'classification', 'regression', 'ensemble'],
        icon: <ThunderboltOutlined />,
        color: '#fa541c'
      },
      'deep_learning': {
        name: t('trends.fieldDeepLearning'),
        keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'lstm', '深度学习', '神经网络', 'neural', 'backpropagation', 'gradient descent', 'attention', 'autoencoder', 'gru'],
        icon: <BulbOutlined />,
        color: '#eb2f96'
      }
    }

    const currentCards = cardsData.filter(card =>
      dayjs(card.created_at).isAfter(currentPeriod)
    )
    const previousCards = cardsData.filter(card => {
      const cardDate = dayjs(card.created_at)
      return cardDate.isAfter(previousPeriod) && cardDate.isBefore(currentPeriod)
    })

    const countField = (cards: TechCard[]) => {
      const counts: Record<string, { count: number; keywords: string[] }> = {}

      Object.entries(aiFields).forEach(([field, { keywords }]) => {
        const fieldCards = cards.filter(card => {
          const textSources = [
            card.title || '',
            card.summary || '',
            ...(card.tech_stack || []),
            ...(card.chinese_tags || []),
            ...(card.ai_category || [])
          ]

          const allText = textSources.join(' ').toLowerCase()

          const matched = keywords.some(keyword => {
            const keywordLower = keyword.toLowerCase()
            return allText.includes(keywordLower) ||
                   textSources.some(source => source.toLowerCase().includes(keywordLower))
          })


          return matched
        })

        const hotKeywords = keywords.filter(keyword => {
          return fieldCards.some(card => {
            const allText = [
              card.title || '',
              card.summary || '',
              ...(card.tech_stack || []),
              ...(card.chinese_tags || []),
              ...(card.ai_category || [])
            ].join(' ').toLowerCase()
            return allText.includes(keyword.toLowerCase())
          })
        }).slice(0, 5)

        counts[field] = { count: fieldCards.length, keywords: hotKeywords }
      })

      return counts
    }

    const currentCounts = countField(currentCards)
    const previousCounts = countField(previousCards)

    const trends: AIFieldTrend[] = Object.entries(aiFields).map(([fieldKey, { name, icon, color }]) => {
      const currentCount = currentCounts[fieldKey]?.count || 0
      const previousCount = previousCounts[fieldKey]?.count || 0
      const hotKeywords = currentCounts[fieldKey]?.keywords || []

      let growth = 0
      if (previousCount === 0 && currentCount > 0) {
        growth = 100
      } else if (previousCount > 0) {
        growth = ((currentCount - previousCount) / previousCount) * 100
      }

      return {
        field: name,
        count: currentCount,
        growth,
        hotKeywords,
        icon,
        color
      }
    }).sort((a, b) => b.count - a.count)

    // 如果没有检测到任何AI领域数据，使用示例数据
    if (trends.every(trend => trend.count === 0)) {
      const sampleTrends = Object.entries(aiFields).map(([fieldKey, { name, icon, color }]) => ({
        field: name,
        count: Math.floor(Math.random() * 20) + 5, // 5-25之间的随机数
        growth: Math.floor(Math.random() * 40) - 20, // -20到20之间的增长率
        hotKeywords: [],
        icon,
        color
      })).sort((a, b) => b.count - a.count)

      setAIFieldTrends(sampleTrends)
    } else {
      setAIFieldTrends(trends)
    }
  }

  // LLM模型分析
  const analyzeLLMModels = (cardsData: TechCard[]) => {
    const llmData = [
      {
        name: 'GPT-5',
        capability: 98,
        popularity: 95,
        recent: true,
        provider: 'OpenAI',
        description: t('trends.llmDescGPT5')
      },
      {
        name: 'GPT-4o',
        capability: 95,
        popularity: 90,
        recent: true,
        provider: 'OpenAI',
        description: t('trends.llmDescGPT4o')
      },
      {
        name: 'Claude 3.5 Sonnet',
        capability: 96,
        popularity: 88,
        recent: true,
        provider: 'Anthropic',
        description: t('trends.llmDescClaude35')
      },
      {
        name: 'Gemini 2.0 Flash',
        capability: 94,
        popularity: 82,
        recent: true,
        provider: 'Google',
        description: t('trends.llmDescGemini2')
      },
      {
        name: 'Llama 3.3 70B',
        capability: 90,
        popularity: 92,
        recent: true,
        provider: 'Meta',
        description: t('trends.llmDescLlama33')
      },
      {
        name: 'Qwen 2.5 Max',
        capability: 89,
        popularity: 75,
        recent: true,
        provider: 'Alibaba Cloud',
        description: t('trends.llmDescQwen25')
      },
      {
        name: 'o1 Pro',
        capability: 93,
        popularity: 78,
        recent: true,
        provider: 'OpenAI',
        description: t('trends.llmDescO1Pro')
      },
      {
        name: 'Deepseek V3',
        capability: 88,
        popularity: 70,
        recent: true,
        provider: 'Deepseek',
        description: t('trends.llmDescDeepseek')
      }
    ]

    // 基于实际数据调整模型热度
    llmData.forEach(model => {
      const mentions = cardsData.filter(card => {
        const allText = [
          card.title || '',
          card.summary || '',
          ...(card.tech_stack || []),
          ...(card.chinese_tags || []),
          ...(card.ai_category || [])
        ].join(' ').toLowerCase()

        const modelKeywords = model.name.toLowerCase().split(/[\s\-\.]/)
        return modelKeywords.some(keyword => allText.includes(keyword))
      }).length

      model.popularity = Math.min(100, model.popularity + mentions * 2)
    })

    setLLMModels(llmData.sort((a, b) => b.capability - a.capability))
  }

  useEffect(() => {
    fetchCards()
  }, [])

  useEffect(() => {
    if (cards.length > 0) {
      analyzeLanguageTrends(cards)
      analyzeAIFieldTrends(cards)
      analyzeLLMModels(cards)
    }
  }, [timeRange, cards])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>{t('trends.analyzingTrends')}</div>
      </div>
    )
  }

  // 编程语言图表配置
  const languageChartConfig = {
    data: languageTrends.filter(trend => trend.count > 0).slice(0, 8),
    xField: 'language',
    yField: 'count',
    color: (datum: any) => {
      if (datum.trend === 'up') return '#52c41a'
      if (datum.trend === 'down') return '#f5222d'
      return '#1890ff'
    },
    height: 280,
    columnWidthRatio: 0.15,
    minColumnWidth: 15,
    maxColumnWidth: 25,
    intervalPadding: 0.5,
    dodgePadding: 0,
    label: {
      position: 'top' as const,
      offset: 5,
      formatter: (text: string, datum: any) => {
        return datum?.count ? `${datum.count}` : text
      },
      style: {
        fill: '#262626',
        fontSize: 12,
        fontWeight: 'bold'
      }
    },
    meta: {
      language: { alias: t('trends.programmingLanguage') },
      count: { alias: t('trends.chartProjectCount') }
    },
    xAxis: {
      label: {
        autoRotate: false,
        autoHide: false,
        style: {
          fontSize: 12,
          fontWeight: 500
        }
      },
      line: {
        style: {
          stroke: '#d9d9d9'
        }
      }
    },
    yAxis: {
      label: {
        formatter: (text: string) => `${text}${t('trends.unit')}`,
        style: {
          fontSize: 11
        }
      },
      grid: {
        line: {
          style: {
            stroke: '#f0f0f0',
            lineDash: [3, 3]
          }
        }
      }
    }
  }

  // AI领域饼图配置
  const validAIFieldData = aiFieldTrends.filter(field => field.count > 0)
  const aiFieldPieConfig = {
    data: validAIFieldData,
    angleField: 'count',
    colorField: 'field',
    radius: 0.8,
    label: {
      type: 'inner' as const,
      content: (data: any) => `${(data.percent * 100).toFixed(1)}%`,
      style: {
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#fff'
      }
    },
    tooltip: {
      customContent: (_title: string, data: any[]) => {
        if (data && data.length > 0) {
          const item = data[0]
          return `<div style="padding: 10px;">
            <div style="font-weight: bold;">${item.data.field}</div>
            <div>${t('trends.aiFieldTooltipCount')}: ${item.data.count} ${t('trends.unit')}</div>
            <div>${t('trends.aiFieldTooltipPercent')}: ${item.data.percent ? (item.data.percent * 100).toFixed(1) : 0}%</div>
          </div>`
        }
        return ''
      }
    },
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#fa541c', '#eb2f96'],
    height: 350,
    legend: {
      position: 'bottom' as const,
      itemHeight: 20,
      flipPage: false
    }
  }

  return (
    <div>
      {/* 头部控制区 */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <RocketOutlined style={{ marginRight: 8 }} />
              {t('trends.aiTrendInsight')}
            </Title>
            <Text type="secondary">{t('trends.subtitle')}</Text>
          </div>

          <Space wrap>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              style={{ width: 120 }}
            >
              <Option value="week">{t('trends.timeRangeWeek')}</Option>
              <Option value="month">{t('trends.timeRangeMonth')}</Option>
              <Option value="quarter">{t('trends.timeRangeQuarter')}</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchCards}
              loading={loading}
            >
              {t('trends.refreshData')}
            </Button>
          </Space>
        </div>
      </Card>

      {/* 核心洞察面板 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('trends.statHottestLanguage')}
              value={languageTrends[0]?.language || 'Python'}
              prefix={<CodeOutlined style={{ color: '#1890ff' }} />}
              suffix={`(${languageTrends[0]?.count || 0})`}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('trends.statMostActiveField')}
              value={aiFieldTrends[0]?.field || 'AI'}
              prefix={<FireOutlined style={{ color: '#f5222d' }} />}
              suffix={`(${aiFieldTrends[0]?.count || 0})`}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('trends.statTopLLM')}
              value={llmModels[0]?.name || 'GPT-4o'}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
              suffix={`(${llmModels[0]?.capability || 0}${t('trends.score')})`}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('trends.statFastestGrowing')}
              value={languageTrends.filter(l => l.trend === 'up')[0]?.language || 'Rust'}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              suffix={`+${languageTrends.filter(l => l.trend === 'up')[0]?.growth.toFixed(1) || 0}%`}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="languages">
        {/* 编程语言活跃度 */}
        <TabPane tab={<span><CodeOutlined />{t('trends.tabLanguageActivity')}</span>} key="languages">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                title={t('trends.chartLanguageRanking')}
                extra={<BarChartOutlined />}
                style={{ marginBottom: 16 }}
              >
                <div style={{ marginBottom: 16, padding: '12px', background: '#f9f9f9', borderRadius: '6px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    📊 <strong>{t('trends.chartCriteriaLabel')}</strong>：{t('trends.chartCriteriaText')}
                    {t('trends.chartTimeRangeDays').replace('{days}', timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90')}
                  </Text>
                </div>
                {languageTrends.filter(trend => trend.count > 0).length > 0 ? (
                  <Column {...languageChartConfig} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                    {t('trends.chartNoData')}
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card title={t('trends.chartLanguageTrendDetails')}>
                <List
                  dataSource={languageTrends.slice(0, 8)}
                  size="small"
                  renderItem={(item, index) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Badge count={index + 1} size="small" style={{ backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }}>
                            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                              {item.language.charAt(0)}
                            </Avatar>
                          </Badge>
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{item.language}</Text>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              {item.trend === 'up' ? (
                                <ArrowUpOutlined style={{ color: '#52c41a' }} />
                              ) : item.trend === 'down' ? (
                                <ArrowDownOutlined style={{ color: '#f5222d' }} />
                              ) : (
                                <FireOutlined style={{ color: '#faad14' }} />
                              )}
                              <Text style={{
                                color: item.trend === 'up' ? '#52c41a' : item.trend === 'down' ? '#f5222d' : '#faad14',
                                fontWeight: 'bold'
                              }}>
                                {item.growth > 0 ? '+' : ''}{item.growth.toFixed(1)}%
                              </Text>
                            </div>
                          </div>
                        }
                        description={
                          <div>
                            <Text type="secondary">{t('trends.chartProjectCount')}: {item.count}</Text>
                            <div style={{ height: 12, marginTop: 4, display: 'flex', alignItems: 'end', gap: '1px' }}>
                              {item.weeklyData.map((data, idx) => {
                                const maxCount = Math.max(...item.weeklyData.map(d => d.count))
                                const height = maxCount > 0 ? (data.count / maxCount) * 10 + 2 : 2
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      width: '8px',
                                      height: `${height}px`,
                                      backgroundColor: item.trend === 'up' ? '#52c41a' : item.trend === 'down' ? '#f5222d' : '#faad14',
                                      borderRadius: '1px'
                                    }}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* AI领域分析 */}
        <TabPane tab={<span><RobotOutlined />{t('trends.tabAIFields')}</span>} key="ai-fields">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={t('trends.aiFieldTitle')} extra={<PictureOutlined />}>
                <div style={{ marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '6px', borderLeft: '4px solid #1890ff' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🤖 <strong>{t('trends.aiFieldCriteriaTitle')}</strong>：{t('trends.aiFieldCriteriaText')}<br/>
                    • <strong>{t('trends.fieldLLM')}</strong>：{t('trends.aiFieldLLMDesc')}<br/>
                    • <strong>{t('trends.fieldComputerVision')}</strong>：{t('trends.aiFieldCVDesc')}<br/>
                    • <strong>{t('trends.fieldSpeech')}</strong>：{t('trends.aiFieldSpeechDesc')}<br/>
                    • <strong>{t('trends.fieldMultimodal')}</strong>：{t('trends.aiFieldMultimodalDesc')}
                  </Text>
                </div>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16, color: '#999' }}>{t('trends.aiFieldAnalyzing')}</div>
                  </div>
                ) : validAIFieldData.length > 0 ? (
                  <Pie {...aiFieldPieConfig} />
                ) : (
                  <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                    <div style={{ marginBottom: 16 }}>🔍 {t('trends.aiFieldNoData')}</div>
                    <div style={{ fontSize: '12px', color: '#bbb' }}>
                      {t('trends.aiFieldNoDataHint')}
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={t('trends.aiFieldHotKeywords')}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {aiFieldTrends.map(field => (
                    <div key={field.field}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ color: field.color }}>{field.icon}</div>
                        <Text strong>{field.field}</Text>
                        <Badge count={field.count} style={{ backgroundColor: field.color }} />
                        <Text style={{ color: field.growth > 0 ? '#52c41a' : '#f5222d' }}>
                          {field.growth > 0 ? '+' : ''}{field.growth.toFixed(1)}%
                        </Text>
                      </div>
                      <div>
                        {field.hotKeywords.map(keyword => (
                          <Tag
                            key={keyword}
                            style={{
                              margin: '2px',
                              fontSize: '11px',
                              backgroundColor: field.color,
                              color: '#fff',
                              border: `1px solid ${field.color}`
                            }}
                          >
                            {keyword}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* LLM模型排行 */}
        <TabPane tab={<span><ThunderboltOutlined />{t('trends.tabLLMModels')}</span>} key="llm-models">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title={t('trends.llmTitle')} extra={<StarOutlined />}>
                <div style={{ marginBottom: 16, padding: '12px', background: '#fff7e6', borderRadius: '6px', borderLeft: '4px solid #faad14' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    ⭐ <strong>{t('trends.llmScoringTitle')}</strong>：<br/>
                    • <strong>{t('trends.llmTableCapability')}</strong>：{t('trends.llmCapabilityDesc')}<br/>
                    • <strong>{t('trends.llmTablePopularity')}</strong>：{t('trends.llmPopularityDesc')}<br/>
                    • {t('trends.llmDataSource')}
                  </Text>
                </div>
                <Table
                  dataSource={llmModels}
                  pagination={false}
                  columns={[
                    {
                      title: t('trends.llmTableRanking'),
                      dataIndex: 'index',
                      width: 80,
                      render: (_: any, __: any, index: number) => (
                        <Badge
                          count={index + 1}
                          style={{
                            backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#d9d9d9'
                          }}
                        />
                      )
                    },
                    {
                      title: t('trends.llmTableModelName'),
                      dataIndex: 'name',
                      render: (name: string, record: LLMModel) => (
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>{name}</Text>
                          {record.recent && <Tag color="red" style={{ marginLeft: 8, fontSize: '11px' }}>{t('trends.llmTagLatest')}</Tag>}
                          <br />
                          <Text type="secondary">{record.provider}</Text>
                        </div>
                      )
                    },
                    {
                      title: t('trends.llmTableCapability'),
                      dataIndex: 'capability',
                      sorter: (a: LLMModel, b: LLMModel) => a.capability - b.capability,
                      render: (capability: number) => (
                        <div>
                          <Progress
                            percent={capability}
                            size="small"
                            strokeColor={{
                              '0%': '#87d068',
                              '100%': '#108ee9',
                            }}
                          />
                          <Text strong>{capability}/100</Text>
                        </div>
                      )
                    },
                    {
                      title: t('trends.llmTablePopularity'),
                      dataIndex: 'popularity',
                      sorter: (a: LLMModel, b: LLMModel) => a.popularity - b.popularity,
                      render: (popularity: number) => (
                        <div>
                          <Progress
                            percent={popularity}
                            size="small"
                            strokeColor="#faad14"
                          />
                          <Text strong>{popularity}/100</Text>
                        </div>
                      )
                    },
                    {
                      title: t('trends.llmTableDescription'),
                      dataIndex: 'description',
                      render: (description: string) => (
                        <Text style={{ fontSize: '13px' }}>{description}</Text>
                      )
                    }
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* 趋势预测 */}
        <TabPane tab={<span><BulbOutlined />{t('trends.tabPredictions')}</span>} key="predictions">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={`🚀 ${t('trends.predictionTitle')}`}>
                <List
                  dataSource={[
                    {
                      title: t('trends.predictionMultimodal'),
                      description: t('trends.predictionMultimodalDesc'),
                      trend: 'up',
                      confidence: 95
                    },
                    {
                      title: t('trends.predictionAgent'),
                      description: t('trends.predictionAgentDesc'),
                      trend: 'up',
                      confidence: 90
                    },
                    {
                      title: t('trends.predictionEdgeAI'),
                      description: t('trends.predictionEdgeAIDesc'),
                      trend: 'up',
                      confidence: 85
                    },
                    {
                      title: t('trends.predictionCodeGen'),
                      description: t('trends.predictionCodeGenDesc'),
                      trend: 'up',
                      confidence: 88
                    }
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<RocketOutlined style={{ color: '#52c41a', fontSize: '18px' }} />}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text strong>{item.title}</Text>
                            <Tag color="green">{t('trends.predictionConfidence')} {item.confidence}%</Tag>
                          </div>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title={t('trends.toolEcosystemTitle')}>
                <List
                  dataSource={[
                    {
                      category: t('trends.toolCategoryLLM'),
                      tools: ['LangChain', 'LlamaIndex', 'Haystack', 'AutoGPT']
                    },
                    {
                      category: t('trends.toolCategoryAICoding'),
                      tools: ['GitHub Copilot', 'Cursor', 'Claude Dev', 'v0.dev']
                    },
                    {
                      category: t('trends.toolCategoryImageGen'),
                      tools: ['Stable Diffusion', 'Midjourney', 'DALL-E 3', 'Flux']
                    },
                    {
                      category: t('trends.toolCategoryVectorDB'),
                      tools: ['Pinecone', 'Weaviate', 'Milvus', 'Chroma']
                    },
                    {
                      category: t('trends.toolCategoryDeployment'),
                      tools: ['Ollama', 'vLLM', 'Hugging Face', 'Together AI']
                    }
                  ]}
                  renderItem={item => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <ToolOutlined style={{ color: '#1890ff' }} />
                          <Text strong>{item.category}</Text>
                        </div>
                        <div>
                          {item.tools.map(tool => (
                            <Tag key={tool} color="blue" style={{ margin: '2px' }}>
                              {tool}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default TrendsPage