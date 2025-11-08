import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Tag, Space, Empty } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  StarOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const { Title, Text } = Typography;

interface TrendData {
  total_cards: number;
  today_cards: number;
  source_distribution: Array<{ source: string; count: number }>;
  daily_trend: Array<{ date: string; count: number }>;
  field_distribution: Array<{ field: string; count: number }>;
  top_tags: Array<{ tag: string; count: number }>;
}

const TrendsPageNew: React.FC = () => {
  const { t } = useLanguage();
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrendsData();
  }, []);

  const fetchTrendsData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/trends/overview');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceIcon = (source: string) => {
    const lowerSource = source.toLowerCase();
    if (lowerSource.includes('github')) return <GithubOutlined style={{ fontSize: 24, color: '#1890ff' }} />;
    if (lowerSource.includes('arxiv')) return <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />;
    if (lowerSource.includes('huggingface')) return <RobotOutlined style={{ fontSize: 24, color: '#faad14' }} />;
    if (lowerSource.includes('zenn')) return <BookOutlined style={{ fontSize: 24, color: '#13c2c2' }} />;
    return <FileTextOutlined style={{ fontSize: 24 }} />;
  };

  const getFieldColor = (index: number) => {
    const colors = ['blue', 'green', 'orange', 'purple', 'cyan', 'magenta', 'lime', 'geekblue'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="加载失败" />
      </div>
    );
  }

  // 计算7天平均新增
  const recentDays = data.daily_trend.slice(-7);
  const avgDaily = recentDays.length > 0
    ? Math.round(recentDays.reduce((sum, item) => sum + item.count, 0) / recentDays.length)
    : 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          📈 {t('trends.title') || 'AI 技术趋势'}
        </Title>
        <Text type="secondary">
          {t('trends.subtitle') || '探索 AI 技术发展趋势和热门方向'}
        </Text>
      </div>

      {/* 总览统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总项目数"
              value={data.total_cards}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新增"
              value={data.today_cards}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="7日平均"
              value={avgDaily}
              suffix="/ 天"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="数据源"
              value={data.source_distribution.length}
              suffix="个"
              prefix={<StarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据源分布 */}
      <Card
        title="📊 数据源分布"
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {data.source_distribution.map((item) => (
            <Col key={item.source} xs={24} sm={12} md={6}>
              <Card hoverable>
                <div style={{ textAlign: 'center' }}>
                  {getSourceIcon(item.source)}
                  <div style={{ marginTop: '12px' }}>
                    <Text strong style={{ fontSize: '16px' }}>{item.source.toUpperCase()}</Text>
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <Statistic
                      value={item.count}
                      suffix="项"
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {((item.count / data.total_cards) * 100).toFixed(1)}%
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 热门领域 */}
      <Card
        title="🔥 热门技术领域"
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {data.field_distribution.slice(0, 8).map((item, index) => (
            <Col key={item.field} xs={24} sm={12} md={6}>
              <Card style={{ height: '100%' }}>
                <Statistic
                  title={item.field}
                  value={item.count}
                  suffix="项"
                  valueStyle={{ color: getFieldColor(index) }}
                />
                <div style={{ marginTop: '8px' }}>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${(item.count / data.field_distribution[0].count) * 100}%`,
                        height: '100%',
                        backgroundColor: getFieldColor(index),
                      }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 热门技术标签 */}
      <Card
        title="🏷️ 热门技术标签 Top 20"
        style={{ marginBottom: '24px' }}
      >
        <Space size="middle" wrap>
          {data.top_tags.map((item, index) => (
            <Tag
              key={item.tag}
              color={getFieldColor(index)}
              style={{
                fontSize: index < 5 ? '16px' : '14px',
                padding: index < 5 ? '8px 16px' : '4px 12px',
              }}
            >
              {item.tag} ({item.count})
            </Tag>
          ))}
        </Space>
      </Card>

      {/* 最近30天趋势 */}
      <Card title="📅 最近30天新增趋势">
        <div style={{ overflowX: 'auto' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {data.daily_trend.slice(-30).map((item) => (
              <div
                key={item.date}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Text style={{ width: '100px', fontSize: '12px' }}>{item.date}</Text>
                <div
                  style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(item.count / Math.max(...data.daily_trend.map((d) => d.count))) * 100}%`,
                      height: '100%',
                      backgroundColor: '#1890ff',
                    }}
                  />
                </div>
                <Text style={{ width: '50px', textAlign: 'right' }}>{item.count}</Text>
              </div>
            ))}
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default TrendsPageNew;
