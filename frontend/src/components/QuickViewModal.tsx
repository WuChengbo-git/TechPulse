import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Space,
  Tag,
  Button,
  Spin,
  Divider,
  Badge,
  message,
  Descriptions,
  Card,
  Empty,
} from 'antd';
import {
  StarOutlined,
  StarFilled,
  ReadOutlined,
  LinkOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
  CloseOutlined,
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
  content?: string;
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
  translated_content?: string;
}

interface QuickViewModalProps {
  cardId: number | null;
  visible: boolean;
  onClose: () => void;
  onDeepRead?: (cardId: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (cardId: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
  cardId,
  visible,
  onClose,
  onDeepRead,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { t, language } = useLanguage();
  const [card, setCard] = useState<TechCard | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取卡片详情
  const fetchCardDetail = async (id: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token');

      const response = await axios.get(`/api/v1/cards/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          translate_to: language,
        },
      });

      setCard(response.data);
    } catch (error: any) {
      console.error('Failed to fetch card detail:', error);
      message.error(t('quickView.loadFailed') || '加载详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && cardId) {
      fetchCardDetail(cardId);
    } else {
      setCard(null);
    }
  }, [visible, cardId, language]);

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
    if (card && onToggleFavorite) {
      onToggleFavorite(card.id);
    }
  };

  // 处理深度阅读
  const handleDeepRead = () => {
    if (card && onDeepRead) {
      onDeepRead(card.id);
      onClose();
    }
  };

  // 打开原文链接
  const handleOpenOriginal = () => {
    if (card?.url) {
      window.open(card.url, '_blank');
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      closeIcon={<CloseOutlined />}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      <Spin spinning={loading}>
        {card ? (
          <div>
            {/* 标题和来源 */}
            <div style={{ marginBottom: '16px' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Badge
                  count={
                    <Tag color="blue" icon={getSourceIcon(card.source)}>
                      {card.source}
                    </Tag>
                  }
                  offset={[0, 0]}
                />
                <Title level={3} style={{ margin: 0 }}>
                  {card.translated_title || card.title}
                </Title>
                {card.translated_title && (
                  <Text type="secondary" style={{ fontSize: '14px' }}>
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
                  {isFavorite ? (t('quickView.unfavorite') || '取消收藏') : (t('quickView.favorite') || '收藏')}
                </Button>
                <Button type="primary" icon={<ReadOutlined />} onClick={handleDeepRead}>
                  {t('quickView.deepRead') || '深度阅读'}
                </Button>
                <Button icon={<LinkOutlined />} onClick={handleOpenOriginal}>
                  {t('quickView.viewOriginal') || '查看原文'}
                </Button>
              </Space>
            </div>

            <Divider />

            {/* 元数据 */}
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#fafafa' }}>
              <Descriptions column={2} size="small">
                {card.metadata.author && (
                  <Descriptions.Item label={t('quickView.author') || '作者'}>
                    {card.metadata.author}
                  </Descriptions.Item>
                )}
                {card.metadata.language && (
                  <Descriptions.Item label={t('quickView.language') || '语言'}>
                    <Tag>{card.metadata.language}</Tag>
                  </Descriptions.Item>
                )}
                {card.metadata?.stars !== undefined && card.metadata?.stars !== null && (
                  <Descriptions.Item label="Stars">
                    ⭐ {card.metadata.stars.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.forks !== undefined && card.metadata?.forks !== null && (
                  <Descriptions.Item label="Forks">
                    🔱 {card.metadata.forks.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.watchers !== undefined && card.metadata?.watchers !== null && (
                  <Descriptions.Item label="Watchers">
                    👀 {card.metadata.watchers.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.issues !== undefined && card.metadata?.issues !== null && (
                  <Descriptions.Item label="Issues">
                    🐛 {card.metadata.issues.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.citations !== undefined && card.metadata?.citations !== null && (
                  <Descriptions.Item label={t('quickView.citations') || '引用'}>
                    📚 {card.metadata.citations.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.downloads !== undefined && card.metadata?.downloads !== null && (
                  <Descriptions.Item label={t('quickView.downloads') || '下载'}>
                    ⬇️ {card.metadata.downloads.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.metadata?.likes !== undefined && card.metadata?.likes !== null && (
                  <Descriptions.Item label={t('quickView.likes') || '点赞'}>
                    👍 {card.metadata.likes.toLocaleString()}
                  </Descriptions.Item>
                )}
                {card.created_at && (
                  <Descriptions.Item label={t('quickView.date') || '日期'}>
                    🕒 {new Date(card.created_at).toLocaleDateString()}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 标签 */}
            {card.tags && card.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>{t('quickView.tags') || '标签'}:</Text>
                <div style={{ marginTop: '8px' }}>
                  <Space size="small" wrap>
                    {card.tags.map((tag, index) => (
                      <Tag key={index} color="processing">
                        {tag}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>
            )}

            <Divider />

            {/* 摘要 */}
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>{t('quickView.summary') || '摘要'}</Title>
              <Paragraph style={{ fontSize: '15px', lineHeight: '1.8' }}>
                {card.translated_summary || card.summary}
              </Paragraph>
              {card.translated_summary && card.source.toLowerCase().includes('zenn') && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  🌐 {t('quickView.translatedFromJapanese') || 'AI翻译自日语原文'}
                </Text>
              )}
            </div>

            {/* 内容预览（如果有） */}
            {(card.translated_content || card.content) && (
              <div>
                <Title level={5}>{t('quickView.preview') || '内容预览'}</Title>
                <Paragraph
                  ellipsis={{ rows: 6, expandable: true, symbol: t('quickView.readMore') || '展开更多' }}
                  style={{ fontSize: '14px', lineHeight: '1.8', color: '#595959' }}
                >
                  {card.translated_content || card.content}
                </Paragraph>
                {card.translated_content && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    🌐 {t('quickView.translated') || 'AI翻译'}
                  </Text>
                )}
              </div>
            )}

            {/* 底部提示 */}
            <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f0f5ff', borderRadius: '4px' }}>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                💡 {t('quickView.deepReadTip') || '点击"深度阅读"查看完整技术细节、相关讨论和更多信息'}
              </Text>
            </div>
          </div>
        ) : (
          <Empty description={t('quickView.noData') || '暂无数据'} />
        )}
      </Spin>
    </Modal>
  );
};

export default QuickViewModal;
