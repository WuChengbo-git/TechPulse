import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Tabs,
  Input,
  Select,
  DatePicker,
  Spin,
  Empty,
  Typography,
  Tooltip,
  Badge,
  message,
  Row,
  Col,
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
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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

type DataSource = 'all' | 'github' | 'arxiv' | 'huggingface' | 'zenn';

const ExplorePage: React.FC = () => {
  const { t, language } = useLanguage();
  const [cards, setCards] = useState<TechCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DataSource>('all');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // 筛选条件
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [minStars, setMinStars] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('latest');
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // 获取数据
  const fetchCards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const params: any = {
        limit: itemsPerPage,
        sort_by: sortBy,
        translate_to: language,
      };

      // 添加数据源筛选
      if (activeTab !== 'all') {
        params.source = activeTab;
      }

      // 添加关键词搜索
      if (searchKeyword.trim()) {
        params.keyword = searchKeyword.trim();
      }

      // 添加领域筛选
      if (selectedField !== 'all') {
        params.field = selectedField;
      }

      // 添加语言筛选
      if (selectedLanguage !== 'all') {
        params.language = selectedLanguage;
      }

      // 添加日期范围筛选
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      // 添加最小 Star 数筛选
      if (minStars !== undefined && minStars > 0) {
        params.min_stars = minStars;
      }

      const response = await axios.get('/api/v1/cards/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params,
      });

      setCards(response.data || []);
    } catch (error: any) {
      console.error('Failed to fetch cards:', error);
      message.error(t('explore.loadFailed') || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [activeTab, sortBy, itemsPerPage, language]);

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
  const toggleFavorite = async (cardId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(cardId)) {
      newFavorites.delete(cardId);
      message.success(t('explore.unfavorited') || '已取消收藏');
    } else {
      newFavorites.add(cardId);
      message.success(t('explore.favorited') || '已收藏');
    }
    setFavorites(newFavorites);

    // TODO: 调用后端 API 保存收藏状态
  };

  // 快速查看
  const handleQuickView = (card: TechCard) => {
    message.info('快速查看功能开发中...');
    // TODO: 打开 QuickViewModal
  };

  // 深度阅读
  const handleDeepRead = (card: TechCard) => {
    window.location.href = `/detail/${card.id}`;
  };

  // 重置筛选条件
  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedField('all');
    setSelectedLanguage('all');
    setDateRange(null);
    setMinStars(undefined);
    setSortBy('latest');
  };

  // 应用筛选
  const applyFilters = () => {
    fetchCards();
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <FilterOutlined /> {t('explore.allSources') || '全部数据源'}
        </span>
      ),
    },
    {
      key: 'github',
      label: (
        <span>
          <GithubOutlined /> GitHub
        </span>
      ),
    },
    {
      key: 'arxiv',
      label: (
        <span>
          <FileTextOutlined /> arXiv
        </span>
      ),
    },
    {
      key: 'huggingface',
      label: (
        <span>
          <RobotOutlined /> HuggingFace
        </span>
      ),
    },
    {
      key: 'zenn',
      label: (
        <span>
          <BookOutlined /> Zenn
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          {t('explore.title') || '🔍 数据探索'}
        </Title>
        <Text type="secondary">
          {t('explore.subtitle') || '探索所有技术数据源'}
        </Text>
      </div>

      {/* 数据源标签页 */}
      <Card style={{ marginBottom: '24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as DataSource)}
          items={tabItems}
        />
      </Card>

      {/* 高级筛选面板 */}
      <Card title={<><FilterOutlined /> {t('explore.advancedFilters') || '高级筛选'}</>} style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {/* 关键词搜索 */}
          <Col xs={24} md={12}>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder={t('explore.searchPlaceholder') || '搜索关键词...'}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onPressEnter={applyFilters}
                prefix={<SearchOutlined />}
              />
            </Space.Compact>
          </Col>

          {/* 领域筛选 */}
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={selectedField}
              onChange={setSelectedField}
              placeholder={t('explore.selectField') || '选择领域'}
            >
              <Option value="all">{t('explore.allFields') || '全部领域'}</Option>
              <Option value="llm">LLM</Option>
              <Option value="cv">{t('explore.cv') || '计算机视觉'}</Option>
              <Option value="nlp">NLP</Option>
              <Option value="tools">{t('explore.tools') || '工具库'}</Option>
              <Option value="ml">{t('explore.ml') || '机器学习'}</Option>
            </Select>
          </Col>

          {/* 编程语言筛选 */}
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              placeholder={t('explore.selectLanguage') || '选择语言'}
            >
              <Option value="all">{t('explore.allLanguages') || '全部语言'}</Option>
              <Option value="python">Python</Option>
              <Option value="javascript">JavaScript</Option>
              <Option value="typescript">TypeScript</Option>
              <Option value="go">Go</Option>
              <Option value="rust">Rust</Option>
              <Option value="java">Java</Option>
              <Option value="cpp">C++</Option>
            </Select>
          </Col>

          {/* 日期范围 */}
          <Col xs={24} md={12}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={setDateRange}
              placeholder={[
                t('explore.startDate') || '开始日期',
                t('explore.endDate') || '结束日期',
              ]}
            />
          </Col>

          {/* 最小 Star 数 */}
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={minStars}
              onChange={setMinStars}
              placeholder={t('explore.minStars') || '最小 Star 数'}
            >
              <Option value={undefined}>{t('explore.noLimit') || '不限'}</Option>
              <Option value={10}>10+</Option>
              <Option value={50}>50+</Option>
              <Option value={100}>100+</Option>
              <Option value={500}>500+</Option>
              <Option value={1000}>1000+</Option>
              <Option value={5000}>5000+</Option>
            </Select>
          </Col>

          {/* 排序 */}
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={sortBy}
              onChange={setSortBy}
              placeholder={t('explore.sortBy') || '排序方式'}
            >
              <Option value="latest">{t('explore.latest') || '最新'}</Option>
              <Option value="hot">{t('explore.hot') || '最热'}</Option>
              <Option value="stars">{t('explore.stars') || 'Star 数'}</Option>
              <Option value="relevant">{t('explore.relevant') || '相关度'}</Option>
            </Select>
          </Col>

          {/* 操作按钮 */}
          <Col xs={24}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters}>
                {t('explore.applyFilters') || '应用筛选'}
              </Button>
              <Button onClick={resetFilters}>
                {t('explore.resetFilters') || '重置'}
              </Button>
              <Select value={itemsPerPage} onChange={setItemsPerPage} style={{ width: 120 }}>
                <Option value={10}>10 {t('explore.items') || '条'}</Option>
                <Option value={20}>20 {t('explore.items') || '条'}</Option>
                <Option value={50}>50 {t('explore.items') || '条'}</Option>
                <Option value={100}>100 {t('explore.items') || '条'}</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 卡片列表 */}
      <Spin spinning={loading}>
        {cards.length === 0 && !loading ? (
          <Empty description={t('explore.noData') || '暂无数据'} />
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
                    onClick={() => toggleFavorite(card.id)}
                  />
                </div>

                {/* 元数据 */}
                <Space size="middle" style={{ marginBottom: '12px' }}>
                  {card.metadata.author && (
                    <Text type="secondary">{card.metadata.author}</Text>
                  )}
                  {card.metadata.language && (
                    <Tag>{card.metadata.language}</Tag>
                  )}
                  {card.metadata.stars !== undefined && (
                    <Text type="secondary">⭐ {card.metadata.stars.toLocaleString()}</Text>
                  )}
                  {card.metadata.forks !== undefined && (
                    <Text type="secondary">🔱 {card.metadata.forks.toLocaleString()}</Text>
                  )}
                  {card.metadata.citations !== undefined && (
                    <Text type="secondary">📚 引用 {card.metadata.citations}</Text>
                  )}
                  {card.metadata.downloads !== undefined && (
                    <Text type="secondary">⬇️ {card.metadata.downloads.toLocaleString()}</Text>
                  )}
                  {card.metadata.likes !== undefined && (
                    <Text type="secondary">👍 {card.metadata.likes}</Text>
                  )}
                  <Text type="secondary">
                    🕒 {new Date(card.created_at).toLocaleDateString()}
                  </Text>
                </Space>

                {/* 摘要 */}
                <Paragraph
                  ellipsis={{ rows: 3, expandable: false }}
                  style={{ marginBottom: '12px' }}
                >
                  {card.translated_summary || card.summary}
                </Paragraph>

                {/* 标签 */}
                <div style={{ marginBottom: '12px' }}>
                  <Space size="small" wrap>
                    {card.tags.slice(0, 8).map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </Space>
                </div>

                {/* 操作按钮 */}
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => handleQuickView(card)}>
                    {t('explore.quickView') || '快速查看'}
                  </Button>
                  <Button type="primary" icon={<ReadOutlined />} onClick={() => handleDeepRead(card)}>
                    {t('explore.deepRead') || '深度阅读'}
                  </Button>
                </Space>

                {/* 翻译提示 */}
                {card.translated_title && card.source.toLowerCase().includes('zenn') && (
                  <div style={{ marginTop: '12px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      🌐 {t('explore.translatedFromJapanese') || 'AI翻译自日语原文'}
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
          <Button size="large" onClick={() => message.info('加载更多功能开发中...')}>
            {t('explore.loadMore') || '加载更多'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
