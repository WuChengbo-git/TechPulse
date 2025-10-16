/**
 * LLM 提供商管理页面
 * 列表式UI，通过模态框进行添加和编辑
 */
import React, { useState, useEffect } from 'react'
import {
  Table, Button, Tag, Space, Modal, Form, Input, Select, Switch,
  message, Popconfirm, Tooltip, Typography, Card, Tabs, InputNumber,
  Spin, Alert, Badge, Row, Col
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CloudOutlined,
  DesktopOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  ReloadOutlined, ApiOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import llmService, {
  LLMProvider,
  LLMModel,
  ProviderTemplate,
  ProviderType,
  ProviderCategory,
  CreateProviderData,
  UpdateProviderData
} from '../services/llmService'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select

const LLMProvidersPage: React.FC = () => {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [templates, setTemplates] = useState<{
    cloud_providers: ProviderTemplate[]
    local_providers: ProviderTemplate[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [modelModalVisible, setModelModalVisible] = useState(false)
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null)
  const [currentProviderModels, setCurrentProviderModels] = useState<LLMModel[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  const [form] = Form.useForm()
  const [modelForm] = Form.useForm()

  // 加载数据
  useEffect(() => {
    loadTemplates()
    loadProviders()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await llmService.getTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const loadProviders = async () => {
    try {
      setLoading(true)
      const data = await llmService.listProviders()
      setProviders(data)
    } catch (error: any) {
      if (error.response?.status !== 401) {
        message.error('加载提供商列表失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadProviderModels = async (providerId: number) => {
    try {
      const models = await llmService.listModels(providerId)
      setCurrentProviderModels(models)
    } catch (error) {
      message.error('加载模型列表失败')
    }
  }

  // 打开添加提供商模态框
  const handleAddProvider = () => {
    setEditingProvider(null)
    setSelectedTemplate(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 打开编辑提供商模态框
  const handleEditProvider = async (provider: LLMProvider) => {
    setEditingProvider(provider)

    // 查找对应的模板
    const allTemplates = [
      ...(templates?.cloud_providers || []),
      ...(templates?.local_providers || [])
    ]
    const template = allTemplates.find(t => t.category === provider.provider_category)
    setSelectedTemplate(template || null)

    // 设置表单值
    form.setFieldsValue({
      provider_name: provider.provider_name,
      provider_category: provider.provider_category,
      is_enabled: provider.is_enabled,
      is_default: provider.is_default,
      ...provider.config
    })

    // 加载模型列表
    await loadProviderModels(provider.id)

    setModalVisible(true)
  }

  // 选择模板
  const handleSelectTemplate = (category: ProviderCategory) => {
    const allTemplates = [
      ...(templates?.cloud_providers || []),
      ...(templates?.local_providers || [])
    ]
    const template = allTemplates.find(t => t.category === category)
    setSelectedTemplate(template || null)

    // 设置默认值
    if (template) {
      const defaultConfig: any = {}
      template.config_fields.forEach(field => {
        if (field.default) {
          defaultConfig[field.name] = field.default
        }
      })
      form.setFieldsValue(defaultConfig)
    }
  }

  // 测试连接
  const handleTestConnection = async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()

      if (!selectedTemplate) {
        message.warning('请先选择提供商类型')
        return
      }

      setTestingConnection(true)

      // 构建配置对象
      const config: Record<string, any> = {}
      selectedTemplate.config_fields.forEach(field => {
        if (values[field.name]) {
          config[field.name] = values[field.name]
        }
      })

      const result = await llmService.testConnection({
        provider_category: selectedTemplate.category,
        config,
        test_model: values.test_model
      })

      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      message.error('测试连接失败')
    } finally {
      setTestingConnection(false)
    }
  }

  // 保存提供商
  const handleSaveProvider = async () => {
    try {
      const values = await form.validateFields()

      if (!selectedTemplate && !editingProvider) {
        message.warning('请先选择提供商类型')
        return
      }

      const template = selectedTemplate || templates?.cloud_providers.find(
        t => t.category === editingProvider?.provider_category
      ) || templates?.local_providers.find(
        t => t.category === editingProvider?.provider_category
      )

      if (!template) {
        message.error('无法找到提供商模板')
        return
      }

      // 构建配置对象
      const config: Record<string, any> = {}
      template.config_fields.forEach(field => {
        if (values[field.name] !== undefined) {
          config[field.name] = values[field.name]
        }
      })

      if (editingProvider) {
        // 更新
        await llmService.updateProvider(editingProvider.id, {
          provider_name: values.provider_name,
          config,
          is_enabled: values.is_enabled,
          is_default: values.is_default
        })
        message.success('提供商更新成功')
      } else {
        // 创建
        await llmService.createProvider({
          provider_name: values.provider_name,
          provider_type: template.type,
          provider_category: template.category,
          config,
          is_enabled: values.is_enabled ?? true,
          is_default: values.is_default ?? false
        })
        message.success('提供商创建成功')
      }

      setModalVisible(false)
      loadProviders()
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段')
      } else {
        message.error('保存失败')
      }
    }
  }

  // 删除提供商
  const handleDeleteProvider = async (providerId: number) => {
    try {
      await llmService.deleteProvider(providerId)
      message.success('提供商删除成功')
      loadProviders()
    } catch (error) {
      message.error('删除失败')
    }
  }

  // 添加模型
  const handleAddModel = () => {
    if (!editingProvider) return
    modelForm.resetFields()
    setModelModalVisible(true)
  }

  // 从模板添加模型
  const handleAddModelFromTemplate = (defaultModel: any) => {
    if (!editingProvider) return
    modelForm.setFieldsValue({
      model_name: defaultModel.model_name,
      display_name: defaultModel.display_name,
      max_tokens: defaultModel.max_tokens,
      context_window: defaultModel.context_window,
      model_type: 'chat',
      default_temperature: '0.7',
      default_top_p: '1.0',
      is_enabled: true,
      is_default: currentProviderModels.length === 0
    })
    setModelModalVisible(true)
  }

  // 保存模型
  const handleSaveModel = async () => {
    if (!editingProvider) return

    try {
      const values = await modelForm.validateFields()

      await llmService.createModel({
        provider_id: editingProvider.id,
        ...values
      })

      message.success('模型添加成功')
      setModelModalVisible(false)
      await loadProviderModels(editingProvider.id)
    } catch (error: any) {
      if (error.errorFields) {
        message.error('请填写必填字段')
      } else {
        message.error('保存模型失败')
      }
    }
  }

  // 删除模型
  const handleDeleteModel = async (modelId: number) => {
    try {
      await llmService.deleteModel(modelId)
      message.success('模型删除成功')
      if (editingProvider) {
        await loadProviderModels(editingProvider.id)
      }
    } catch (error) {
      message.error('删除模型失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<LLMProvider> = [
    {
      title: '提供商名称',
      dataIndex: 'provider_name',
      key: 'provider_name',
      render: (name, record) => (
        <Space>
          {record.provider_type === ProviderType.CLOUD ? (
            <CloudOutlined style={{ color: '#1890ff' }} />
          ) : (
            <DesktopOutlined style={{ color: '#52c41a' }} />
          )}
          <Text strong>{name}</Text>
          {record.is_default && <Tag color="blue">默认</Tag>}
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'provider_category',
      key: 'provider_category',
      render: (category) => {
        const labels: Record<string, string> = {
          openai: 'OpenAI',
          azure_openai: 'Azure OpenAI',
          anthropic: 'Anthropic',
          ollama: 'Ollama',
          lm_studio: 'LM Studio',
          custom: '自定义'
        }
        return <Tag>{labels[category] || category}</Tag>
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Badge
            status={record.is_enabled ? 'success' : 'default'}
            text={record.is_enabled ? '启用' : '禁用'}
          />
          {record.validation_status === 'success' && (
            <Tooltip title="连接正常">
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          {record.validation_status === 'failed' && (
            <Tooltip title="连接失败">
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditProvider(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此提供商吗？"
            description="删除后将同时删除该提供商下的所有模型配置"
            onConfirm={() => handleDeleteProvider(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 模型表格列定义
  const modelColumns: ColumnsType<LLMModel> = [
    {
      title: '模型名称',
      dataIndex: 'model_name',
      key: 'model_name',
      render: (name, record) => (
        <Space>
          <Text strong>{record.display_name || name}</Text>
          {record.is_default && <Tag color="blue">默认</Tag>}
        </Space>
      )
    },
    {
      title: '最大Token',
      dataIndex: 'max_tokens',
      key: 'max_tokens'
    },
    {
      title: '上下文窗口',
      dataIndex: 'context_window',
      key: 'context_window'
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? '启用' : '禁用'} />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定删除此模型吗？"
          onConfirm={() => handleDeleteModel(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <ApiOutlined /> LLM 模型管理
          </Title>
          <Paragraph type="secondary">
            管理云端和本地 LLM 提供商，配置模型参数
          </Paragraph>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadProviders}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProvider}>
              添加提供商
            </Button>
          </Space>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={providers}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无提供商，点击"添加提供商"开始配置' }}
        />
      </Card>

      {/* 提供商配置模态框 */}
      <Modal
        title={editingProvider ? '编辑提供商' : '添加提供商'}
        open={modalVisible}
        onOk={handleSaveProvider}
        onCancel={() => setModalVisible(false)}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          {!editingProvider && (
            <Form.Item
              label="提供商类型"
              name="provider_category"
              rules={[{ required: true, message: '请选择提供商类型' }]}
            >
              <Select
                placeholder="选择提供商类型"
                onChange={handleSelectTemplate}
              >
                <Select.OptGroup label="云端提供商">
                  {templates?.cloud_providers.map(t => (
                    <Option key={t.category} value={t.category}>
                      <Space>
                        <CloudOutlined />
                        {t.name}
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
                <Select.OptGroup label="本地提供商">
                  {templates?.local_providers.map(t => (
                    <Option key={t.category} value={t.category}>
                      <Space>
                        <DesktopOutlined />
                        {t.name}
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
              </Select>
            </Form.Item>
          )}

          {selectedTemplate && (
            <Alert
              message={selectedTemplate.name}
              description={selectedTemplate.description}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Form.Item
            label="提供商名称"
            name="provider_name"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="例如：我的OpenAI" />
          </Form.Item>

          {selectedTemplate?.config_fields.map(field => (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={[{ required: field.required, message: `请输入${field.label}` }]}
            >
              {field.type === 'password' ? (
                <Input.Password placeholder={field.default} />
              ) : (
                <Input placeholder={field.default} />
              )}
            </Form.Item>
          ))}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item name="is_enabled" valuePropName="checked" noStyle>
              <Switch /> <Text style={{ marginLeft: 8 }}>启用</Text>
            </Form.Item>

            <Form.Item name="is_default" valuePropName="checked" noStyle>
              <Switch /> <Text style={{ marginLeft: 8 }}>设为默认</Text>
            </Form.Item>

            {selectedTemplate && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleTestConnection}
                loading={testingConnection}
              >
                测试连接
              </Button>
            )}
          </Space>

          {/* 模型列表（仅编辑时显示） */}
          {editingProvider && (
            <>
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Title level={5}>模型配置</Title>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddModel}
                  >
                    添加模型
                  </Button>
                </Space>
              </div>

              {selectedTemplate && selectedTemplate.default_models.length > 0 && (
                <Alert
                  message="快速添加"
                  description={
                    <Space wrap>
                      {selectedTemplate.default_models.map(model => (
                        <Button
                          key={model.model_name}
                          size="small"
                          onClick={() => handleAddModelFromTemplate(model)}
                        >
                          {model.display_name}
                        </Button>
                      ))}
                    </Space>
                  }
                  type="info"
                  style={{ marginBottom: 16 }}
                />
              )}

              <Table
                columns={modelColumns}
                dataSource={currentProviderModels}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无模型，点击"添加模型"或使用快速添加' }}
              />
            </>
          )}
        </Form>
      </Modal>

      {/* 添加模型模态框 */}
      <Modal
        title="添加模型"
        open={modelModalVisible}
        onOk={handleSaveModel}
        onCancel={() => setModelModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={modelForm} layout="vertical">
          <Form.Item
            label="模型名称"
            name="model_name"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="例如：gpt-4o" />
          </Form.Item>

          <Form.Item label="显示名称" name="display_name">
            <Input placeholder="例如：GPT-4o" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="最大Token数"
                name="max_tokens"
                initialValue={4096}
                rules={[{ required: true, message: '请输入最大Token数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="上下文窗口"
                name="context_window"
                initialValue={4096}
                rules={[{ required: true, message: '请输入上下文窗口' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item name="is_enabled" valuePropName="checked" initialValue={true} noStyle>
              <Switch defaultChecked /> <Text style={{ marginLeft: 8 }}>启用</Text>
            </Form.Item>

            <Form.Item name="is_default" valuePropName="checked" initialValue={false} noStyle>
              <Switch /> <Text style={{ marginLeft: 8 }}>设为默认</Text>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default LLMProvidersPage
