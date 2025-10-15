import React from 'react'
import { List, Card, Tag, Space, Typography, Empty, Badge } from 'antd'
import { GithubOutlined, FileTextOutlined, RobotOutlined, LinkOutlined, StarOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import QualityBadge from './QualityBadge'

const { Text, Paragraph, Title } = Typography

interface SearchResult {
  card: {
    id: number
    title: string
    source: string
    original_url: string
    summary?: string
    chinese_tags?: string[]
    quality_score?: number
    created_at: string
  }
  score: number
  highlights: string[]
  reason: string
}

interface SearchResultListProps {
  results: SearchResult[]
  loading?: boolean
  intent?: 'query' | 'analyze'
  totalCount?: number
  onCardClick?: (cardId: number) => void
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'github':
      return <GithubOutlined style={{ color: '#333' }} />
    case 'arxiv':
      return <FileTextOutlined style={{ color: '#b31b1b' }} />
    case 'huggingface':
      return <RobotOutlined style={{ color: '#ff9d00' }} />
    default:
      return <LinkOutlined />
  }
}

const getSourceColor = (source: string) => {
  switch (source.toLowerCase()) {
    case 'github':
      return '#333'
    case 'arxiv':
      return '#b31b1b'
    case 'huggingface':
      return '#ff9d00'
    case 'zenn':
      return '#3ea8ff'
    default:
      return '#1890ff'
  }
}

export const SearchResultList: React.FC<SearchResultListProps> = ({
  results,
  loading = false,
  intent,
  totalCount,
  onCardClick
}) => {
  const { t } = useLanguage()

  if (!loading && results.length === 0) {
    return (
      <Empty
        description={t('search.noResults') || '没有找到相关内容'}
        style={{ padding: '40px 0' }}
      />
    )
  }

  return (
    <div className="search-result-list">
      {/* 搜索结果头部 */}
      {totalCount !== undefined && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">
            {t('search.foundResults') || '找到'} <strong>{totalCount}</strong> {t('search.results') || '条结果'}
          </Text>
          {intent && (
            <Tag color={intent === 'analyze' ? 'blue' : 'green'}>
              {intent === 'analyze' ? '🧠 分析模式' : '🔍 查询模式'}
            </Tag>
          )}
        </div>
      )}

      {/* 结果列表 */}
      <List
        loading={loading}
        itemLayout="vertical"
        dataSource={results}
        renderItem={(result) => (
          <Card
            hoverable
            style={{ marginBottom: 16, cursor: 'pointer' }}
            onClick={() => onCardClick && onCardClick(result.card.id)}
          >
            {/* 卡片头部 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <Space>
                <Badge
                  count={getSourceIcon(result.card.source)}
                  style={{ backgroundColor: getSourceColor(result.card.source) }}
                />
                <Tag color={getSourceColor(result.card.source)}>
                  {result.card.source.toUpperCase()}
                </Tag>
                {result.card.quality_score && (
                  <QualityBadge score={result.card.quality_score} />
                )}
              </Space>

              {/* 相关度分数 */}
              <Tag color="gold" icon={<StarOutlined />}>
                {t('search.relevance') || '相关度'}: {(result.score * 100).toFixed(0)}%
              </Tag>
            </div>

            {/* 标题 */}
            <Title level={5} style={{ marginBottom: 8, marginTop: 0 }}>
              {result.card.title}
            </Title>

            {/* 匹配理由 */}
            {result.reason && (
              <div style={{ marginBottom: 12 }}>
                <Tag color="blue" style={{ marginBottom: 8 }}>
                  💡 {result.reason}
                </Tag>
              </div>
            )}

            {/* 摘要 */}
            {result.card.summary && (
              <Paragraph
                ellipsis={{ rows: 2, expandable: true, symbol: t('common.more') || '更多' }}
                style={{ marginBottom: 12, color: '#666' }}
              >
                {result.card.summary}
              </Paragraph>
            )}

            {/* 标签 */}
            {result.card.chinese_tags && result.card.chinese_tags.length > 0 && (
              <Space size={[8, 8]} wrap>
                {result.card.chinese_tags.slice(0, 5).map((tag, index) => {
                  const isHighlighted = result.highlights.some(h => h.includes(tag))
                  return (
                    <Tag
                      key={index}
                      color={isHighlighted ? 'orange' : 'default'}
                      style={isHighlighted ? { fontWeight: 'bold' } : {}}
                    >
                      {tag}
                    </Tag>
                  )
                })}
              </Space>
            )}

            {/* 底部元信息 */}
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(result.card.created_at).toLocaleDateString('zh-CN')}
              </Text>
            </div>
          </Card>
        )}
      />
    </div>
  )
}

export default SearchResultList
