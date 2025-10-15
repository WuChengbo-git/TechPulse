import React from 'react'
import { Card, Tag, Space, Typography, Badge, Button } from 'antd'
import { StarOutlined, LinkOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, HeartOutlined, EyeOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import QualityBadge from './QualityBadge'

const { Text, Paragraph } = Typography

interface RecommendationCardData {
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
  reason: string
  matched_tags: string[]
}

interface RecommendationCardProps {
  data: RecommendationCardData
  onCardClick?: (cardId: number) => void
  onFavorite?: (cardId: number) => void
}

const getSourceIcon = (source: string) => {
  switch (source.toLowerCase()) {
    case 'github':
      return <GithubOutlined />
    case 'arxiv':
      return <FileTextOutlined />
    case 'huggingface':
      return <RobotOutlined />
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

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  data,
  onCardClick,
  onFavorite
}) => {
  const { t } = useLanguage()

  return (
    <Card
      hoverable
      size="small"
      style={{ marginBottom: 12 }}
      onClick={() => onCardClick && onCardClick(data.card.id)}
    >
      {/* 头部：来源 + 质量分 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Space size={4}>
          <Badge
            count={getSourceIcon(data.card.source)}
            style={{ backgroundColor: getSourceColor(data.card.source), fontSize: 10 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {data.card.source.toUpperCase()}
          </Text>
        </Space>

        {data.card.quality_score && (
          <QualityBadge score={data.card.quality_score} size="small" />
        )}
      </div>

      {/* 标题 */}
      <div style={{ marginBottom: 8 }}>
        <Text strong style={{ fontSize: 14, display: 'block', lineHeight: 1.4 }}>
          {data.card.title}
        </Text>
      </div>

      {/* 推荐理由 */}
      <div style={{ marginBottom: 8 }}>
        <Tag color="blue" style={{ fontSize: 11, marginBottom: 0 }}>
          💡 {data.reason}
        </Tag>
      </div>

      {/* 匹配的标签 */}
      {data.matched_tags && data.matched_tags.length > 0 && (
        <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
          {data.matched_tags.map((tag, index) => (
            <Tag key={index} color="orange" style={{ fontSize: 11, margin: 0 }}>
              {tag}
            </Tag>
          ))}
        </Space>
      )}

      {/* 摘要 */}
      {data.card.summary && (
        <Paragraph
          ellipsis={{ rows: 2 }}
          style={{ marginBottom: 8, fontSize: 12, color: '#666' }}
        >
          {data.card.summary}
        </Paragraph>
      )}

      {/* 底部操作 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(data.card.created_at).toLocaleDateString('zh-CN')}
        </Text>

        <Space size={8}>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              window.open(data.card.original_url, '_blank')
            }}
            style={{ fontSize: 11, padding: '0 4px' }}
          />
          <Button
            type="text"
            size="small"
            icon={<HeartOutlined />}
            onClick={(e) => {
              e.stopPropagation()
              onFavorite && onFavorite(data.card.id)
            }}
            style={{ fontSize: 11, padding: '0 4px' }}
          />
        </Space>
      </div>
    </Card>
  )
}

export default RecommendationCard
