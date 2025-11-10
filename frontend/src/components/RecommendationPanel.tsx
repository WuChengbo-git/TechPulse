import React, { useEffect, useState } from 'react'
import { Card, Button, Empty, Spin, Space, Typography, message } from 'antd'
import { ReloadOutlined, BulbOutlined, SettingOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import RecommendationCard from './RecommendationCard'
import { translateTags } from '../utils/translateTags'

const { Text } = Typography

interface RecommendationData {
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

interface RecommendationPanelProps {
  userId?: number
  limit?: number
  onCardClick?: (cardId: number) => void
}

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  userId = 1, // 默认用户ID
  limit = 10,
  onCardClick
}) => {
  const { t, language } = useLanguage()
  const [recommendations, setRecommendations] = useState<RecommendationData[]>([])
  const [loading, setLoading] = useState(false)
  const [userTags, setUserTags] = useState<string[]>([])
  const [translatedUserTags, setTranslatedUserTags] = useState<string[]>([])
  const [excludedIds, setExcludedIds] = useState<number[]>([])

  // 加载推荐
  const loadRecommendations = async (refresh = false) => {
    setLoading(true)
    try {
      let url = `/api/v1/recommendations?user_id=${userId}&limit=${limit}`

      if (refresh && excludedIds.length > 0) {
        // 刷新模式：排除已显示的
        const response = await fetch('/api/v1/recommendations/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            exclude_ids: excludedIds,
            limit
          })
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])

          // 更新排除列表
          const newIds = data.recommendations.map((r: RecommendationData) => r.card.id)
          setExcludedIds([...excludedIds, ...newIds])
        }
      } else {
        // 首次加载
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])
          setUserTags(data.user_tags || [])

          // 初始化排除列表
          const ids = data.recommendations.map((r: RecommendationData) => r.card.id)
          setExcludedIds(ids)
        }
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      message.error(t('recommendation.loadError') || '加载推荐失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadRecommendations()
  }, [userId])

  // 翻译用户标签
  useEffect(() => {
    const translateUserTagsAsync = async () => {
      if (userTags.length > 0 && language !== 'zh-CN') {
        try {
          const translated = await translateTags(userTags, language as 'en-US' | 'ja-JP' | 'zh-CN')
          setTranslatedUserTags(translated)
        } catch (error) {
          console.error('Failed to translate user tags:', error)
          setTranslatedUserTags(userTags)
        }
      } else {
        setTranslatedUserTags(userTags)
      }
    }

    translateUserTagsAsync()
  }, [userTags, language])

  // 处理卡片点击
  const handleCardClick = async (cardId: number) => {
    // 记录行为
    try {
      await fetch('/api/v1/behavior/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'click',
          card_id: cardId
        })
      })
    } catch (error) {
      console.error('Failed to log behavior:', error)
    }

    // 触发回调
    onCardClick && onCardClick(cardId)
  }

  // 处理收藏
  const handleFavorite = async (cardId: number) => {
    try {
      await fetch('/api/v1/behavior/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          action: 'favorite',
          card_id: cardId
        })
      })
      message.success(t('recommendation.favoriteSuccess') || '已收藏')
    } catch (error) {
      console.error('Failed to favorite:', error)
      message.error(t('recommendation.favoriteError') || '收藏失败')
    }
  }

  // 刷新推荐
  const handleRefresh = () => {
    loadRecommendations(true)
  }

  // 无推荐时的提示
  if (!loading && recommendations.length === 0) {
    return (
      <Card
        title={
          <Space>
            <BulbOutlined />
            <span>{t('recommendation.title') || '为你推荐'}</span>
          </Space>
        }
      >
        <Empty
          description={
            <div>
              <Text type="secondary">
                {t('recommendation.noPreferences') || '还没有设置兴趣标签'}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => {
                    // TODO: 打开设置页面
                    message.info(t('recommendation.goToSettings') || '请前往设置页面设置兴趣标签')
                  }}
                >
                  {t('recommendation.setPreferences') || '设置兴趣'}
                </Button>
              </div>
            </div>
          }
        />
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <BulbOutlined />
          <span>{t('recommendation.title') || '为你推荐'}</span>
        </Space>
      }
      extra={
        <Button
          type="text"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
          size="small"
        >
          {t('recommendation.refresh') || '换一批'}
        </Button>
      }
      bodyStyle={{ padding: '12px' }}
    >
      {/* 用户兴趣标签 */}
      {translatedUserTags.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: 4 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            🎯 {t('recommendation.yourInterests') || '你的兴趣'}: {translatedUserTags.join(', ')}
          </Text>
        </div>
      )}

      {/* 推荐列表 */}
      <Spin spinning={loading}>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.card.id}
              data={rec}
              onCardClick={handleCardClick}
              onFavorite={handleFavorite}
            />
          ))}
        </div>
      </Spin>

      {/* 底部提示 */}
      {!loading && recommendations.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 {t('recommendation.hint') || '推荐基于你的兴趣标签和历史行为'}
          </Text>
        </div>
      )}
    </Card>
  )
}

export default RecommendationPanel
