import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Input, Button, AutoComplete, Space, Tag, Segmented, Spin } from 'antd';
import { SearchOutlined, RobotOutlined, ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import './SmartSearch.css';
const { Search } = Input;
export const SmartSearch = ({ onSearch, loading = false, placeholder }) => {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState('keyword');
    const [options, setOptions] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const debounceTimer = useRef();
    // 加载搜索历史
    useEffect(() => {
        const history = localStorage.getItem('search_history');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);
    // 保存搜索历史
    const saveSearchHistory = (searchQuery) => {
        const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
        setSearchHistory(newHistory);
        localStorage.setItem('search_history', JSON.stringify(newHistory));
    };
    // 清除搜索历史
    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('search_history');
    };
    // 自动补全
    const handleSearch = (value) => {
        setQuery(value);
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        if (!value.trim()) {
            setOptions([]);
            return;
        }
        debounceTimer.current = setTimeout(async () => {
            try {
                // 获取自动补全建议
                const response = await fetch(`/api/v1/search/autocomplete?q=${encodeURIComponent(value)}&limit=5`);
                if (response.ok) {
                    const suggestions = await response.json();
                    // 构建选项列表
                    const newOptions = [];
                    // 添加搜索历史
                    const matchedHistory = searchHistory
                        .filter(h => h.toLowerCase().includes(value.toLowerCase()))
                        .slice(0, 3);
                    matchedHistory.forEach(h => {
                        newOptions.push({
                            value: h,
                            type: 'history',
                            label: (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(ClockCircleOutlined, { style: { color: '#999' } }), _jsx("span", { children: h })] }))
                        });
                    });
                    // 添加API返回的建议
                    suggestions.forEach((sug) => {
                        newOptions.push({
                            value: sug.text,
                            type: sug.type,
                            label: (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [sug.icon && _jsx("span", { children: sug.icon }), _jsx("span", { children: sug.text })] }))
                        });
                    });
                    setOptions(newOptions);
                }
            }
            catch (error) {
                console.error('Autocomplete error:', error);
            }
        }, 300);
    };
    // 执行搜索
    const handleSubmit = (value) => {
        const searchQuery = value || query;
        if (!searchQuery.trim())
            return;
        saveSearchHistory(searchQuery);
        onSearch(searchQuery, mode);
    };
    // 模式切换
    const handleModeChange = (value) => {
        setMode(value);
    };
    // 热门搜索词
    const popularSearches = [
        t('trends.suggestionDeepLearning'),
        t('trends.suggestionTransformer'),
        t('trends.suggestionFastAPI'),
        t('trends.suggestionLLM'),
        t('trends.suggestionAgent')
    ];
    return (_jsx("div", { className: "smart-search-container", children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, size: "middle", children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Segmented, { options: [
                                { label: t('search.keywordMode') || '关键词', value: 'keyword', icon: _jsx(SearchOutlined, {}) },
                                { label: t('search.aiMode') || 'AI问答', value: 'ai', icon: _jsx(RobotOutlined, {}) }
                            ], value: mode, onChange: handleModeChange }), searchHistory.length > 0 && (_jsx(Button, { type: "text", size: "small", icon: _jsx(CloseCircleOutlined, {}), onClick: clearSearchHistory, children: t('search.clearHistory') || '清除历史' }))] }), _jsx(AutoComplete, { value: query, options: options, style: { width: '100%' }, onSearch: handleSearch, onSelect: handleSubmit, notFoundContent: null, children: _jsx(Search, { placeholder: placeholder ||
                            (mode === 'keyword'
                                ? (t('search.keywordPlaceholder') || '搜索技术内容...')
                                : (t('search.aiPlaceholder') || '问我任何技术问题...')), allowClear: true, enterButton: loading ? _jsx(Spin, { size: "small" }) : (mode === 'keyword'
                            ? _jsx(SearchOutlined, {})
                            : _jsx(RobotOutlined, {})), size: "large", onSearch: handleSubmit, loading: loading }) }), !query && (_jsx("div", { className: "search-suggestions", children: _jsxs(Space, { size: [8, 8], wrap: true, children: [_jsxs("span", { style: { color: '#999', fontSize: 13 }, children: ["\uD83D\uDCA1 ", t('search.trySuggestions') || '试试这些', ":"] }), popularSearches.map(keyword => (_jsx(Tag, { style: { cursor: 'pointer' }, onClick: () => {
                                    setQuery(keyword);
                                    handleSubmit(keyword);
                                }, children: keyword }, keyword)))] }) })), mode === 'ai' && (_jsx("div", { className: "ai-mode-hints", children: _jsxs(Space, { direction: "vertical", size: 4, children: [_jsxs("span", { style: { color: '#999', fontSize: 12 }, children: ["\uD83E\uDD16 ", t('search.aiHints') || 'AI模式示例', ":"] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["\u2022 ", t('search.aiExample1') || '今天LLM有什么新突破？'] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["\u2022 ", t('search.aiExample2') || '推荐一些AI Agent框架'] }), _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["\u2022 ", t('search.aiExample3') || '什么是LoRA量化技术？'] })] }) }))] }) }));
};
export default SmartSearch;
