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
  Input,
  Modal,
  Checkbox,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  StarFilled,
  EyeOutlined,
  ReadOutlined,
  DeleteOutlined,
  TagsOutlined,
  PlusOutlined,
  EditOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { CheckableTag } = Tag;

interface TechCard {
  id: number;
  title: string;
  source: string;
  url: string;
  summary: string;
  tags: string[];
  collection_tags?: string[];
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
  favorited_at?: string;
}

const CollectionsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [cards, setCards] = useState<TechCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allCollectionTags, setAllCollectionTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('latest');

  // 标签管理
  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [currentCard, setCurrentCard] = useState<TechCard | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editingTags, setEditingTags] = useState<string[]>([]);

  // 获取收藏列表
  const fetchCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const params: any = {
        translate_to: language,
        sort_by: sortBy,
      };

      // 添加标签筛选
      if (selectedTags.length > 0) {
        params.tags = selectedTags.join(',');
      }

      const response = await axios.get('/api/v1/favorites/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });

      const fetchedCards = response.data || [];
      setCards(fetchedCards);

      // 提取所有收藏标签
      const tagsSet = new Set<string>();
      fetchedCards.forEach((card: TechCard) => {
        if (card.collection_tags) {
          card.collection_tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAllCollectionTags(Array.from(tagsSet));
    } catch (error: any) {
      console.error('Failed to fetch collections:', error);
      message.error(t('collections.loadFailed') || '加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [sortBy, language]);

  // 获取来源图标
  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('github')) return <GithubOutlined />;
    if (lowerSource.includes('arxiv')) return <FileTextOutlined />;
    if (lowerSource.includes('huggingface') || lowerSource.includes('hf')) return <RobotOutlined />;
    if (lowerSource.includes('zenn')) return <BookOutlined />;
    return <FileTextOutlined />;
  };

  // 取消收藏
  const handleUnfavorite = async (cardId: number) => {
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      await axios.delete(`/api/v1/favorites/${cardId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      message.success(t('collections.unfavorited') || '已取消收藏');
      setCards(cards.filter(card => card.id !== cardId));
    } catch (error: any) {
      console.error('Failed to unfavorite:', error);
      message.error(t('collections.unfavoriteFailed') || '取消收藏失败');
    }
  };

  // 打开标签编辑模态框
  const openTagModal = (card: TechCard) => {
    setCurrentCard(card);
    setEditingTags(card.collection_tags || []);
    setNewTag('');
    setTagModalVisible(true);
  };

  // 添加新标签
  const handleAddTag = () => {
    if (!newTag.trim()) {
      message.warning(t('collections.tagEmpty') || '标签不能为空');
      return;
    }

    if (editingTags.includes(newTag.trim())) {
      message.warning(t('collections.tagExists') || '标签已存在');
      return;
    }

    setEditingTags([...editingTags, newTag.trim()]);
    setNewTag('');
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setEditingTags(editingTags.filter(t => t !== tag));
  };

  // 保存标签
  const handleSaveTags = async () => {
    if (!currentCard) return;

    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      await axios.put(
        `/api/v1/favorites/${currentCard.id}/tags`,
        { tags: editingTags },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      message.success(t('collections.tagsSaved') || '标签已保存');
      setTagModalVisible(false);
      fetchCollections();
    } catch (error: any) {
      console.error('Failed to save tags:', error);
      message.error(t('collections.tagsSaveFailed') || '保存标签失败');
    }
  };

  // 快速查看
  const handleQuickView = (card: TechCard) => {
    message.info('快速查看功能开发中...');
    // TODO: 打开 QuickViewModal
  };

  // 深度阅读
  const handleDeepRead = (card: TechCard) => {
    navigate(`/detail/${card.id}`);
  };

  // 标签筛选
  const handleTagFilter = (tag: string, checked: boolean) => {
    const nextSelectedTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter(t => t !== tag);
    setSelectedTags(nextSelectedTags);
  };

  // 应用筛选
  const applyFilter = () => {
    fetchCollections();
  };

  // 清除筛选
  const clearFilter = () => {
    setSelectedTags([]);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <StarFilled style={{ color: '#faad14' }} /> {t('collections.title') || '我的收藏'}
        </Title>
        <Text type="secondary">
          {t('collections.subtitle') || '管理你收藏的技术内容'}
        </Text>
      </div>

      {/* 筛选和排序控制 */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {/* 标签筛选 */}
          {allCollectionTags.length > 0 && (
            <div>
              <Space align="center">
                <Text strong>
                  <TagsOutlined /> {t('collections.filterByTags') || '按标签筛选'}:
                </Text>
              </Space>
              <div style={{ marginTop: '8px' }}>
                <Space size="small" wrap>
                  {allCollectionTags.map(tag => (
                    <CheckableTag
                      key={tag}
                      checked={selectedTags.includes(tag)}
                      onChange={(checked) => handleTagFilter(tag, checked)}
                    >
                      {tag}
                    </CheckableTag>
                  ))}
                </Space>
              </div>
            </div>
          )}

          {/* 控制栏 */}
          <Row gutter={16} align="middle">
            <Col>
              <Space>
                <Text strong>{t('collections.sortBy') || '排序'}:</Text>
                <Select value={sortBy} onChange={setSortBy} style={{ width: 150 }}>
                  <Option value="latest">{t('collections.latestFavorited') || '最近收藏'}</Option>
                  <Option value="oldest">{t('collections.oldestFavorited') || '最早收藏'}</Option>
                  <Option value="title">{t('collections.title') || '标题'}</Option>
                  <Option value="stars">{t('collections.stars') || 'Star数'}</Option>
                </Select>
              </Space>
            </Col>
            {selectedTags.length > 0 && (
              <Col>
                <Button onClick={applyFilter} type="primary">
                  <FilterOutlined /> {t('collections.applyFilter') || '应用筛选'}
                </Button>
              </Col>
            )}
            {selectedTags.length > 0 && (
              <Col>
                <Button onClick={clearFilter}>
                  {t('collections.clearFilter') || '清除筛选'}
                </Button>
              </Col>
            )}
            <Col flex="auto" style={{ textAlign: 'right' }}>
              <Text type="secondary">
                {t('collections.total') || '共'} {cards.length} {t('collections.items') || '项'}
              </Text>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* 收藏列表 */}
      <Spin spinning={loading}>
        {cards.length === 0 && !loading ? (
          <Empty
            description={
              selectedTags.length > 0
                ? (t('collections.noMatchingCollections') || '没有匹配的收藏')
                : (t('collections.noCollections') || '还没有收藏内容')
            }
          />
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

                  {/* 操作按钮 */}
                  <Space>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => openTagModal(card)}
                      title={t('collections.editTags') || '编辑标签'}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleUnfavorite(card.id)}
                      title={t('collections.unfavorite') || '取消收藏'}
                    />
                  </Space>
                </div>

                {/* 元数据 */}
                <Space size="middle" style={{ marginBottom: '12px' }}>
                  {card.metadata.author && (
                    <Text type="secondary">{card.metadata.author}</Text>
                  )}
                  {card.metadata.stars !== undefined && (
                    <Text type="secondary">⭐ {card.metadata.stars.toLocaleString()}</Text>
                  )}
                  {card.metadata.citations !== undefined && (
                    <Text type="secondary">📚 引用 {card.metadata.citations}</Text>
                  )}
                  {card.metadata.downloads !== undefined && (
                    <Text type="secondary">⬇️ {card.metadata.downloads.toLocaleString()}</Text>
                  )}
                  {card.favorited_at && (
                    <Text type="secondary">
                      💖 {t('collections.favoritedAt') || '收藏于'} {new Date(card.favorited_at).toLocaleDateString()}
                    </Text>
                  )}
                </Space>

                {/* 摘要 */}
                <Paragraph
                  ellipsis={{ rows: 2, expandable: false }}
                  style={{ marginBottom: '12px' }}
                >
                  {card.translated_summary || card.summary}
                </Paragraph>

                {/* 收藏标签 */}
                {card.collection_tags && card.collection_tags.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <Space size="small" wrap>
                      <TagsOutlined style={{ color: '#1890ff' }} />
                      {card.collection_tags.map((tag, index) => (
                        <Tag key={index} color="blue">
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 技术标签 */}
                <div style={{ marginBottom: '12px' }}>
                  <Space size="small" wrap>
                    {card.tags.slice(0, 5).map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </Space>
                </div>

                {/* 操作按钮 */}
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => handleQuickView(card)}>
                    {t('collections.quickView') || '快速查看'}
                  </Button>
                  <Button type="primary" icon={<ReadOutlined />} onClick={() => handleDeepRead(card)}>
                    {t('collections.deepRead') || '深度阅读'}
                  </Button>
                </Space>
              </Card>
            ))}
          </Space>
        )}
      </Spin>

      {/* 标签编辑模态框 */}
      <Modal
        title={
          <Space>
            <TagsOutlined />
            {t('collections.manageTags') || '管理标签'}
          </Space>
        }
        open={tagModalVisible}
        onOk={handleSaveTags}
        onCancel={() => setTagModalVisible(false)}
        okText={t('collections.save') || '保存'}
        cancelText={t('collections.cancel') || '取消'}
      >
        {currentCard && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>{currentCard.translated_title || currentCard.title}</Text>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* 当前标签 */}
            <div>
              <Text type="secondary">{t('collections.currentTags') || '当前标签'}:</Text>
              <div style={{ marginTop: '8px' }}>
                {editingTags.length > 0 ? (
                  <Space size="small" wrap>
                    {editingTags.map((tag, index) => (
                      <Tag
                        key={index}
                        closable
                        onClose={() => handleRemoveTag(tag)}
                        color="blue"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('collections.noTags') || '暂无标签'}</Text>
                )}
              </div>
            </div>

            {/* 添加新标签 */}
            <div>
              <Text type="secondary">{t('collections.addNewTag') || '添加新标签'}:</Text>
              <Space.Compact style={{ width: '100%', marginTop: '8px' }}>
                <Input
                  placeholder={t('collections.tagPlaceholder') || '输入标签名称...'}
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTag}>
                  {t('collections.add') || '添加'}
                </Button>
              </Space.Compact>
            </div>

            {/* 常用标签建议 */}
            <div>
              <Text type="secondary">{t('collections.suggestedTags') || '常用标签'}:</Text>
              <div style={{ marginTop: '8px' }}>
                <Space size="small" wrap>
                  {['待学习', '重要', '工作相关', 'LLM', 'CV', 'NLP', '工具', '论文', '代码'].map((tag) => (
                    <Tag
                      key={tag}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (!editingTags.includes(tag)) {
                          setEditingTags([...editingTags, tag]);
                        }
                      }}
                    >
                      <PlusOutlined /> {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CollectionsPage;
