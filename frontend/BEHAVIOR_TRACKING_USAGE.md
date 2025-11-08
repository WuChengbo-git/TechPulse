# 用户行为追踪使用指南

## 概述

TechPulse v0.5.0 引入了完整的用户行为追踪系统,用于记录和分析用户在应用中的交互行为。这些数据将用于:
- 个性化推荐优化
- 用户行为分析
- 搜索历史记录
- 热门内容发现

## 可追踪的行为类型

- **CLICK**: 点击卡片
- **VIEW**: 浏览卡片(停留超过3秒)
- **FAVORITE**: 收藏卡片
- **UNFAVORITE**: 取消收藏
- **SEARCH**: 搜索操作
- **SHARE**: 分享卡片

## 使用方法

### 1. 基础使用 - useBehaviorTracking Hook

```typescript
import { useBehaviorTracking } from '@/hooks/useBehaviorTracking'

function MyComponent() {
  const { logCardClick, logFavorite, logSearch } = useBehaviorTracking()

  const handleCardClick = (cardId: number) => {
    // 记录点击行为
    logCardClick(cardId)

    // 其他业务逻辑...
    navigateToDetail(cardId)
  }

  const handleFavorite = (cardId: number) => {
    // 记录收藏行为
    logFavorite(cardId)

    // 调用收藏 API
    await favoriteAPI.add(cardId)
  }

  return (
    <div onClick={() => handleCardClick(123)}>
      Card Component
    </div>
  )
}
```

### 2. 自动追踪卡片浏览时长

使用 `useCardViewTracking` Hook 可以自动追踪用户在卡片详情页的停留时间:

```typescript
import { useCardViewTracking } from '@/hooks/useBehaviorTracking'

function CardDetailPage({ cardId }: { cardId: number }) {
  // 自动追踪浏览时长(组件卸载时自动记录)
  useCardViewTracking(cardId, true)

  return (
    <div>
      <h1>Card Details</h1>
      {/* 卡片详情内容 */}
    </div>
  )
}
```

### 3. 搜索行为追踪

```typescript
import { useSearchTracking } from '@/hooks/useBehaviorTracking'

function SearchPage() {
  const { logSearch, createSearchHistory } = useSearchTracking()

  const handleSearch = async (query: string, mode: 'keyword' | 'ai') => {
    // 1. 记录搜索行为
    logSearch(query, mode)

    // 2. 执行搜索
    const results = await searchAPI.search(query, mode)

    // 3. 创建搜索历史(包含结果数量)
    createSearchHistory(query, mode, results.length)

    return results
  }

  return (
    <SearchBar onSearch={handleSearch} />
  )
}
```

### 4. 直接使用 Service (不使用 Hook)

在某些场景下(如工具函数、非组件代码),可以直接使用 service:

```typescript
import behaviorTrackingService from '@/services/behaviorTrackingService'

// 在任何地方调用
async function shareCard(cardId: number, platform: string) {
  await behaviorTrackingService.logShare(cardId, platform)

  // 分享逻辑...
}
```

## 在关键页面添加埋点

### 推荐的埋点位置

#### 1. **首页/发现页** (Homepage / Discovery)
```typescript
// 在 TechCardGrid 组件中
<TechCard
  card={card}
  onClick={() => {
    logCardClick(card.id)  // 记录点击
    navigate(`/card/${card.id}`)
  }}
/>
```

#### 2. **卡片详情页** (Card Detail)
```typescript
function CardDetailPage({ cardId }) {
  // 自动追踪浏览时长
  useCardViewTracking(cardId)

  const handleFavorite = () => {
    if (isFavorited) {
      logUnfavorite(cardId)
    } else {
      logFavorite(cardId)
    }
    toggleFavorite()
  }

  const handleShare = (platform: string) => {
    logShare(cardId, platform)
    shareToSocial(platform, cardUrl)
  }

  // ...
}
```

#### 3. **搜索页面** (Search Page)
```typescript
function SearchPage() {
  const { logSearch, createSearchHistory } = useSearchTracking()

  const performSearch = async (query: string, mode: string) => {
    logSearch(query, mode)

    const results = await api.search(query, mode)

    // 记录搜索历史
    createSearchHistory(query, mode, results.length)

    return results
  }

  // ...
}
```

#### 4. **收藏页面** (Favorites Page)
```typescript
function FavoritesPage() {
  const { logCardClick } = useBehaviorTracking()

  return (
    <div>
      {favorites.map(card => (
        <CardItem
          key={card.id}
          card={card}
          onClick={() => {
            logCardClick(card.id)
            navigate(`/card/${card.id}`)
          }}
        />
      ))}
    </div>
  )
}
```

## API 参考

### behaviorTrackingService 方法

- **logCardClick(cardId: number)**: 记录卡片点击
- **logCardView(cardId: number, duration: number)**: 记录卡片浏览
- **logFavorite(cardId: number)**: 记录收藏操作
- **logUnfavorite(cardId: number)**: 记录取消收藏
- **logSearch(query: string, mode: string)**: 记录搜索
- **logShare(cardId: number, platform?: string)**: 记录分享
- **createSearchHistory(...)**: 创建搜索历史记录
- **getUserStats(days: number)**: 获取用户行为统计
- **getSearchHistory(limit: number)**: 获取搜索历史
- **clearSearchHistory()**: 清除搜索历史
- **getPopularSearches(limit, days)**: 获取热门搜索词

### Hooks

- **useBehaviorTracking()**: 基础追踪 Hook
- **useCardViewTracking(cardId, enabled)**: 自动追踪卡片浏览时长
- **useSearchTracking()**: 搜索行为追踪
- **useUserBehaviorStats(days)**: 获取用户行为统计数据

## 隐私和设置

用户可以在设置中控制行为追踪:

```typescript
// 在用户设置中
behaviorTrackingService.setEnabled(false) // 禁用追踪
behaviorTrackingService.setEnabled(true)  // 启用追踪
```

## 注意事项

1. **静默失败**: 所有追踪操作都是异步的,失败不会影响用户体验
2. **自动过滤**: 未登录用户的行为不会被记录
3. **隐私保护**: 用户可以随时禁用追踪功能
4. **性能优化**: 追踪请求使用防抖和节流,不影响应用性能
5. **浏览时长**: 只记录停留超过 3 秒的浏览行为

## 示例: 完整的卡片组件集成

```typescript
import { useBehaviorTracking, useCardViewTracking } from '@/hooks/useBehaviorTracking'

function TechCardComponent({ card }: { card: TechCard }) {
  const { logCardClick, logFavorite, logUnfavorite } = useBehaviorTracking()
  const [isFavorited, setIsFavorited] = useState(card.is_favorited)

  const handleClick = () => {
    logCardClick(card.id)
    navigate(`/card/${card.id}`)
  }

  const handleFavorite = async () => {
    if (isFavorited) {
      logUnfavorite(card.id)
      await favoriteAPI.remove(card.id)
    } else {
      logFavorite(card.id)
      await favoriteAPI.add(card.id)
    }
    setIsFavorited(!isFavorited)
  }

  return (
    <div className="tech-card">
      <div onClick={handleClick}>
        <h3>{card.title}</h3>
        <p>{card.summary}</p>
      </div>
      <button onClick={handleFavorite}>
        {isFavorited ? '取消收藏' : '收藏'}
      </button>
    </div>
  )
}

function CardDetailPage({ cardId }: { cardId: number }) {
  // 自动追踪浏览时长
  useCardViewTracking(cardId)

  return (
    <div>
      {/* 卡片详情内容 */}
    </div>
  )
}
```

## 后续步骤

1. 在所有关键组件中集成行为追踪
2. 测试追踪功能是否正常工作
3. 在用户设置中添加追踪开关
4. 使用追踪数据优化推荐算法
