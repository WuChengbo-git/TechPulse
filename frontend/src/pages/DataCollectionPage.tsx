import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Button, Space, Tag, Typography,
  Progress, Alert, Spin, message, Descriptions
} from 'antd';
import {
  SyncOutlined, PlayCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, DatabaseOutlined,
  LineChartOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

interface SchedulerStatus {
  running: boolean;
  pid?: number;
  uptime?: string;
  cpu_usage?: number;
  mem_usage?: number;
  mem_mb?: number;
  last_collection_time?: string;
  statistics?: {
    total_cards: number;
    today_cards: number;
    yesterday_cards: number;
    source_distribution: Record<string, number>;
  };
  schedule?: {
    incremental_update: string;
    full_update: string;
    health_check: string;
  };
  message?: string;
}

const DataCollectionPage: React.FC = () => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // 加载调度器状态
  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/v1/scheduler/status');
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to load scheduler status:', error);
      message.error(t('dataCollection.loadStatusFailed') || '加载调度器状态失败');
    } finally {
      setLoading(false);
    }
  };

  // 手动触发收集
  const handleTriggerCollection = async () => {
    setTriggering(true);
    try {
      await axios.post('/api/v1/scheduler/trigger');
      message.success(t('dataCollection.collectionTriggered') || '数据收集已启动');
      // 3秒后刷新状态
      setTimeout(() => {
        loadStatus();
      }, 3000);
    } catch (error) {
      console.error('Failed to trigger collection:', error);
      message.error(t('dataCollection.triggerFailed') || '触发收集失败');
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // 每30秒自动刷新状态
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  // 数据源图标映射
  const sourceIcons: Record<string, React.ReactNode> = {
    github: '🐙',
    arxiv: '📄',
    huggingface: '🤗',
    zenn: '⚡'
  };

  // 数据源名称映射
  const sourceNames: Record<string, string> = {
    github: 'GitHub',
    arxiv: 'arXiv',
    huggingface: 'Hugging Face',
    zenn: 'Zenn'
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <DatabaseOutlined /> {t('dataCollection.title') || 'データ収集状態'}
      </Title>
      <Paragraph type="secondary">
        {t('dataCollection.subtitle') || '自動データ収集スケジューラの状態と統計情報'}
      </Paragraph>

      {/* 调度器状态卡片 */}
      <Card
        title={
          <Space>
            <SyncOutlined spin={status?.running} />
            {t('dataCollection.schedulerStatus') || 'スケジューラ状態'}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadStatus}
              loading={loading}
            >
              {t('common.refresh') || '更新'}
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {status?.running ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Alert
              message={t('dataCollection.running') || 'スケジューラ実行中'}
              description={
                <Space direction="vertical">
                  <Text>PID: {status.pid}</Text>
                  <Text>{t('dataCollection.uptime') || '稼働時間'}: {status.uptime}</Text>
                  <Text>
                    CPU: {status.cpu_usage?.toFixed(1)}% | {t('dataCollection.memory') || 'メモリ'}: {status.mem_mb ? `${status.mem_mb} MB` : `${status.mem_usage?.toFixed(1)}%`}
                  </Text>
                </Space>
              }
              type="success"
              showIcon
            />

            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title={t('dataCollection.totalCards') || '総データ数'}
                  value={status.statistics?.total_cards || 0}
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('dataCollection.todayCards') || '本日収集'}
                  value={status.statistics?.today_cards || 0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title={t('dataCollection.yesterdayCards') || '昨日収集'}
                  value={status.statistics?.yesterday_cards || 0}
                  prefix={<ClockCircleOutlined />}
                />
              </Col>
            </Row>
          </Space>
        ) : (
          <Alert
            message={t('dataCollection.notRunning') || 'スケジューラが停止しています'}
            description={status?.message || t('dataCollection.checkScheduler') || 'スケジューラを起動してください'}
            type="warning"
            showIcon
          />
        )}
      </Card>

      <Row gutter={16}>
        {/* 收集计划 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                {t('dataCollection.collectionSchedule') || '収集スケジュール'}
              </Space>
            }
          >
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label={t('dataCollection.incrementalUpdate') || '増分更新'}>
                <Tag color="blue">
                  {status?.schedule?.incremental_update === '2_hours'
                    ? (t('dataCollection.every2Hours') || '2時間ごと')
                    : (status?.schedule?.incremental_update || '2時間ごと')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('dataCollection.fullUpdate') || '全量更新'}>
                <Tag color="purple">
                  {status?.schedule?.full_update === 'daily_02:00'
                    ? (t('dataCollection.daily0200') || '毎日 02:00')
                    : (status?.schedule?.full_update || '毎日 02:00')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('dataCollection.healthCheck') || 'ヘルスチェック'}>
                <Tag color="green">
                  {status?.schedule?.health_check === '1_hour'
                    ? (t('dataCollection.everyHour') || '1時間ごと')
                    : (status?.schedule?.health_check || '1時間ごと')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('dataCollection.lastCollection') || '最終収集時刻'}>
                {status?.last_collection_time ? (
                  <Text>{new Date(status.last_collection_time).toLocaleString('ja-JP')}</Text>
                ) : (
                  <Text type="secondary">{t('common.noData') || 'データなし'}</Text>
                )}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTriggerCollection}
                loading={triggering}
                disabled={!status?.running}
                block
              >
                {t('dataCollection.triggerNow') || '今すぐ収集'}
              </Button>
            </div>
          </Card>
        </Col>

        {/* 数据源统计 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LineChartOutlined />
                {t('dataCollection.sourceStatistics') || 'データソース統計'}
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {status?.statistics?.source_distribution &&
                Object.entries(status.statistics.source_distribution).map(([source, count]) => (
                  <div key={source}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Space>
                        <span>{sourceIcons[source]}</span>
                        <Text strong>{sourceNames[source] || source}</Text>
                      </Space>
                      <Text type="secondary">{count} {t('common.items') || '件'}</Text>
                    </div>
                    <Progress
                      percent={
                        status.statistics && status.statistics.total_cards > 0
                          ? Math.round((count / ((status.statistics.today_cards || 0) + (status.statistics.yesterday_cards || 0))) * 100)
                          : 0
                      }
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      size="small"
                    />
                  </div>
                ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 帮助信息 */}
      <Card style={{ marginTop: 16 }}>
        <Paragraph>
          <Text strong>{t('dataCollection.helpTitle') || 'ℹ️ 使用ガイド'}:</Text>
        </Paragraph>
        <ul>
          <li>{t('dataCollection.help1') || 'スケジューラは自動的にデータを収集します（2時間ごと、毎日02:00に全量更新）'}</li>
          <li>{t('dataCollection.help2') || '「今すぐ収集」ボタンで手動でデータ収集をトリガーできます'}</li>
          <li>{t('dataCollection.help3') || 'スケジューラが停止している場合は、システム管理者に連絡してください'}</li>
        </ul>
      </Card>
    </div>
  );
};

export default DataCollectionPage;
