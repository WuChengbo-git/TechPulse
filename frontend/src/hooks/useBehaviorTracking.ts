/**
 * 用户行为追踪 Hook
 * 提供便捷的方法在 React 组件中追踪用户行为
 */
import { useEffect, useRef, useCallback, useState } from 'react'
import behaviorTrackingService, { ActionType } from '../services/behaviorTrackingService'

/**
 * 使用行为追踪的 Hook
 */
export function useBehaviorTracking() {
  return {
    logCardClick: behaviorTrackingService.logCardClick.bind(behaviorTrackingService),
    logCardView: behaviorTrackingService.logCardView.bind(behaviorTrackingService),
    logFavorite: behaviorTrackingService.logFavorite.bind(behaviorTrackingService),
    logUnfavorite: behaviorTrackingService.logUnfavorite.bind(behaviorTrackingService),
    logSearch: behaviorTrackingService.logSearch.bind(behaviorTrackingService),
    logShare: behaviorTrackingService.logShare.bind(behaviorTrackingService),
    createSearchHistory: behaviorTrackingService.createSearchHistory.bind(behaviorTrackingService)
  }
}

/**
 * 自动追踪卡片浏览时长的 Hook
 * @param cardId 卡片ID
 * @param enabled 是否启用追踪
 */
export function useCardViewTracking(cardId: number | null, enabled: boolean = true) {
  const startTimeRef = useRef<number | null>(null)
  const trackedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !cardId) return

    // 记录开始时间
    startTimeRef.current = Date.now()
    trackedRef.current = false

    // 清理函数：组件卸载或 cardId 变化时记录浏览时长
    return () => {
      if (startTimeRef.current && !trackedRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)

        // 只记录一次，避免重复
        trackedRef.current = true

        // 异步记录，不阻塞组件卸载
        behaviorTrackingService.logCardView(cardId, duration).catch(() => {
          // 静默失败
        })
      }
    }
  }, [cardId, enabled])

  // 手动记录浏览时长（例如用户主动关闭详情页）
  const recordView = useCallback(() => {
    if (startTimeRef.current && cardId && !trackedRef.current) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
      trackedRef.current = true
      behaviorTrackingService.logCardView(cardId, duration)
    }
  }, [cardId])

  return { recordView }
}

/**
 * 搜索行为追踪 Hook
 */
export function useSearchTracking() {
  const logSearch = useCallback((query: string, mode: string = 'keyword') => {
    behaviorTrackingService.logSearch(query, mode)
  }, [])

  const createSearchHistory = useCallback(
    (query: string, mode: string, resultsCount: number, intent?: string) => {
      behaviorTrackingService.createSearchHistory(query, mode, resultsCount, intent)
    },
    []
  )

  return { logSearch, createSearchHistory }
}

/**
 * 获取用户行为统计的 Hook
 * @param days 统计天数
 */
export function useUserBehaviorStats(days: number = 30) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      const data = await behaviorTrackingService.getUserStats(days)
      setStats(data)
      setLoading(false)
    }

    fetchStats()
  }, [days])

  return { stats, loading }
}

// 导出默认 hook
export default useBehaviorTracking
