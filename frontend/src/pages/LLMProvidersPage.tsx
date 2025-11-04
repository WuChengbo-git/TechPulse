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
import { useLanguage } from '../contexts/LanguageContext'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Option } = Select

const LLMProvidersPage: React.FC = () => {
  const { t } = useLanguage()
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
      console.log('API返回的providers数据:', data)
      setProviders(data)
    } catch (error: any) {
      if (error.response?.status !== 401) {
        message.error(t('llmProviders.loadProvidersFailed'))
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
      message.error(t('llmProviders.loadModelsFailed'))
    }
  }

  // 关闭模态框
  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingProvider(null)
    setSelectedTemplate(null)
    form.resetFields()
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
    console.log('编辑Provider - 原始数据:', provider)
    console.log('  is_enabled:', provider.is_enabled, 'type:', typeof provider.is_enabled)
    console.log('  is_default:', provider.is_default, 'type:', typeof provider.is_default)

    // 查找对应的模板
    const allTemplates = [
      ...(templates?.cloud_providers || []),
      ...(templates?.local_providers || [])
    ]
    const template = allTemplates.find(t => t.category === provider.provider_category)

    // 先打开模态框
    setEditingProvider(provider)
    setSelectedTemplate(template || null)
    setModalVisible(true)

    // 使用 setTimeout 确保模态框完全渲染后再设置表单值
    setTimeout(() => {
      // 设置表单值
      const formValues = {
        provider_name: provider.provider_name,
        provider_category: provider.provider_category,
        is_enabled: provider.is_enabled,
        is_default: provider.is_default,
        ...provider.config
      }
      console.log('设置表单值:', formValues)
      form.setFieldsValue(formValues)
    }, 0)

    // 加载模型列表
    await loadProviderModels(provider.id)
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
      const defaultConfig: any = {
        is_enabled: true,  // 默认启用
        is_default: false  // 默认不设为默认提供商
      }
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
        message.warning(t('llmProviders.selectProviderTypeFirst'))
        return
      }

      setTestingConnection(true)

      // 构建配置对象
      const config: Record<string, any> = {}
      selectedTemplate.config_fields.forEach(field => {
        // 使用用户输入的值，如果没有则使用默认值
        const value = values[field.name] || field.default
        if (value) {
          config[field.name] = value
        }
      })

      const result = await llmService.testConnection({
        provider_category: selectedTemplate.category,
        config,
        test_model: values.test_model
      })

      // 根据错误码翻译消息
      let translatedMessage = result.message
      if (result.message_code) {
        switch (result.message_code) {
          case 'OLLAMA_CONNECTION_SUCCESS':
            translatedMessage = t('llmProviders.ollamaConnectionSuccess').replace('{count}', result.details?.model_count || 0)
            break
          case 'OLLAMA_HTTP_ERROR':
            translatedMessage = t('llmProviders.ollamaHttpError').replace('{code}', result.details?.status_code || '')
            break
          case 'OLLAMA_CONNECTION_ERROR':
            translatedMessage = t('llmProviders.ollamaConnectionError').replace('{error}', result.details?.error || '')
            break
          case 'CONNECTION_SUCCESS':
            translatedMessage = t('llmProviders.connectionSuccess')
            break
          case 'TEST_NOT_SUPPORTED':
            translatedMessage = t('llmProviders.testNotSupported').replace('{category}', result.details?.category || '')
            break
          case 'TEST_FAILED':
            translatedMessage = t('llmProviders.testFailed').replace('{error}', result.details?.error || '')
            break
          default:
            translatedMessage = result.message
        }
      }

      if (result.success) {
        message.success(translatedMessage)
      } else {
        message.error(translatedMessage)
      }
    } catch (error: any) {
      message.error(t('llmProviders.testConnectionFailed'))
    } finally {
      setTestingConnection(false)
    }
  }

  // 保存提供商
  const handleSaveProvider = async () => {
    try {
      const values = await form.validateFields()

      if (!selectedTemplate && !editingProvider) {
        message.warning(t('llmProviders.selectProviderTypeFirst'))
        return
      }

      const template = selectedTemplate || templates?.cloud_providers.find(
        t => t.category === editingProvider?.provider_category
      ) || templates?.local_providers.find(
        t => t.category === editingProvider?.provider_category
      )

      if (!template) {
        message.error(t('llmProviders.providerTemplateNotFound'))
        return
      }

      // 构建配置对象
      const config: Record<string, any> = {}
      template.config_fields.forEach(field => {
        // 使用用户输入的值，如果为空字符串或undefined则使用默认值
        const value = values[field.name] || field.default
        if (value !== undefined) {
          config[field.name] = value
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
        message.success(t('llmProviders.providerUpdatedSuccess'))
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
        message.success(t('llmProviders.providerCreatedSuccess'))
      }

      handleCloseModal()
      loadProviders()
    } catch (error: any) {
      if (error.errorFields) {
        message.error(t('llmProviders.fillRequiredFields'))
      } else {
        message.error(t('llmProviders.saveFailed'))
      }
    }
  }

  // 删除提供商
  const handleDeleteProvider = async (providerId: number) => {
    try {
      await llmService.deleteProvider(providerId)
      message.success(t('llmProviders.providerDeletedSuccess'))
      loadProviders()
    } catch (error) {
      message.error(t('llmProviders.deleteFailed'))
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

      message.success(t('llmProviders.modelAddedSuccess'))
      setModelModalVisible(false)
      await loadProviderModels(editingProvider.id)
    } catch (error: any) {
      if (error.errorFields) {
        message.error(t('llmProviders.fillRequiredFields'))
      } else {
        message.error(t('llmProviders.saveModelFailed'))
      }
    }
  }

  // 删除模型
  const handleDeleteModel = async (modelId: number) => {
    try {
      await llmService.deleteModel(modelId)
      message.success(t('llmProviders.modelDeletedSuccess'))
      if (editingProvider) {
        await loadProviderModels(editingProvider.id)
      }
    } catch (error) {
      message.error(t('llmProviders.deleteModelFailed'))
    }
  }

  // 表格列定义
  const columns: ColumnsType<LLMProvider> = [
    {
      title: t('llmProviders.providerName'),
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
          {record.is_default && <Tag color="blue">{t('llmProviders.default')}</Tag>}
        </Space>
      )
    },
    {
      title: t('llmProviders.type'),
      dataIndex: 'provider_category',
      key: 'provider_category',
      render: (category) => {
        const labels: Record<string, string> = {
          openai: 'OpenAI',
          azure_openai: 'Azure OpenAI',
          anthropic: 'Anthropic',
          ollama: 'Ollama',
          lm_studio: 'LM Studio',
          custom: t('llmProviders.custom')
        }
        return <Tag>{labels[category] || category}</Tag>
      }
    },
    {
      title: t('llmProviders.status'),
      key: 'status',
      render: (_, record) => (
        <Space>
          <Badge
            status={record.is_enabled ? 'success' : 'default'}
            text={record.is_enabled ? t('llmProviders.enabled') : t('llmProviders.disabled')}
          />
          {record.validation_status === 'success' && (
            <Tooltip title={t('llmProviders.connectionNormal')}>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Tooltip>
          )}
          {record.validation_status === 'failed' && (
            <Tooltip title={t('llmProviders.connectionFailed')}>
              <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: t('llmProviders.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: t('llmProviders.actions'),
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditProvider(record)}
          >
            {t('llmProviders.edit')}
          </Button>
          <Popconfirm
            title={t('llmProviders.deleteProviderConfirm')}
            description={t('llmProviders.deleteProviderWarning')}
            onConfirm={() => handleDeleteProvider(record.id)}
            okText={t('llmProviders.confirm')}
            cancelText={t('llmProviders.cancel')}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              {t('llmProviders.delete')}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  // 模型表格列定义
  const modelColumns: ColumnsType<LLMModel> = [
    {
      title: t('llmProviders.modelName'),
      dataIndex: 'model_name',
      key: 'model_name',
      render: (name, record) => (
        <Space>
          <Text strong>{record.display_name || name}</Text>
          {record.is_default && <Tag color="blue">{t('llmProviders.default')}</Tag>}
        </Space>
      )
    },
    {
      title: t('llmProviders.maxTokens'),
      dataIndex: 'max_tokens',
      key: 'max_tokens'
    },
    {
      title: t('llmProviders.contextWindow'),
      dataIndex: 'context_window',
      key: 'context_window'
    },
    {
      title: t('llmProviders.status'),
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      render: (enabled) => (
        <Badge status={enabled ? 'success' : 'default'} text={enabled ? t('llmProviders.enabled') : t('llmProviders.disabled')} />
      )
    },
    {
      title: t('llmProviders.actions'),
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title={t('llmProviders.deleteModelConfirm')}
          onConfirm={() => handleDeleteModel(record.id)}
          okText={t('llmProviders.confirm')}
          cancelText={t('llmProviders.cancel')}
        >
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>
            {t('llmProviders.delete')}
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
            <ApiOutlined /> {t('llmProviders.pageTitle')}
          </Title>
          <Paragraph type="secondary">
            {t('llmProviders.pageDescription')}
          </Paragraph>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadProviders}>
              {t('llmProviders.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProvider}>
              {t('llmProviders.addProvider')}
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
          locale={{ emptyText: t('llmProviders.noProvidersHint') }}
        />
      </Card>

      {/* 提供商配置模态框 */}
      <Modal
        title={editingProvider ? t('llmProviders.editProvider') : t('llmProviders.addProvider')}
        open={modalVisible}
        onOk={handleSaveProvider}
        onCancel={handleCloseModal}
        width={800}
        okText={t('llmProviders.save')}
        cancelText={t('llmProviders.cancel')}
      >
        <Form form={form} layout="vertical">
          {!editingProvider && (
            <Form.Item
              label={t('llmProviders.providerType')}
              name="provider_category"
              rules={[{ required: true, message: t('llmProviders.selectProviderType') }]}
            >
              <Select
                placeholder={t('llmProviders.chooseProviderType')}
                onChange={handleSelectTemplate}
              >
                <Select.OptGroup label={t('llmProviders.cloudProvider')}>
                  {templates?.cloud_providers.map(t => (
                    <Option key={t.category} value={t.category}>
                      <Space>
                        <CloudOutlined />
                        {t.name}
                      </Space>
                    </Option>
                  ))}
                </Select.OptGroup>
                <Select.OptGroup label={t('llmProviders.localProvider')}>
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
            label={t('llmProviders.providerName')}
            name="provider_name"
            rules={[{ required: true, message: t('llmProviders.inputProviderName') }]}
          >
            <Input placeholder={t('llmProviders.exampleOpenAI')} />
          </Form.Item>

          {selectedTemplate?.config_fields.map(field => (
            <Form.Item
              key={field.name}
              label={field.label}
              name={field.name}
              rules={[{ required: field.required, message: `Please enter ${field.label}` }]}
            >
              {field.type === 'password' ? (
                <Input.Password placeholder={field.default} />
              ) : (
                <Input placeholder={field.default} />
              )}
            </Form.Item>
          ))}

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Form.Item name="is_enabled" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <Text style={{ marginLeft: 8 }}>{t('llmProviders.enabled')}</Text>
            </Space>

            <Space>
              <Form.Item name="is_default" valuePropName="checked" noStyle>
                <Switch />
              </Form.Item>
              <Text style={{ marginLeft: 8 }}>{t('llmProviders.setAsDefault')}</Text>
            </Space>

            {selectedTemplate && (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={handleTestConnection}
                loading={testingConnection}
              >
                {t('llmProviders.testConnection')}
              </Button>
            )}
          </Space>

          {/* 模型列表（仅编辑时显示） */}
          {editingProvider && (
            <>
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Title level={5}>{t('llmProviders.modelConfiguration')}</Title>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddModel}
                  >
                    {t('llmProviders.addModel')}
                  </Button>
                </Space>
              </div>

              {selectedTemplate && selectedTemplate.default_models.length > 0 && (
                <Alert
                  message={t('llmProviders.quickAdd')}
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
                locale={{ emptyText: t('llmProviders.noModelsHint') }}
              />
            </>
          )}
        </Form>
      </Modal>

      {/* 添加模型模态框 */}
      <Modal
        title={t('llmProviders.addModel')}
        open={modelModalVisible}
        onOk={handleSaveModel}
        onCancel={() => setModelModalVisible(false)}
        okText={t('llmProviders.save')}
        cancelText={t('llmProviders.cancel')}
      >
        <Form form={modelForm} layout="vertical">
          <Form.Item
            label={t('llmProviders.modelName')}
            name="model_name"
            rules={[{ required: true, message: t('llmProviders.inputModelName') }]}
          >
            <Input placeholder={t('llmProviders.exampleGPT4')} />
          </Form.Item>

          <Form.Item label={t('llmProviders.displayName')} name="display_name">
            <Input placeholder={t('llmProviders.exampleGPT4Display')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t('llmProviders.maxTokenCount')}
                name="max_tokens"
                initialValue={4096}
                rules={[{ required: true, message: t('llmProviders.inputMaxTokens') }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t('llmProviders.contextWindow')}
                name="context_window"
                initialValue={4096}
                rules={[{ required: true, message: t('llmProviders.inputContextWindow') }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Form.Item name="is_enabled" valuePropName="checked" initialValue={true} noStyle>
              <Switch defaultChecked /> <Text style={{ marginLeft: 8 }}>{t('llmProviders.enabled')}</Text>
            </Form.Item>

            <Form.Item name="is_default" valuePropName="checked" initialValue={false} noStyle>
              <Switch /> <Text style={{ marginLeft: 8 }}>{t('llmProviders.setAsDefault')}</Text>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

export default LLMProvidersPage
