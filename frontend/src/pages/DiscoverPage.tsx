import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Select,
  Spin,
  Empty,
  Typography,
  Badge,
  message,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
  EyeOutlined,
  ReadOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import QuickViewModal from '../components/QuickViewModal';
import AddToFavoriteModal from '../components/AddToFavoriteModal';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TechCard {
  id: number;
  title: string;
  source: string;
  url: string;
  summary: string;
  tags: string[];
  created_at: string;
  metadata: {
    stars?: number;
    forks?: number;
    watchers?: number;
    issues?: number;
    downloads?: number;
    citations?: number;
    likes?: number;
    author?: string;
    language?: string;
  };
  translated_title?: string;
  translated_summary?: string;
}

const DiscoverPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [cards, setCards] = useState<TechCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [quickViewVisible, setQuickViewVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<TechCard | null>(null);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState(false);
  const [favoriteCard, setFavoriteCard] = useState<TechCard | null>(null);

  // 获取推荐卡片
  const fetchRecommendedCards = async () => {
    setLoading(true);
    setHasMore(true); // 重置 hasMore 状态
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const response = await axios.get('/api/v1/recommend/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          limit: itemsPerPage,
          field: selectedField === 'all' ? undefined : selectedField,
          sort_by: sortBy,
          translate_to: language, // 根据用户语言翻译
        },
      });

      const newCards = response.data.recommendations || response.data || [];
      setCards(newCards);

      // 如果返回的数据少于请求数量，说明没有更多了
      if (newCards.length < itemsPerPage) {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Failed to fetch recommendations:', error);
      message.error(t('discover.loadFailed') || '加载推荐失败');

      // Fallback: 获取所有卡片
      try {
        const fallbackResponse = await axios.get('/api/v1/cards/', {
          params: {
            limit: itemsPerPage,
            translate_to: language,
          },
        });
        const fallbackCards = fallbackResponse.data || [];
        setCards(fallbackCards);
        if (fallbackCards.length < itemsPerPage) {
          setHasMore(false);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载更多卡片
  const loadMoreCards = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const response = await axios.get('/api/v1/recommend/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          limit: itemsPerPage,
          skip: cards.length, // 使用当前卡片数量作为偏移量
          field: selectedField === 'all' ? undefined : selectedField,
          sort_by: sortBy,
          translate_to: language,
        },
      });

      const newCards = response.data.recommendations || response.data || [];

      if (newCards.length === 0 || newCards.length < itemsPerPage) {
        setHasMore(false);
      }

      if (newCards.length > 0) {
        setCards([...cards, ...newCards]); // 追加新卡片
        // 移除提示框，改为静默加载
      } else {
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Failed to load more:', error);
      message.error(t('discover.loadMoreFailed') || '加载更多失败');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRecommendedCards();
  }, [selectedField, sortBy, itemsPerPage, language]);

  // 获取来源图标
  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('github')) return <GithubOutlined />;
    if (lowerSource.includes('arxiv')) return <FileTextOutlined />;
    if (lowerSource.includes('huggingface') || lowerSource.includes('hf')) return <RobotOutlined />;
    if (lowerSource.includes('zenn')) return <BookOutlined />;
    return <FileTextOutlined />;
  };

  // 切换收藏
  const toggleFavorite = async (card: TechCard) => {
    if (favorites.has(card.id)) {
      // 取消收藏
      const newFavorites = new Set(favorites);
      newFavorites.delete(card.id);
      setFavorites(newFavorites);

      try {
        const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');
        await axios.delete(`/api/v1/favorites/${card.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        message.success(t('discover.unfavorited') || '已取消收藏');
      } catch (error) {
        // 回滚
        newFavorites.add(card.id);
        setFavorites(newFavorites);
        message.error(t('discover.unfavoriteFailed') || '取消收藏失败');
      }
    } else {
      // 添加收藏 - 打开标签选择模态框
      setFavoriteCard(card);
      setFavoriteModalVisible(true);
    }
  };

  // 确认添加收藏（带标签）
  const handleConfirmFavorite = async (cardId: number, tags: string[]) => {
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      // 添加到收藏
      await axios.post(
        '/api/v1/favorites/',
        { card_id: cardId },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      // 添加标签
      if (tags.length > 0) {
        await axios.put(
          `/api/v1/favorites/${cardId}/tags`,
          { tags },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      }

      const newFavorites = new Set(favorites);
      newFavorites.add(cardId);
      setFavorites(newFavorites);
    } catch (error) {
      throw error; // 让模态框处理错误
    }
  };

  // 快速查看
  const handleQuickView = (card: TechCard) => {
    setSelectedCard(card);
    setQuickViewVisible(true);
  };

  // 深度阅读（跳转详情页）
  const handleDeepRead = (card: TechCard) => {
    window.location.href = `/detail/${card.id}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          {t('discover.title') || '🎯 今日精选'}
        </Title>
        <Text type="secondary">
          {t('discover.subtitle') || '为你精选的技术情报'}
        </Text>
      </div>

      {/* 筛选和排序控制 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space wrap size="middle">
          {/* 领域筛选 */}
          <Space>
            <Text strong>{t('discover.field') || '领域'}:</Text>
            <Space size="small" wrap>
              <Tag
                color={selectedField === 'all' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('all')}
              >
                {t('discover.all') || '全部'}
              </Tag>
              <Tag
                color={selectedField === 'llm' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('llm')}
              >
                {t('discover.llm') || 'LLM'}
              </Tag>
              <Tag
                color={selectedField === 'cv' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('cv')}
              >
                {t('discover.cv') || '计算机视觉'}
              </Tag>
              <Tag
                color={selectedField === 'nlp' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('nlp')}
              >
                {t('discover.nlp') || 'NLP'}
              </Tag>
              <Tag
                color={selectedField === 'ml' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('ml')}
              >
                {t('discover.ml') || '机器学习'}
              </Tag>
              <Tag
                color={selectedField === 'dl' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('dl')}
              >
                {t('discover.dl') || '深度学习'}
              </Tag>
              <Tag
                color={selectedField === 'rl' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('rl')}
              >
                {t('discover.rl') || '强化学习'}
              </Tag>
              <Tag
                color={selectedField === 'tools' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('tools')}
              >
                {t('discover.tools') || '工具库'}
              </Tag>
              <Tag
                color={selectedField === 'robotics' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('robotics')}
              >
                {t('discover.robotics') || '机器人'}
              </Tag>
              <Tag
                color={selectedField === 'data' ? 'blue' : 'default'}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedField('data')}
              >
                {t('discover.data') || '数据科学'}
              </Tag>
            </Space>
          </Space>

          {/* 排序 */}
          <Space>
            <Text strong>{t('discover.sortBy') || '排序'}:</Text>
            <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
              <Option value="recommended">{t('discover.recommended') || '推荐度'}</Option>
              <Option value="latest">{t('discover.latest') || '最新'}</Option>
              <Option value="hot">{t('discover.hot') || '最热'}</Option>
              <Option value="stars">{t('discover.stars') || 'Star数'}</Option>
            </Select>
          </Space>

          {/* 每页数量 */}
          <Space>
            <Text strong>{t('discover.itemsPerPage') || '显示'}:</Text>
            <Select value={itemsPerPage} onChange={setItemsPerPage} style={{ width: 100 }}>
              <Option value={10}>10 {t('discover.items') || '条'}</Option>
              <Option value={20}>20 {t('discover.items') || '条'}</Option>
              <Option value={50}>50 {t('discover.items') || '条'}</Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* 卡片列表 */}
      <Spin spinning={loading}>
        {cards.length === 0 && !loading ? (
          <Empty description={t('discover.noData') || '暂无数据'} />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {cards.map((card) => (
              <Card
                key={card.id}
                hoverable
                style={{ borderRadius: '8px' }}
                bodyStyle={{ padding: '20px' }}
              >
                {/* 卡片头部 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <Space size="small" style={{ flex: 1 }}>
                    {/* 来源图标和标签 */}
                    <Badge
                      count={
                        <Tag color="blue" icon={getSourceIcon(card.source)}>
                          {card.source}
                        </Tag>
                      }
                      offset={[0, 0]}
                    />

                    {/* 标题 */}
                    <Title level={4} style={{ margin: 0 }}>
                      {card.translated_title || card.title}
                    </Title>
                  </Space>

                  {/* 收藏按钮 */}
                  <Button
                    type="text"
                    icon={favorites.has(card.id) ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={() => toggleFavorite(card)}
                  />
                </div>

                {/* 元数据 */}
                <Space size="middle" style={{ marginBottom: '12px' }}>
                  {card.metadata?.author && (
                    <Text type="secondary">{card.metadata.author}</Text>
                  )}
                  {card.metadata?.stars !== undefined && card.metadata?.stars !== null && (
                    <Text type="secondary">⭐ {card.metadata.stars.toLocaleString()}</Text>
                  )}
                  {card.metadata?.citations !== undefined && card.metadata?.citations !== null && (
                    <Text type="secondary">📚 引用 {card.metadata.citations}</Text>
                  )}
                  {card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (
                    <Text type="secondary">⬇️ {card.metadata.downloads.toLocaleString()}</Text>
                  )}
                  {card.metadata?.likes !== undefined && card.metadata?.likes !== null && (
                    <Text type="secondary">👍 {card.metadata.likes}</Text>
                  )}
                  {card.created_at && (
                    <Text type="secondary">
                      🕒 {new Date(card.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </Space>

                {/* 摘要 */}
                <Paragraph
                  ellipsis={{ rows: 3, expandable: false }}
                  style={{ marginBottom: '12px' }}
                >
                  {card.translated_summary || card.summary}
                </Paragraph>

                {/* 标签 */}
                {card.tags && card.tags.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <Space size="small" wrap>
                      {card.tags.slice(0, 5).map((tag, index) => (
                        <Tag key={index}>{tag}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 操作按钮 */}
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => handleQuickView(card)}>
                    {t('discover.quickView') || '快速查看'}
                  </Button>
                  <Button type="primary" icon={<ReadOutlined />} onClick={() => handleDeepRead(card)}>
                    {t('discover.deepRead') || '深度阅读'}
                  </Button>
                </Space>

                {/* 翻译提示 */}
                {card.translated_title && (
                  <div style={{ marginTop: '12px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      🌐 {card.source.toLowerCase().includes('zenn')
                        ? (t('discover.translatedFromJapanese') || 'AI翻译自日语原文')
                        : (t('discover.translatedFromChinese') || 'AI翻译自中文原文')}
                    </Text>
                  </div>
                )}
              </Card>
            ))}
          </Space>
        )}
      </Spin>

      {/* 加载更多按钮 */}
      {!loading && cards.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button
            size="large"
            onClick={loadMoreCards}
            loading={loadingMore}
            disabled={!hasMore}
          >
            {hasMore ? (t('discover.loadMore') || '加载更多') : (t('discover.noMore') || '没有更多了')}
          </Button>
        </div>
      )}

      {/* 快速查看模态框 */}
      <QuickViewModal
        visible={quickViewVisible}
        cardId={selectedCard?.id || null}
        onClose={() => {
          setQuickViewVisible(false);
          setSelectedCard(null);
        }}
        onDeepRead={() => {
          if (selectedCard) {
            setQuickViewVisible(false);
            handleDeepRead(selectedCard);
          }
        }}
      />

      {/* 添加到收藏模态框 */}
      <AddToFavoriteModal
        visible={favoriteModalVisible}
        cardId={favoriteCard?.id || null}
        cardTitle={favoriteCard?.title || ''}
        onClose={() => {
          setFavoriteModalVisible(false);
          setFavoriteCard(null);
        }}
        onConfirm={handleConfirmFavorite}
      />
    </div>
  );
};

export default DiscoverPage;
