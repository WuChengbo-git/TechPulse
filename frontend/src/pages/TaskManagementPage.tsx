import React, { useState, useEffect } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  DatePicker, Switch, Typography, Popconfirm, message, Badge,
  Row, Col, Statistic, Progress
} from 'antd'
import {
  UnorderedListOutlined, PlayCircleOutlined, PauseCircleOutlined,
  DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  SyncOutlined, EyeOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Option } = Select

interface Task {
  id: number
  name: string
  type: 'github' | 'arxiv' | 'huggingface' | 'zenn' | 'all'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  schedule: 'manual' | 'hourly' | 'daily' | 'weekly'
  next_run: string
  last_run?: string
  success_count: number
  failure_count: number
  enabled: boolean
  created_at: string
}

const TaskManagementPage: React.FC = () => {
  const { t } = useLanguage()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form] = Form.useForm()

  // Mock data - 実際はAPIから取得
  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    // TODO: API呼び出し
    setTimeout(() => {
      setTasks([
        {
          id: 1,
          name: 'GitHub Trending Daily Sync',
          type: 'github',
          status: 'completed',
          schedule: 'daily',
          next_run: '2025-10-08 09:00:00',
          last_run: '2025-10-07 09:00:00',
          success_count: 145,
          failure_count: 2,
          enabled: true,
          created_at: '2025-09-01 10:00:00'
        },
        {
          id: 2,
          name: 'arXiv Papers Collection',
          type: 'arxiv',
          status: 'running',
          schedule: 'daily',
          next_run: '2025-10-08 10:00:00',
          last_run: '2025-10-07 10:00:00',
          success_count: 132,
          failure_count: 5,
          enabled: true,
          created_at: '2025-09-01 10:00:00'
        },
        {
          id: 3,
          name: 'Hugging Face Models Sync',
          type: 'huggingface',
          status: 'pending',
          schedule: 'weekly',
          next_run: '2025-10-14 08:00:00',
          last_run: '2025-10-07 08:00:00',
          success_count: 20,
          failure_count: 1,
          enabled: true,
          created_at: '2025-09-05 10:00:00'
        },
        {
          id: 4,
          name: 'Zenn Articles Hourly Update',
          type: 'zenn',
          status: 'paused',
          schedule: 'hourly',
          next_run: '-',
          last_run: '2025-10-07 14:00:00',
          success_count: 890,
          failure_count: 12,
          enabled: false,
          created_at: '2025-09-01 10:00:00'
        },
        {
          id: 5,
          name: 'Full Data Source Sync',
          type: 'all',
          status: 'failed',
          schedule: 'daily',
          next_run: '2025-10-08 02:00:00',
          last_run: '2025-10-07 02:00:00',
          success_count: 35,
          failure_count: 1,
          enabled: true,
          created_at: '2025-09-10 10:00:00'
        }
      ])
      setLoading(false)
    }, 500)
  }

  const getStatusTag = (status: Task['status']) => {
    const statusConfig = {
      pending: { color: 'default', icon: <ClockCircleOutlined />, text: '待機中' },
      running: { color: 'processing', icon: <SyncOutlined spin />, text: '実行中' },
      completed: { color: 'success', icon: <CheckCircleOutlined />, text: '完了' },
      failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失敗' },
      paused: { color: 'warning', icon: <PauseCircleOutlined />, text: '一時停止' }
    }
    const config = statusConfig[status]
    return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>
  }

  const getTypeTag = (type: Task['type']) => {
    const typeConfig = {
      github: { color: 'blue', text: 'GitHub' },
      arxiv: { color: 'orange', text: 'arXiv' },
      huggingface: { color: 'purple', text: 'Hugging Face' },
      zenn: { color: 'cyan', text: 'Zenn' },
      all: { color: 'green', text: '全データ源' }
    }
    const config = typeConfig[type]
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const handleRunTask = async (taskId: number) => {
    message.loading({ content: 'タスクを実行中...', key: 'run' })
    // TODO: API呼び出し
    setTimeout(() => {
      message.success({ content: 'タスクを開始しました', key: 'run' })
      loadTasks()
    }, 1000)
  }

  const handlePauseTask = async (taskId: number) => {
    // TODO: API呼び出し
    message.success('タスクを一時停止しました')
    loadTasks()
  }

  const handleDeleteTask = async (taskId: number) => {
    // TODO: API呼び出し
    message.success('タスクを削除しました')
    loadTasks()
  }

  const handleToggleTask = async (taskId: number, enabled: boolean) => {
    // TODO: API呼び出し
    message.success(enabled ? 'タスクを有効化しました' : 'タスクを無効化しました')
    loadTasks()
  }

  const handleCreateTask = () => {
    form.resetFields()
    setEditingTask(null)
    setModalVisible(true)
  }

  const handleEditTask = (task: Task) => {
    form.setFieldsValue({
      ...task,
      next_run: dayjs(task.next_run)
    })
    setEditingTask(task)
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      // TODO: API呼び出し
      message.success(editingTask ? 'タスクを更新しました' : 'タスクを作成しました')
      setModalVisible(false)
      loadTasks()
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const columns = [
    {
      title: 'タスク名',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name: string, record: Task) => (
        <Space direction="vertical" size={0}>
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.id}
          </Text>
        </Space>
      )
    },
    {
      title: 'データソース',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: Task['type']) => getTypeTag(type)
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: Task['status']) => getStatusTag(status)
    },
    {
      title: 'スケジュール',
      dataIndex: 'schedule',
      key: 'schedule',
      width: 100,
      render: (schedule: string) => {
        const scheduleMap: { [key: string]: string } = {
          manual: '手動',
          hourly: '毎時',
          daily: '毎日',
          weekly: '毎週'
        }
        return scheduleMap[schedule] || schedule
      }
    },
    {
      title: '次回実行',
      dataIndex: 'next_run',
      key: 'next_run',
      width: 160,
      render: (time: string) => (
        <Text style={{ fontSize: 12 }}>{time}</Text>
      )
    },
    {
      title: '実行統計',
      key: 'stats',
      width: 120,
      render: (_: any, record: Task) => {
        const total = record.success_count + record.failure_count
        const successRate = total > 0 ? (record.success_count / total * 100).toFixed(1) : '0'
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12 }}>成功: {record.success_count}</Text>
            <Text style={{ fontSize: 12 }} type="secondary">失敗: {record.failure_count}</Text>
            <Progress
              percent={Number(successRate)}
              size="small"
              status={Number(successRate) >= 95 ? 'success' : 'normal'}
              showInfo={false}
            />
          </Space>
        )
      }
    },
    {
      title: '有効/無効',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: Task) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleTask(record.id, checked)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Task) => (
        <Space size="small">
          {record.status !== 'running' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleRunTask(record.id)}
            >
              実行
            </Button>
          )}
          {record.status === 'running' && (
            <Button
              size="small"
              icon={<PauseCircleOutlined />}
              onClick={() => handlePauseTask(record.id)}
            >
              停止
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          />
          <Popconfirm
            title="このタスクを削除しますか？"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="削除"
            cancelText="キャンセル"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 統計情報の計算
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length
  }

  return (
    <div>
      {/* ヘッダー */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UnorderedListOutlined style={{ color: '#1890ff' }} />
              タスク管理
            </Title>
            <Text type="secondary">定期実行タスクの管理と監視</Text>
          </div>

          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadTasks}
              loading={loading}
            >
              更新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTask}
            >
              新規タスク
            </Button>
          </Space>
        </div>
      </div>

      {/* 統計カード */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="総タスク数"
              value={stats.total}
              prefix={<UnorderedListOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="実行中"
              value={stats.running}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined spin={stats.running > 0} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待機中"
              value={stats.pending}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失敗"
              value={stats.failed}
              valueStyle={{ color: stats.failed > 0 ? '#ff4d4f' : undefined }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* タスクテーブル */}
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `総数 ${total} 件`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* タスク作成/編集モーダル */}
      <Modal
        title={editingTask ? 'タスク編集' : '新規タスク作成'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            schedule: 'daily',
            enabled: true
          }}
        >
          <Form.Item
            name="name"
            label="タスク名"
            rules={[{ required: true, message: 'タスク名を入力してください' }]}
          >
            <Input placeholder="例: GitHub Trending Daily Sync" />
          </Form.Item>

          <Form.Item
            name="type"
            label="データソース"
            rules={[{ required: true, message: 'データソースを選択してください' }]}
          >
            <Select placeholder="データソースを選択">
              <Option value="github">GitHub</Option>
              <Option value="arxiv">arXiv</Option>
              <Option value="huggingface">Hugging Face</Option>
              <Option value="zenn">Zenn</Option>
              <Option value="all">全データソース</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="schedule"
            label="実行頻度"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="manual">手動実行のみ</Option>
              <Option value="hourly">毎時</Option>
              <Option value="daily">毎日</Option>
              <Option value="weekly">毎週</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="next_run"
            label="次回実行時刻"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="有効化"
            valuePropName="checked"
          >
            <Switch checkedChildren="有効" unCheckedChildren="無効" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TaskManagementPage
