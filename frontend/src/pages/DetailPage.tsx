import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Space,
  Tag,
  Spin,
  Typography,
  Divider,
  Badge,
  message,
  Descriptions,
  Row,
  Col,
  Tabs,
  Empty,
  Timeline,
  Statistic,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
  LinkOutlined,
  ShareAltOutlined,
  LeftOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
  CodeOutlined,
  FileSearchOutlined,
  CommentOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

interface TechCard {
  id: number;
  title: string;
  source: string;
  url: string;
  summary: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at?: string;
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
    license?: string;
    homepage?: string;
    documentation?: string;
    topics?: string[];
  };
  translated_title?: string;
  translated_summary?: string;
  translated_content?: string;
  related_cards?: Array<{ id: number; title: string; source: string }>;
}

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [card, setCard] = useState<TechCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 获取卡片详情
  const fetchCardDetail = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const response = await axios.get(`/api/v1/cards/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          translate_to: language,
          include_related: true,
        },
      });

      setCard(response.data);

      // TODO: 从后端获取收藏状态
    } catch (error: any) {
      console.error('Failed to fetch card detail:', error);
      message.error(t('detail.loadFailed') || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardDetail();
  }, [id, language]);

  // 获取来源图标
  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('github')) return <GithubOutlined />;
    if (lowerSource.includes('arxiv')) return <FileTextOutlined />;
    if (lowerSource.includes('huggingface') || lowerSource.includes('hf')) return <RobotOutlined />;
    if (lowerSource.includes('zenn')) return <BookOutlined />;
    return <FileTextOutlined />;
  };

  // 处理收藏
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.success(
      !isFavorite
        ? (t('detail.favorited') || '已收藏')
        : (t('detail.unfavorited') || '已取消收藏')
    );
    // TODO: 调用后端 API 保存收藏状态
  };

  // 打开原文链接
  const handleOpenOriginal = () => {
    if (card?.url) {
      window.open(card.url, '_blank');
    }
  };

  // 分享
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    message.success(t('detail.linkCopied') || '链接已复制到剪贴板');
  };

  // 返回
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!card) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description={t('detail.notFound') || '未找到该内容'} />
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button type="primary" onClick={handleGoBack}>
            {t('detail.goBack') || '返回'}
          </Button>
        </div>
      </div>
    );
  }

  // 标签页配置
  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <FileSearchOutlined /> {t('detail.overview') || '概览'}
        </span>
      ),
      children: (
        <div>
          {/* 摘要 */}
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f6f8fa' }}>
            <Title level={5}>{t('detail.summary') || '摘要'}</Title>
            <Paragraph style={{ fontSize: '15px', lineHeight: '1.8', marginBottom: 0 }}>
              {card.translated_summary || card.summary}
            </Paragraph>
          </Card>

          {/* 完整内容 */}
          <Card size="small">
            <Title level={5}>{t('detail.fullContent') || '完整内容'}</Title>
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.8',
                color: '#24292f',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {card.translated_content || card.content || (
                <Text type="secondary">{t('detail.noContent') || '暂无详细内容'}</Text>
              )}
            </div>
            {(card.translated_summary || card.translated_content) && (
              <div style={{ marginTop: '16px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  🌐 {t('detail.aiTranslated') || 'AI 翻译'}
                  {card.source.toLowerCase().includes('zenn') && ` (${t('detail.fromJapanese') || '来自日语原文'})`}
                </Text>
              </div>
            )}
          </Card>
        </div>
      ),
    },
    {
      key: 'metadata',
      label: (
        <span>
          <CodeOutlined /> {t('detail.technicalInfo') || '技术信息'}
        </span>
      ),
      children: (
        <Card size="small">
          <Descriptions column={2} bordered size="small">
            {card.metadata.author && (
              <Descriptions.Item label={t('detail.author') || '作者'} span={2}>
                <Text strong>{card.metadata.author}</Text>
              </Descriptions.Item>
            )}
            {card.metadata.language && (
              <Descriptions.Item label={t('detail.language') || '编程语言'}>
                <Tag color="blue">{card.metadata.language}</Tag>
              </Descriptions.Item>
            )}
            {card.metadata.license && (
              <Descriptions.Item label={t('detail.license') || '许可证'}>
                <Tag>{card.metadata.license}</Tag>
              </Descriptions.Item>
            )}
            {card.metadata.stars !== undefined && (
              <Descriptions.Item label="Stars">
                <Statistic
                  value={card.metadata.stars}
                  prefix="⭐"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.forks !== undefined && (
              <Descriptions.Item label="Forks">
                <Statistic
                  value={card.metadata.forks}
                  prefix="🔱"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.watchers !== undefined && (
              <Descriptions.Item label="Watchers">
                <Statistic
                  value={card.metadata.watchers}
                  prefix="👀"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.issues !== undefined && (
              <Descriptions.Item label="Issues">
                <Statistic
                  value={card.metadata.issues}
                  prefix="🐛"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.citations !== undefined && (
              <Descriptions.Item label={t('detail.citations') || '引用数'}>
                <Statistic
                  value={card.metadata.citations}
                  prefix="📚"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.downloads !== undefined && (
              <Descriptions.Item label={t('detail.downloads') || '下载量'}>
                <Statistic
                  value={card.metadata.downloads}
                  prefix="⬇️"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.likes !== undefined && (
              <Descriptions.Item label={t('detail.likes') || '点赞'}>
                <Statistic
                  value={card.metadata.likes}
                  prefix="👍"
                  valueStyle={{ fontSize: '16px' }}
                />
              </Descriptions.Item>
            )}
            {card.metadata.homepage && (
              <Descriptions.Item label={t('detail.homepage') || '主页'} span={2}>
                <a href={card.metadata.homepage} target="_blank" rel="noopener noreferrer">
                  {card.metadata.homepage}
                </a>
              </Descriptions.Item>
            )}
            {card.metadata.documentation && (
              <Descriptions.Item label={t('detail.documentation') || '文档'} span={2}>
                <a href={card.metadata.documentation} target="_blank" rel="noopener noreferrer">
                  {card.metadata.documentation}
                </a>
              </Descriptions.Item>
            )}
            <Descriptions.Item label={t('detail.createdAt') || '创建时间'}>
              {new Date(card.created_at).toLocaleString()}
            </Descriptions.Item>
            {card.updated_at && (
              <Descriptions.Item label={t('detail.updatedAt') || '更新时间'}>
                {new Date(card.updated_at).toLocaleString()}
              </Descriptions.Item>
            )}
          </Descriptions>

          {/* Topics */}
          {card.metadata.topics && card.metadata.topics.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <Text strong>{t('detail.topics') || '主题'}:</Text>
              <div style={{ marginTop: '8px' }}>
                <Space size="small" wrap>
                  {card.metadata.topics.map((topic, index) => (
                    <Tag key={index} color="processing">
                      {topic}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'related',
      label: (
        <span>
          <CommentOutlined /> {t('detail.relatedContent') || '相关内容'}
        </span>
      ),
      children: (
        <Card size="small">
          {card.related_cards && card.related_cards.length > 0 ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {card.related_cards.map((relatedCard) => (
                <Card
                  key={relatedCard.id}
                  size="small"
                  hoverable
                  onClick={() => navigate(`/detail/${relatedCard.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <Space>
                    <Badge
                      count={
                        <Tag color="blue" icon={getSourceIcon(relatedCard.source)}>
                          {relatedCard.source}
                        </Tag>
                      }
                      offset={[0, 0]}
                    />
                    <Text strong>{relatedCard.title}</Text>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : (
            <Empty description={t('detail.noRelated') || '暂无相关内容'} />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 返回按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Button icon={<LeftOutlined />} onClick={handleGoBack}>
          {t('detail.back') || '返回'}
        </Button>
      </div>

      {/* 主卡片 */}
      <Card>
        {/* 头部：来源和标题 */}
        <div style={{ marginBottom: '16px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Badge
              count={
                <Tag color="blue" icon={getSourceIcon(card.source)} style={{ fontSize: '14px' }}>
                  {card.source}
                </Tag>
              }
              offset={[0, 0]}
            />
            <Title level={2} style={{ margin: 0 }}>
              {card.translated_title || card.title}
            </Title>
            {card.translated_title && (
              <Text type="secondary" style={{ fontSize: '15px' }}>
                {card.title}
              </Text>
            )}
          </Space>
        </div>

        {/* 操作按钮 */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Button
              type={isFavorite ? 'default' : 'primary'}
              icon={isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? (t('detail.unfavorite') || '取消收藏') : (t('detail.favorite') || '收藏')}
            </Button>
            <Button icon={<LinkOutlined />} onClick={handleOpenOriginal}>
              {t('detail.viewOriginal') || '查看原文'}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={handleShare}>
              {t('detail.share') || '分享'}
            </Button>
          </Space>
        </div>

        {/* 标签 */}
        {card.tags && card.tags.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Space size="small" wrap>
              {card.tags.map((tag, index) => (
                <Tag key={index} color="default">
                  {tag}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <Divider />

        {/* 标签页内容 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  );
};

export default DetailPage;
