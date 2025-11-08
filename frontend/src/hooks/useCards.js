import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
/**
 * 获取卡片列表（带分页）
 */
export function useCards(options = {}) {
    const { source, quality_min, limit = 20, tags } = options;
    return useInfiniteQuery({
        queryKey: ['cards', source, quality_min, tags],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({
                skip: String((pageParam - 1) * limit),
                limit: String(limit),
            });
            if (source)
                params.append('source', source);
            if (quality_min !== undefined)
                params.append('quality_min', String(quality_min));
            if (tags && tags.length > 0) {
                tags.forEach(tag => params.append('tags', tag));
            }
            const response = await fetch(`/api/v1/cards?${params}`);
            if (!response.ok)
                throw new Error('Failed to fetch cards');
            const data = await response.json();
            return {
                cards: data,
                total: data.length,
                page: pageParam,
                page_size: limit,
                has_more: data.length === limit,
            };
        },
        getNextPageParam: (lastPage) => {
            return lastPage.has_more ? lastPage.page + 1 : undefined;
        },
        initialPageParam: 1,
    });
}
/**
 * 获取高质量内容
 */
export function useHighQualityCards(limit = 10) {
    return useQuery({
        queryKey: ['cards', 'high-quality', limit],
        queryFn: async () => {
            const response = await fetch(`/api/v1/cards?quality_min=7.0&limit=${limit}`);
            if (!response.ok)
                throw new Error('Failed to fetch high quality cards');
            return response.json();
        },
    });
}
/**
 * 获取热门标签
 */
export function useHotTags(limit = 20) {
    return useQuery({
        queryKey: ['tags', 'hot', limit],
        queryFn: async () => {
            const response = await fetch(`/api/v1/cards/tags/hot?limit=${limit}`);
            if (!response.ok)
                throw new Error('Failed to fetch hot tags');
            return response.json();
        },
    });
}
/**
 * 获取统计数据
 */
export function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const response = await fetch('/api/v1/cards/stats');
            if (!response.ok)
                throw new Error('Failed to fetch stats');
            return response.json();
        },
    });
}
