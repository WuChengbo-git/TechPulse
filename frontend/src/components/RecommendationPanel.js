import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card, Button, Empty, Spin, Space, Typography, message } from 'antd';
import { ReloadOutlined, BulbOutlined, SettingOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import RecommendationCard from './RecommendationCard';
const { Title, Text } = Typography;
export const RecommendationPanel = ({ userId = 1, // 默认用户ID
limit = 10, onCardClick }) => {
    const { t } = useLanguage();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userTags, setUserTags] = useState([]);
    const [excludedIds, setExcludedIds] = useState([]);
    // 加载推荐
    const loadRecommendations = async (refresh = false) => {
        setLoading(true);
        try {
            let url = `/api/v1/recommendations?user_id=${userId}&limit=${limit}`;
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
                });
                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data.recommendations || []);
                    // 更新排除列表
                    const newIds = data.recommendations.map((r) => r.card.id);
                    setExcludedIds([...excludedIds, ...newIds]);
                }
            }
            else {
                // 首次加载
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data.recommendations || []);
                    setUserTags(data.user_tags || []);
                    // 初始化排除列表
                    const ids = data.recommendations.map((r) => r.card.id);
                    setExcludedIds(ids);
                }
            }
        }
        catch (error) {
            console.error('Failed to load recommendations:', error);
            message.error(t('recommendation.loadError') || '加载推荐失败');
        }
        finally {
            setLoading(false);
        }
    };
    // 初始加载
    useEffect(() => {
        loadRecommendations();
    }, [userId]);
    // 处理卡片点击
    const handleCardClick = async (cardId) => {
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
            });
        }
        catch (error) {
            console.error('Failed to log behavior:', error);
        }
        // 触发回调
        onCardClick && onCardClick(cardId);
    };
    // 处理收藏
    const handleFavorite = async (cardId) => {
        try {
            await fetch('/api/v1/behavior/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    action: 'favorite',
                    card_id: cardId
                })
            });
            message.success(t('recommendation.favoriteSuccess') || '已收藏');
        }
        catch (error) {
            console.error('Failed to favorite:', error);
            message.error(t('recommendation.favoriteError') || '收藏失败');
        }
    };
    // 刷新推荐
    const handleRefresh = () => {
        loadRecommendations(true);
    };
    // 无推荐时的提示
    if (!loading && recommendations.length === 0) {
        return (_jsx(Card, { title: _jsxs(Space, { children: [_jsx(BulbOutlined, {}), _jsx("span", { children: t('recommendation.title') || '为你推荐' })] }), children: _jsx(Empty, { description: _jsxs("div", { children: [_jsx(Text, { type: "secondary", children: t('recommendation.noPreferences') || '还没有设置兴趣标签' }), _jsx("div", { style: { marginTop: 12 }, children: _jsx(Button, { type: "primary", icon: _jsx(SettingOutlined, {}), onClick: () => {
                                    // TODO: 打开设置页面
                                    message.info(t('recommendation.goToSettings') || '请前往设置页面设置兴趣标签');
                                }, children: t('recommendation.setPreferences') || '设置兴趣' }) })] }) }) }));
    }
    return (_jsxs(Card, { title: _jsxs(Space, { children: [_jsx(BulbOutlined, {}), _jsx("span", { children: t('recommendation.title') || '为你推荐' })] }), extra: _jsx(Button, { type: "text", icon: _jsx(ReloadOutlined, {}), onClick: handleRefresh, loading: loading, size: "small", children: t('recommendation.refresh') || '换一批' }), bodyStyle: { padding: '12px' }, children: [userTags.length > 0 && (_jsx("div", { style: { marginBottom: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: 4 }, children: _jsxs(Text, { type: "secondary", style: { fontSize: 12 }, children: ["\uD83C\uDFAF ", t('recommendation.yourInterests') || '你的兴趣', ": ", userTags.join(', ')] }) })), _jsx(Spin, { spinning: loading, children: _jsx("div", { style: { maxHeight: '600px', overflowY: 'auto' }, children: recommendations.map((rec) => (_jsx(RecommendationCard, { data: rec, onCardClick: handleCardClick, onFavorite: handleFavorite }, rec.card.id))) }) }), !loading && recommendations.length > 0 && (_jsx("div", { style: { textAlign: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: 12 }, children: ["\uD83D\uDCA1 ", t('recommendation.hint') || '推荐基于你的兴趣标签和历史行为'] }) }))] }));
};
export default RecommendationPanel;
