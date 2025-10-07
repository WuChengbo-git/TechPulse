import React, { useState, useEffect } from 'react'
import {
  Card, Row, Col, Statistic, Progress, Table, Tag, Space, Typography,
  Button, Badge, Timeline, Divider, Alert
} from 'antd'
import {
  MonitorOutlined, DatabaseOutlined, ApiOutlined, CloudServerOutlined,
  CheckCircleOutlined, CloseCircleOutlined, WarningOutlined,
  SyncOutlined, ReloadOutlined, LineChartOutlined, ClockCircleOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import { Line, Column } from '@ant-design/charts'

const { Title, Text } = Typography

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error'
  response_time: number
  last_check: string
  uptime: number
}

interface APIUsage {
  api: string
  requests_today: number
  limit: number
  last_used: string
}

const SystemStatusPage: React.FC = () => {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [systemHealth, setSystemHealth] = useState({
    cpu: 45,
    memory: 62,
    disk: 38,
    network: 23
  })

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Backend API',
      status: 'healthy',
      response_time: 45,
      last_check: '2025-10-07 15:30:25',
      uptime: 99.9
    },
    {
      name: 'Database',
      status: 'healthy',
      response_time: 12,
      last_check: '2025-10-07 15:30:25',
      uptime: 99.8
    },
    {
      name: 'GitHub API',
      status: 'healthy',
      response_time: 234,
      last_check: '2025-10-07 15:29:15',
      uptime: 98.5
    },
    {
      name: 'arXiv API',
      status: 'warning',
      response_time: 1523,
      last_check: '2025-10-07 15:28:45',
      uptime: 95.2
    },
    {
      name: 'Hugging Face API',
      status: 'healthy',
      response_time: 456,
      last_check: '2025-10-07 15:30:10',
      uptime: 97.8
    },
    {
      name: 'OpenAI API',
      status: 'healthy',
      response_time: 678,
      last_check: '2025-10-07 15:29:55',
      uptime: 99.2
    }
  ])

  const [apiUsage, setApiUsage] = useState<APIUsage[]>([
    {
      api: 'GitHub API',
      requests_today: 3420,
      limit: 5000,
      last_used: '2025-10-07 15:25:30'
    },
    {
      api: 'OpenAI API',
      requests_today: 856,
      limit: 10000,
      last_used: '2025-10-07 15:28:12'
    },
    {
      api: 'Hugging Face API',
      requests_today: 234,
      limit: 1000,
      last_used: '2025-10-07 15:12:45'
    },
    {
      api: 'arXiv API',
      requests_today: 145,
      limit: 1000,
      last_used: '2025-10-07 14:55:20'
    }
  ])

  // リソース使用履歴データ（過去24時間）
  const resourceHistory = [
    { time: '00:00', cpu: 35, memory: 55, network: 15 },
    { time: '04:00', cpu: 28, memory: 52, network: 12 },
    { time: '08:00', cpu: 42, memory: 58, network: 25 },
    { time: '12:00', cpu: 55, memory: 65, network: 35 },
    { time: '16:00', cpu: 45, memory: 62, network: 23 },
    { time: '20:00', cpu: 38, memory: 60, network: 18 }
  ]

  const refreshStatus = async () => {
    setLoading(true)
    // TODO: 実際のAPIから取得
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const getStatusBadge = (status: ServiceStatus['status']) => {
    const statusConfig = {
      healthy: { status: 'success' as const, icon: <CheckCircleOutlined />, text: '正常' },
      warning: { status: 'warning' as const, icon: <WarningOutlined />, text: '警告' },
      error: { status: 'error' as const, icon: <CloseCircleOutlined />, text: 'エラー' }
    }
    const config = statusConfig[status]
    return <Badge status={config.status} text={config.text} />
  }

  const serviceColumns = [
    {
      title: 'サービス名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: ServiceStatus['status']) => getStatusBadge(status)
    },
    {
      title: '応答時間',
      dataIndex: 'response_time',
      key: 'response_time',
      render: (time: number) => {
        const color = time < 100 ? '#52c41a' : time < 500 ? '#faad14' : '#ff4d4f'
        return <Text style={{ color }}>{time}ms</Text>
      }
    },
    {
      title: '稼働率',
      dataIndex: 'uptime',
      key: 'uptime',
      render: (uptime: number) => {
        const status = uptime >= 99 ? 'success' : uptime >= 95 ? 'normal' : 'exception'
        return (
          <Space>
            <Progress
              type="circle"
              percent={uptime}
              width={50}
              status={status}
              format={(percent) => `${percent}%`}
            />
          </Space>
        )
      }
    },
    {
      title: '最終確認',
      dataIndex: 'last_check',
      key: 'last_check',
      render: (time: string) => <Text type="secondary" style={{ fontSize: 12 }}>{time}</Text>
    }
  ]

  const apiColumns = [
    {
      title: 'API名',
      dataIndex: 'api',
      key: 'api',
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '今日の使用量',
      dataIndex: 'requests_today',
      key: 'requests_today',
      render: (requests: number, record: APIUsage) => {
        const percentage = (requests / record.limit) * 100
        const status = percentage >= 90 ? 'exception' : percentage >= 70 ? 'normal' : 'success'
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>{requests.toLocaleString()} / {record.limit.toLocaleString()}</Text>
            <Progress percent={Number(percentage.toFixed(1))} status={status} />
          </Space>
        )
      }
    },
    {
      title: '最終使用',
      dataIndex: 'last_used',
      key: 'last_used',
      render: (time: string) => <Text type="secondary" style={{ fontSize: 12 }}>{time}</Text>
    }
  ]

  // リソース使用率チャート設定
  const lineConfig = {
    data: resourceHistory.flatMap(item => [
      { time: item.time, value: item.cpu, category: 'CPU' },
      { time: item.time, value: item.memory, category: 'メモリ' },
      { time: item.time, value: item.network, category: 'ネットワーク' }
    ]),
    xField: 'time',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000
      }
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${v}%`
      }
    }
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MonitorOutlined style={{ color: '#1890ff' }} />
              システムステータス
            </Title>
            <Text type="secondary">システムの健全性とリソース使用状況</Text>
          </div>

          <Button
            icon={<ReloadOutlined />}
            onClick={refreshStatus}
            loading={loading}
          >
            更新
          </Button>
        </div>
      </div>

      {/* 全体ステータス */}
      <Alert
        message="システムは正常に稼働中"
        description="すべてのコアサービスが正常に動作しています。一部の外部APIで軽微な遅延が検出されています。"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

      {/* リソース使用状況 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="CPU使用率"
              value={systemHealth.cpu}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: systemHealth.cpu > 80 ? '#ff4d4f' : '#3f8600' }}
            />
            <Progress
              percent={systemHealth.cpu}
              status={systemHealth.cpu > 80 ? 'exception' : 'normal'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="メモリ使用率"
              value={systemHealth.memory}
              suffix="%"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: systemHealth.memory > 80 ? '#ff4d4f' : '#3f8600' }}
            />
            <Progress
              percent={systemHealth.memory}
              status={systemHealth.memory > 80 ? 'exception' : 'normal'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="ディスク使用率"
              value={systemHealth.disk}
              suffix="%"
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: systemHealth.disk > 80 ? '#ff4d4f' : '#3f8600' }}
            />
            <Progress
              percent={systemHealth.disk}
              status={systemHealth.disk > 80 ? 'exception' : 'normal'}
              showInfo={false}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="ネットワーク使用率"
              value={systemHealth.network}
              suffix="%"
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress
              percent={systemHealth.network}
              status="normal"
              showInfo={false}
            />
          </Card>
        </Col>
      </Row>

      {/* リソース使用履歴グラフ */}
      <Card title="リソース使用履歴（過去24時間）" style={{ marginBottom: 24 }}>
        <Line {...lineConfig} height={300} />
      </Card>

      {/* サービスステータス */}
      <Card title="サービスステータス" style={{ marginBottom: 24 }}>
        <Table
          columns={serviceColumns}
          dataSource={services}
          rowKey="name"
          pagination={false}
        />
      </Card>

      {/* API使用状況 */}
      <Card title="API使用状況" style={{ marginBottom: 24 }}>
        <Table
          columns={apiColumns}
          dataSource={apiUsage}
          rowKey="api"
          pagination={false}
        />
      </Card>

      {/* システムログ */}
      <Card title="最近のシステムイベント">
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <Text strong>システム起動</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>2025-10-07 09:00:00</Text>
                  <br />
                  <Text type="secondary">すべてのサービスが正常に起動しました</Text>
                </>
              )
            },
            {
              color: 'blue',
              children: (
                <>
                  <Text strong>データ収集完了</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>2025-10-07 10:00:00</Text>
                  <br />
                  <Text type="secondary">GitHub Trending: 50件、arXiv: 120件を収集</Text>
                </>
              )
            },
            {
              color: 'orange',
              children: (
                <>
                  <Text strong>API応答遅延検出</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>2025-10-07 14:25:00</Text>
                  <br />
                  <Text type="secondary">arXiv APIの応答時間が通常より遅延しています（1523ms）</Text>
                </>
              )
            },
            {
              color: 'green',
              children: (
                <>
                  <Text strong>自動バックアップ完了</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>2025-10-07 15:00:00</Text>
                  <br />
                  <Text type="secondary">データベースのバックアップが正常に完了しました</Text>
                </>
              )
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default SystemStatusPage
