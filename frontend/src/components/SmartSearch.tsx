import React, { useState, useEffect, useRef } from 'react'
import { Input, Button, AutoComplete, Space, Tag, Segmented, Spin } from 'antd'
import { SearchOutlined, RobotOutlined, ClockCircleOutlined, TagOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import './SmartSearch.css'

const { Search } = Input

interface SearchOption {
  value: string
  label: React.ReactNode
  type: 'history' | 'tag' | 'suggestion'
}

interface SmartSearchProps {
  onSearch: (query: string, mode: 'keyword' | 'ai') => void
  loading?: boolean
  placeholder?: string
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onSearch,
  loading = false,
  placeholder
}) => {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'keyword' | 'ai'>('keyword')
  const [options, setOptions] = useState<SearchOption[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const debounceTimer = useRef<NodeJS.Timeout>()

  // 加载搜索历史
  useEffect(() => {
    const history = localStorage.getItem('search_history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (searchQuery: string) => {
    const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10)
    setSearchHistory(newHistory)
    localStorage.setItem('search_history', JSON.stringify(newHistory))
  }

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('search_history')
  }

  // 自动补全
  const handleSearch = (value: string) => {
    setQuery(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value.trim()) {
      setOptions([])
      return
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        // 获取自动补全建议
        const response = await fetch(`/api/v1/search/autocomplete?q=${encodeURIComponent(value)}&limit=5`)
        if (response.ok) {
          const suggestions = await response.json()

          // 构建选项列表
          const newOptions: SearchOption[] = []

          // 添加搜索历史
          const matchedHistory = searchHistory
            .filter(h => h.toLowerCase().includes(value.toLowerCase()))
            .slice(0, 3)

          matchedHistory.forEach(h => {
            newOptions.push({
              value: h,
              type: 'history',
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ClockCircleOutlined style={{ color: '#999' }} />
                  <span>{h}</span>
                </div>
              )
            })
          })

          // 添加API返回的建议
          suggestions.forEach((sug: any) => {
            newOptions.push({
              value: sug.text,
              type: sug.type,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {sug.icon && <span>{sug.icon}</span>}
                  <span>{sug.text}</span>
                </div>
              )
            })
          })

          setOptions(newOptions)
        }
      } catch (error) {
        console.error('Autocomplete error:', error)
      }
    }, 300)
  }

  // 执行搜索
  const handleSubmit = (value?: string) => {
    const searchQuery = value || query
    if (!searchQuery.trim()) return

    saveSearchHistory(searchQuery)
    onSearch(searchQuery, mode)
  }

  // 模式切换
  const handleModeChange = (value: string | number) => {
    setMode(value as 'keyword' | 'ai')
  }

  // 热门搜索词
  const popularSearches = [
    t('trends.suggestionDeepLearning'),
    t('trends.suggestionTransformer'),
    t('trends.suggestionFastAPI'),
    t('trends.suggestionLLM'),
    t('trends.suggestionAgent')
  ]

  return (
    <div className="smart-search-container">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* 搜索模式切换 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Segmented
            options={[
              { label: t('search.keywordMode') || '关键词', value: 'keyword', icon: <SearchOutlined /> },
              { label: t('search.aiMode') || 'AI问答', value: 'ai', icon: <RobotOutlined /> }
            ]}
            value={mode}
            onChange={handleModeChange}
          />

          {searchHistory.length > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={clearSearchHistory}
            >
              {t('search.clearHistory') || '清除历史'}
            </Button>
          )}
        </div>

        {/* 搜索框 */}
        <AutoComplete
          value={query}
          options={options}
          style={{ width: '100%' }}
          onSearch={handleSearch}
          onSelect={handleSubmit}
          notFoundContent={null}
        >
          <Search
            placeholder={
              placeholder ||
              (mode === 'keyword'
                ? (t('search.keywordPlaceholder') || '搜索技术内容...')
                : (t('search.aiPlaceholder') || '问我任何技术问题...'))
            }
            allowClear
            enterButton={
              loading ? <Spin size="small" /> : (
                mode === 'keyword'
                  ? <SearchOutlined />
                  : <RobotOutlined />
              )
            }
            size="large"
            onSearch={handleSubmit}
            loading={loading}
          />
        </AutoComplete>

        {/* 搜索建议 */}
        {!query && (
          <div className="search-suggestions">
            <Space size={[8, 8]} wrap>
              <span style={{ color: '#999', fontSize: 13 }}>
                💡 {t('search.trySuggestions') || '试试这些'}:
              </span>
              {popularSearches.map(keyword => (
                <Tag
                  key={keyword}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setQuery(keyword)
                    handleSubmit(keyword)
                  }}
                >
                  {keyword}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* AI模式提示 */}
        {mode === 'ai' && (
          <div className="ai-mode-hints">
            <Space direction="vertical" size={4}>
              <span style={{ color: '#999', fontSize: 12 }}>
                🤖 {t('search.aiHints') || 'AI模式示例'}:
              </span>
              <div style={{ fontSize: 12, color: '#666' }}>
                • {t('search.aiExample1') || '今天LLM有什么新突破？'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                • {t('search.aiExample2') || '推荐一些AI Agent框架'}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                • {t('search.aiExample3') || '什么是LoRA量化技术？'}
              </div>
            </Space>
          </div>
        )}
      </Space>
    </div>
  )
}

export default SmartSearch
