import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { TechCard } from '../types/card'

interface CardsResponse {
  cards: TechCard[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

interface UseCardsOptions {
  source?: string
  quality_min?: number
  limit?: number
  tags?: string[]
}

/**
 * 获取卡片列表（带分页）
 */
export function useCards(options: UseCardsOptions = {}) {
  const { source, quality_min, limit = 20, tags } = options

  return useInfiniteQuery<CardsResponse>({
    queryKey: ['cards', source, quality_min, tags],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        skip: String((pageParam as number - 1) * limit),
        limit: String(limit),
      })

      if (source) params.append('source', source)
      if (quality_min !== undefined) params.append('quality_min', String(quality_min))
      if (tags && tags.length > 0) {
        tags.forEach(tag => params.append('tags', tag))
      }

      const response = await fetch(`/api/v1/cards?${params}`)
      if (!response.ok) throw new Error('Failed to fetch cards')

      const data = await response.json()
      return {
        cards: data,
        total: data.length,
        page: pageParam as number,
        page_size: limit,
        has_more: data.length === limit,
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.has_more ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

/**
 * 获取高质量内容
 */
export function useHighQualityCards(limit = 10) {
  return useQuery<TechCard[]>({
    queryKey: ['cards', 'high-quality', limit],
    queryFn: async () => {
      const response = await fetch(`/api/v1/cards?quality_min=7.0&limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch high quality cards')
      return response.json()
    },
  })
}

/**
 * 获取热门标签
 */
export function useHotTags(limit = 20) {
  return useQuery<Array<{ tag: string; count: number }>>({
    queryKey: ['tags', 'hot', limit],
    queryFn: async () => {
      const response = await fetch(`/api/v1/cards/tags/hot?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch hot tags')
      return response.json()
    },
  })
}

/**
 * 获取统计数据
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const response = await fetch('/api/v1/cards/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
  })
}
