/**
 * 用户行为追踪服务
 * 用于记录用户在应用中的各种交互行为
 */
import api from '../utils/api';
// 行为类型枚举
export var ActionType;
(function (ActionType) {
    ActionType["CLICK"] = "click";
    ActionType["FAVORITE"] = "favorite";
    ActionType["UNFAVORITE"] = "unfavorite";
    ActionType["SEARCH"] = "search";
    ActionType["VIEW"] = "view";
    ActionType["SHARE"] = "share"; // 分享
})(ActionType || (ActionType = {}));
class BehaviorTrackingService {
    constructor() {
        // 是否启用追踪（可通过用户设置控制）
        Object.defineProperty(this, "enabled", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
    }
    /**
     * 设置追踪开关
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    /**
     * 获取当前用户ID
     */
    getUserId() {
        const userStr = localStorage.getItem('techpulse_user') || sessionStorage.getItem('techpulse_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.id || null;
            }
            catch {
                return null;
            }
        }
        return null;
    }
    /**
     * 记录用户行为（通用方法）
     */
    async logBehavior(behavior) {
        if (!this.enabled)
            return;
        const userId = this.getUserId();
        if (!userId)
            return;
        try {
            const fullBehavior = {
                user_id: userId,
                action: behavior.action,
                card_id: behavior.card_id,
                query: behavior.query,
                duration: behavior.duration,
                search_mode: behavior.search_mode,
                metadata: behavior.metadata
            };
            await api.post('/api/v1/behavior/log', fullBehavior);
        }
        catch (error) {
            // 静默失败，不影响用户体验
            console.debug('Failed to log behavior:', error);
        }
    }
    /**
     * 记录卡片点击
     */
    async logCardClick(cardId) {
        await this.logBehavior({
            action: ActionType.CLICK,
            card_id: cardId
        });
    }
    /**
     * 记录卡片浏览（停留时长）
     */
    async logCardView(cardId, duration) {
        // 只记录停留超过3秒的浏览
        if (duration >= 3) {
            await this.logBehavior({
                action: ActionType.VIEW,
                card_id: cardId,
                duration
            });
        }
    }
    /**
     * 记录收藏操作
     */
    async logFavorite(cardId) {
        await this.logBehavior({
            action: ActionType.FAVORITE,
            card_id: cardId
        });
    }
    /**
     * 记录取消收藏
     */
    async logUnfavorite(cardId) {
        await this.logBehavior({
            action: ActionType.UNFAVORITE,
            card_id: cardId
        });
    }
    /**
     * 记录搜索行为
     */
    async logSearch(query, mode = 'keyword') {
        await this.logBehavior({
            action: ActionType.SEARCH,
            query,
            search_mode: mode
        });
    }
    /**
     * 记录分享操作
     */
    async logShare(cardId, platform) {
        await this.logBehavior({
            action: ActionType.SHARE,
            card_id: cardId,
            metadata: platform ? JSON.stringify({ platform }) : undefined
        });
    }
    /**
     * 创建搜索历史记录
     */
    async createSearchHistory(query, mode, resultsCount, intent) {
        const userId = this.getUserId();
        if (!userId || !this.enabled)
            return;
        try {
            const searchHistory = {
                user_id: userId,
                query,
                mode,
                results_count: resultsCount,
                intent
            };
            await api.post('/api/v1/behavior/search-history', searchHistory);
        }
        catch (error) {
            console.debug('Failed to create search history:', error);
        }
    }
    /**
     * 获取用户行为统计
     */
    async getUserStats(days = 30) {
        const userId = this.getUserId();
        if (!userId)
            return null;
        try {
            const response = await api.get(`/api/v1/behavior/stats/${userId}`, {
                params: { days }
            });
            return response.data;
        }
        catch (error) {
            console.error('Failed to get user stats:', error);
            return null;
        }
    }
    /**
     * 获取搜索历史
     */
    async getSearchHistory(limit = 20) {
        const userId = this.getUserId();
        if (!userId)
            return [];
        try {
            const response = await api.get(`/api/v1/behavior/search-history/${userId}`, {
                params: { limit }
            });
            return response.data;
        }
        catch (error) {
            console.error('Failed to get search history:', error);
            return [];
        }
    }
    /**
     * 清除搜索历史
     */
    async clearSearchHistory() {
        const userId = this.getUserId();
        if (!userId)
            return false;
        try {
            await api.delete(`/api/v1/behavior/search-history/${userId}`);
            return true;
        }
        catch (error) {
            console.error('Failed to clear search history:', error);
            return false;
        }
    }
    /**
     * 获取热门搜索词
     */
    async getPopularSearches(limit = 10, days = 7) {
        try {
            const response = await api.get('/api/v1/behavior/popular-searches', {
                params: { limit, days }
            });
            return response.data;
        }
        catch (error) {
            console.error('Failed to get popular searches:', error);
            return [];
        }
    }
}
export default new BehaviorTrackingService();
