/**
 * 系统配置管理页面
 * 支持配置的查看、编辑、验证和备份恢复
 */
import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  message,
  Modal,
  Tag,
  Space,
  Tooltip,
  Popconfirm,
  Alert,
  Badge,
  Upload,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import {
  ReloadOutlined,
  SaveOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  HistoryOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UndoOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import systemConfigService, {
  SystemConfig,
  ConfigValidation,
  ConfigBackup
} from '../services/systemConfigService'

interface ConfigItem {
  key: string
  value: string
  isSensitive: boolean
  isModified: boolean
}

const SystemConfigPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState<SystemConfig>({})
  const [originalConfig, setOriginalConfig] = useState<SystemConfig>({})
  const [editedConfig, setEditedConfig] = useState<SystemConfig>({})
  const [sensitiveKeys, setSensitiveKeys] = useState<string[]>([])
  const [validation, setValidation] = useState<ConfigValidation | null>(null)
  const [backups, setBackups] = useState<ConfigBackup[]>([])
  const [showSensitive, setShowSensitive] = useState(false)
  const [backupModalVisible, setBackupModalVisible] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    loadConfig()
    loadSensitiveKeys()
  }, [])

  /**
   * 加载配置
   */
  const loadConfig = async () => {
    setLoading(true)
    try {
      const response = await systemConfigService.getConfig(showSensitive)
      setConfig(response.config)
      setOriginalConfig(response.config)
      setEditedConfig({})
      setTotalItems(response.total_items)
    } catch (error: any) {
      message.error(`加载配置失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载敏感键列表
   */
  const loadSensitiveKeys = async () => {
    try {
      const response = await systemConfigService.getConfigKeys()
      setSensitiveKeys(response.sensitive_keys)
    } catch (error: any) {
      console.error('Failed to load sensitive keys:', error)
    }
  }

  /**
   * 验证配置
   */
  const validateConfig = async () => {
    setLoading(true)
    try {
      const result = await systemConfigService.validateConfig()
      setValidation(result)

      if (result.valid) {
        message.success('配置验证通过')
      } else {
        message.warning(`配置存在 ${result.errors.length} 个错误`)
      }
    } catch (error: any) {
      message.error(`验证失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 保存配置
   */
  const saveConfig = async () => {
    if (Object.keys(editedConfig).length === 0) {
      message.info('没有修改需要保存')
      return
    }

    setLoading(true)
    try {
      const result = await systemConfigService.updateConfig(
        editedConfig,
        true
      )
      message.success(`成功更新 ${result.updated_keys.length} 个配置项`)
      await loadConfig()
      setEditedConfig({})
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 重载配置
   */
  const reloadConfig = async () => {
    setLoading(true)
    try {
      await systemConfigService.reloadConfig()
      await loadConfig()
      message.success('配置已重新加载')
    } catch (error: any) {
      message.error(`重载失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 恢复默认配置
   */
  const restoreDefaults = async () => {
    setLoading(true)
    try {
      await systemConfigService.restoreDefaults()
      await loadConfig()
      message.success('已恢复默认配置')
    } catch (error: any) {
      message.error(`恢复失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载备份列表
   */
  const loadBackups = async () => {
    try {
      const response = await systemConfigService.listBackups()
      setBackups(response.backups)
      setBackupModalVisible(true)
    } catch (error: any) {
      message.error(`加载备份失败: ${error.message}`)
    }
  }

  /**
   * 从备份恢复
   */
  const restoreFromBackup = async (backupFilename?: string) => {
    setLoading(true)
    try {
      await systemConfigService.restoreFromBackup(backupFilename)
      await loadConfig()
      setBackupModalVisible(false)
      message.success('配置已从备份恢复')
    } catch (error: any) {
      message.error(`恢复失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 导出配置
   */
  const exportConfig = async () => {
    try {
      const configJson = await systemConfigService.exportConfig(showSensitive)
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `config_export_${new Date().getTime()}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('配置已导出')
    } catch (error: any) {
      message.error(`导出失败: ${error.message}`)
    }
  }

  /**
   * 处理配置值变化
   */
  const handleValueChange = (key: string, value: string) => {
    setEditedConfig({
      ...editedConfig,
      [key]: value
    })
  }

  /**
   * 准备表格数据
   */
  const prepareTableData = (): ConfigItem[] => {
    return Object.keys(config).map(key => ({
      key,
      value: editedConfig[key] !== undefined ? editedConfig[key] : config[key],
      isSensitive: sensitiveKeys.includes(key),
      isModified: editedConfig[key] !== undefined
    }))
  }

  /**
   * 表格列定义
   */
  const columns: ColumnsType<ConfigItem> = [
    {
      title: '配置键',
      dataIndex: 'key',
      key: 'key',
      width: '30%',
      render: (text: string, record: ConfigItem) => (
        <Space>
          <span style={{ fontFamily: 'monospace' }}>{text}</span>
          {record.isSensitive && (
            <Tag color="orange" icon={<WarningOutlined />}>
              敏感
            </Tag>
          )}
          {record.isModified && (
            <Tag color="blue">已修改</Tag>
          )}
        </Space>
      )
    },
    {
      title: '配置值',
      dataIndex: 'value',
      key: 'value',
      width: '50%',
      render: (text: string, record: ConfigItem) => {
        const displayValue = record.isSensitive && !showSensitive
          ? text
          : text

        return (
          <Input
            value={record.isModified ? editedConfig[record.key] : text}
            onChange={(e) => handleValueChange(record.key, e.target.value)}
            type={record.isSensitive && !showSensitive ? 'password' : 'text'}
            placeholder={`${record.key} 的值`}
            style={{ fontFamily: 'monospace' }}
          />
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_: any, record: ConfigItem) => (
        <Space>
          {record.isModified && (
            <Button
              size="small"
              onClick={() => {
                const newEdited = { ...editedConfig }
                delete newEdited[record.key]
                setEditedConfig(newEdited)
              }}
            >
              撤销
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <span>系统配置管理</span>
            {validation && (
              <Badge
                status={validation.valid ? 'success' : 'error'}
                text={validation.valid ? '配置有效' : '配置有误'}
              />
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={showSensitive ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              onClick={() => setShowSensitive(!showSensitive)}
            >
              {showSensitive ? '隐藏' : '显示'}敏感信息
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={reloadConfig}
              loading={loading}
            >
              重载
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="配置项总数"
              value={totalItems}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已修改项"
              value={Object.keys(editedConfig).length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="验证错误"
              value={validation?.errors.length || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="验证警告"
              value={validation?.warnings.length || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
        </Row>

        {/* 验证提示 */}
        {validation && !validation.valid && (
          <Alert
            message="配置验证失败"
            description={
              <div>
                {validation.errors.map((error, index) => (
                  <div key={index} style={{ color: '#cf1322' }}>
                    • {error}
                  </div>
                ))}
              </div>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {validation && validation.warnings.length > 0 && (
          <Alert
            message="配置警告"
            description={
              <div>
                {validation.warnings.map((warning, index) => (
                  <div key={index}>• {warning}</div>
                ))}
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 操作按钮 */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={saveConfig}
            loading={loading}
            disabled={Object.keys(editedConfig).length === 0}
          >
            保存配置
          </Button>
          <Button
            icon={<CheckCircleOutlined />}
            onClick={validateConfig}
            loading={loading}
          >
            验证配置
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={exportConfig}
          >
            导出配置
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={loadBackups}
          >
            查看备份
          </Button>
          <Divider type="vertical" />
          <Popconfirm
            title="确定要恢复默认配置吗？"
            description="这将覆盖当前所有配置，无法撤销。"
            onConfirm={restoreDefaults}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<UndoOutlined />}
              loading={loading}
            >
              恢复默认
            </Button>
          </Popconfirm>
        </Space>

        {/* 配置表格 */}
        <Table
          columns={columns}
          dataSource={prepareTableData()}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 项配置`
          }}
          rowKey="key"
        />
      </Card>

      {/* 备份管理弹窗 */}
      <Modal
        title="配置备份管理"
        open={backupModalVisible}
        onCancel={() => setBackupModalVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          dataSource={backups}
          rowKey="filename"
          columns={[
            {
              title: '备份文件',
              dataIndex: 'filename',
              key: 'filename'
            },
            {
              title: '创建时间',
              dataIndex: 'created_at',
              key: 'created_at',
              render: (timestamp: number) =>
                new Date(timestamp * 1000).toLocaleString('zh-CN')
            },
            {
              title: '文件大小',
              dataIndex: 'size',
              key: 'size',
              render: (size: number) => `${(size / 1024).toFixed(2)} KB`
            },
            {
              title: '操作',
              key: 'action',
              render: (_: any, record: ConfigBackup) => (
                <Popconfirm
                  title="确定要从此备份恢复配置吗？"
                  onConfirm={() => restoreFromBackup(record.filename)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" size="small">
                    恢复
                  </Button>
                </Popconfirm>
              )
            }
          ]}
          pagination={false}
        />
      </Modal>
    </div>
  )
}

export default SystemConfigPage
