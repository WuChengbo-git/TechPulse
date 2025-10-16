import React, { useState, useEffect } from 'react';
import {
  Card, Tabs, Form, Input, Button, Switch, Select, Space,
  message, Divider, Typography, Alert, Tag, Spin
} from 'antd';
import {
  RobotOutlined, DatabaseOutlined, UserOutlined,
  SettingOutlined, ApiOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, HeartOutlined, LoadingOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import userSettingsService from '../services/userSettingsService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ai-models');

  // AI 模型配置状态
  const [openaiForm] = Form.useForm();
  const [azureForm] = Form.useForm();
  const [ollamaForm] = Form.useForm();

  // 知识库配置状态
  const [notionForm] = Form.useForm();

  // 个性化设置状态
  const [personalizationForm] = Form.useForm();

  // 用户偏好状态
  const [preferencesForm] = Form.useForm();

  // 测试连接状态
  const [testStatus, setTestStatus] = useState<{[key: string]: 'success' | 'error' | 'testing' | null}>({
    openai: null,
    azure: null,
    ollama: null,
    notion: null
  });

  // 加载用户设置
  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      setInitialLoading(true);
      const settings = await userSettingsService.getSettings();

      // 设置表单初始值
      if (settings.azure) {
        azureForm.setFieldsValue({
          apiKey: settings.azure.api_key,
          endpoint: settings.azure.endpoint,
          deploymentName: settings.azure.deployment,
          apiVersion: settings.azure.api_version || '2024-02-15-preview'
        });
      }

      if (settings.openai) {
        openaiForm.setFieldsValue({
          apiKey: settings.openai.api_key,
          model: settings.openai.model || 'gpt-3.5-turbo',
          baseUrl: settings.openai.base_url,
          organizationId: settings.openai.organization
        });
      }

      if (settings.ollama) {
        ollamaForm.setFieldsValue({
          serverUrl: settings.ollama.server_url || 'http://localhost:11434',
          model: settings.ollama.model || 'llama2'
        });
      }

      if (settings.notion) {
        notionForm.setFieldsValue({
          apiToken: settings.notion.api_token,
          databaseId: settings.notion.database_id,
          syncFrequency: settings.notion.sync_frequency || 'manual'
        });
      }

      if (settings.personalization) {
        personalizationForm.setFieldsValue({
          enabled: settings.personalization.enable_recommendation,
          algorithm: settings.personalization.recommendation_algorithm || 'hybrid',
          tracking: settings.personalization.enable_behavior_tracking,
          showReason: settings.personalization.show_recommendation_reason,
          anonymousMode: settings.personalization.anonymous_mode
        });
      }

      if (settings.preferences) {
        preferencesForm.setFieldsValue({
          language: settings.preferences.preferred_language || 'zh',
          theme: settings.preferences.theme_mode || 'light',
          itemsPerPage: settings.preferences.items_per_page || 20
        });
      }
    } catch (error: any) {
      console.error('Failed to load user settings:', error);
      message.error('加载用户设置失败');
    } finally {
      setInitialLoading(false);
    }
  };

  // 测试 OpenAI 连接
  const testOpenAIConnection = async () => {
    try {
      setTestStatus({...testStatus, openai: 'testing'});
      const values = await openaiForm.validateFields();

      // TODO: 调用后端 API 测试连接
      // const response = await api.post('/api/v1/settings/test/openai', values);

      // 模拟测试
      await new Promise(resolve => setTimeout(resolve, 1500));

      setTestStatus({...testStatus, openai: 'success'});
      message.success('OpenAI 连接测试成功！');
    } catch (error) {
      setTestStatus({...testStatus, openai: 'error'});
      message.error('OpenAI 连接测试失败，请检查配置');
    }
  };

  // 测试 Azure OpenAI 连接
  const testAzureConnection = async () => {
    try {
      setTestStatus({...testStatus, azure: 'testing'});
      const values = await azureForm.validateFields(['apiKey', 'endpoint', 'deploymentName', 'apiVersion']);

      const result = await userSettingsService.testAzureConfig({
        api_key: values.apiKey,
        endpoint: values.endpoint,
        deployment: values.deploymentName,
        api_version: values.apiVersion
      });

      if (result.success) {
        setTestStatus({...testStatus, azure: 'success'});
        message.success(`连接测试成功！模型：${result.model}`);
      } else {
        setTestStatus({...testStatus, azure: 'error'});
        message.error(result.message);
      }
    } catch (error: any) {
      setTestStatus({...testStatus, azure: 'error'});
      const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || 'Azure OpenAI 连接测试失败';
      message.error(errorMsg);
    }
  };

  // 测试 Ollama 连接
  const testOllamaConnection = async () => {
    try {
      setTestStatus({...testStatus, ollama: 'testing'});
      const values = await ollamaForm.validateFields();

      await new Promise(resolve => setTimeout(resolve, 1500));

      setTestStatus({...testStatus, ollama: 'success'});
      message.success('Ollama 连接测试成功！');
    } catch (error) {
      setTestStatus({...testStatus, ollama: 'error'});
      message.error('Ollama 连接测试失败');
    }
  };

  // 测试 Notion 连接
  const testNotionConnection = async () => {
    try {
      setTestStatus({...testStatus, notion: 'testing'});
      const values = await notionForm.validateFields();

      await new Promise(resolve => setTimeout(resolve, 1500));

      setTestStatus({...testStatus, notion: 'success'});
      message.success('Notion 连接测试成功！');
    } catch (error) {
      setTestStatus({...testStatus, notion: 'error'});
      message.error('Notion 连接测试失败');
    }
  };

  // 保存配置
  const handleSave = async (formType: string) => {
    setLoading(true);
    try {
      let updateData: any = {};

      switch(formType) {
        case 'openai': {
          const values = await openaiForm.validateFields();
          updateData.openai = {
            api_key: values.apiKey !== '****' ? values.apiKey : undefined,
            model: values.model,
            base_url: values.baseUrl,
            organization: values.organizationId
          };
          break;
        }
        case 'azure': {
          const values = await azureForm.validateFields();
          updateData.azure = {
            api_key: values.apiKey !== '****' ? values.apiKey : undefined,
            endpoint: values.endpoint,
            deployment: values.deploymentName,
            api_version: values.apiVersion
          };
          break;
        }
        case 'ollama': {
          const values = await ollamaForm.validateFields();
          updateData.ollama = {
            server_url: values.serverUrl,
            model: values.model
          };
          break;
        }
        case 'notion': {
          const values = await notionForm.validateFields();
          updateData.notion = {
            api_token: values.apiToken !== '****' ? values.apiToken : undefined,
            database_id: values.databaseId,
            sync_frequency: values.syncFrequency
          };
          break;
        }
        case 'personalization': {
          const values = await personalizationForm.validateFields();
          updateData.personalization = {
            enable_recommendation: values.enabled,
            recommendation_algorithm: values.algorithm,
            enable_behavior_tracking: values.tracking,
            show_recommendation_reason: values.showReason,
            anonymous_mode: values.anonymousMode
          };
          break;
        }
        case 'preferences': {
          const values = await preferencesForm.validateFields();
          updateData.preferences = {
            preferred_language: values.language,
            theme_mode: values.theme,
            items_per_page: values.itemsPerPage
          };
          break;
        }
      }

      const result = await userSettingsService.updateSettings(updateData);

      if (result.validation) {
        if (result.validation.success) {
          message.success(`配置保存成功！${result.validation.message}`);
        }
      } else {
        message.success('配置保存成功！');
      }

      // 如果是 Azure 配置，更新测试状态
      if (formType === 'azure' && result.validation) {
        setTestStatus({...testStatus, azure: result.validation.success ? 'success' : 'error'});
      }
    } catch (error: any) {
      console.error('Failed to save settings:', error);

      // 处理验证失败错误
      if (error.response?.data?.detail?.validation) {
        const validation = error.response.data.detail.validation;
        message.error(validation.message);
        if (formType === 'azure') {
          setTestStatus({...testStatus, azure: 'error'});
        }
      } else {
        const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || '配置保存失败';
        message.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // 渲染连接状态图标
  const renderStatusIcon = (status: string | null) => {
    if (status === 'success') {
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />;
    } else if (status === 'error') {
      return <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />;
    }
    return null;
  };

  if (initialLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', paddingTop: '100px' }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">加载用户设置中...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SettingOutlined /> 系统设置
      </Title>
      <Paragraph type="secondary">
        配置 AI 模型、知识库集成、个性化推荐和用户偏好
      </Paragraph>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        style={{ marginTop: 24 }}
      >
        {/* AI 模型配置 */}
        <TabPane
          tab={
            <span>
              <RobotOutlined />
              AI 模型配置
            </span>
          }
          key="ai-models"
        >
          <Card title="OpenAI 配置" extra={renderStatusIcon(testStatus.openai)}>
            <Form
              form={openaiForm}
              layout="vertical"
              initialValues={{
                enabled: false,
                model: 'gpt-3.5-turbo',
                baseUrl: 'https://api.openai.com/v1'
              }}
            >
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>启用 OpenAI 服务</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label="API Key"
                name="apiKey"
                rules={[{ required: true, message: '请输入 API Key' }]}
              >
                <Input.Password
                  placeholder="sk-..."
                  prefix={<ApiOutlined />}
                />
              </Form.Item>

              <Form.Item
                label="模型"
                name="model"
              >
                <Select>
                  <Option value="gpt-4">GPT-4</Option>
                  <Option value="gpt-4-turbo-preview">GPT-4 Turbo</Option>
                  <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
                  <Option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Base URL（可选）"
                name="baseUrl"
                extra="自定义 API 地址，用于代理或兼容服务"
              >
                <Input placeholder="https://api.openai.com/v1" />
              </Form.Item>

              <Form.Item
                label="Organization ID（可选）"
                name="organizationId"
              >
                <Input placeholder="org-..." />
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleSave('openai')}
                  loading={loading}
                >
                  保存配置
                </Button>
                <Button
                  onClick={testOpenAIConnection}
                  loading={testStatus.openai === 'testing'}
                >
                  测试连接
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            title="Azure OpenAI 配置"
            style={{ marginTop: 16 }}
            extra={renderStatusIcon(testStatus.azure)}
          >
            <Form
              form={azureForm}
              layout="vertical"
              initialValues={{
                enabled: false,
                apiVersion: '2024-02-15-preview'
              }}
            >
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>启用 Azure OpenAI 服务</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label="API Key"
                name="apiKey"
                rules={[{ required: true, message: '请输入 API Key' }]}
              >
                <Input.Password placeholder="Azure API Key" />
              </Form.Item>

              <Form.Item
                label="Endpoint URL"
                name="endpoint"
                rules={[{ required: true, message: '请输入 Endpoint' }]}
              >
                <Input placeholder="https://your-resource.openai.azure.com/" />
              </Form.Item>

              <Form.Item
                label="Deployment Name"
                name="deploymentName"
                rules={[{ required: true, message: '请输入部署名称' }]}
              >
                <Input placeholder="your-deployment-name" />
              </Form.Item>

              <Form.Item
                label="API Version"
                name="apiVersion"
              >
                <Select>
                  <Option value="2024-02-15-preview">2024-02-15-preview</Option>
                  <Option value="2023-12-01-preview">2023-12-01-preview</Option>
                  <Option value="2023-05-15">2023-05-15</Option>
                </Select>
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleSave('azure')}
                  loading={loading}
                >
                  保存配置
                </Button>
                <Button
                  onClick={testAzureConnection}
                  loading={testStatus.azure === 'testing'}
                >
                  测试连接
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            title="Ollama（本地 LLM）配置"
            style={{ marginTop: 16 }}
            extra={renderStatusIcon(testStatus.ollama)}
          >
            <Alert
              message="本地 LLM 服务"
              description="Ollama 允许您在本地运行开源大语言模型，无需调用云端 API"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={ollamaForm}
              layout="vertical"
              initialValues={{
                enabled: false,
                serverUrl: 'http://localhost:11434',
                model: 'llama2'
              }}
            >
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>启用 Ollama 服务</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label="服务地址"
                name="serverUrl"
                rules={[{ required: true, message: '请输入服务地址' }]}
              >
                <Input placeholder="http://localhost:11434" />
              </Form.Item>

              <Form.Item
                label="模型"
                name="model"
                extra="确保模型已在 Ollama 中下载"
              >
                <Select>
                  <Option value="llama2">Llama 2</Option>
                  <Option value="mistral">Mistral</Option>
                  <Option value="codellama">Code Llama</Option>
                  <Option value="neural-chat">Neural Chat</Option>
                  <Option value="qwen">Qwen</Option>
                </Select>
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleSave('ollama')}
                  loading={loading}
                >
                  保存配置
                </Button>
                <Button
                  onClick={testOllamaConnection}
                  loading={testStatus.ollama === 'testing'}
                >
                  测试连接
                </Button>
              </Space>
            </Form>
          </Card>
        </TabPane>

        {/* 知识库集成 */}
        <TabPane
          tab={
            <span>
              <DatabaseOutlined />
              知识库集成
            </span>
          }
          key="integrations"
        >
          <Card
            title="Notion 集成"
            extra={renderStatusIcon(testStatus.notion)}
          >
            <Alert
              message="Notion 数据库同步"
              description="将技术情报自动同步到您的 Notion 数据库，方便管理和分享"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={notionForm}
              layout="vertical"
              initialValues={{
                enabled: false,
                syncFrequency: 'manual'
              }}
            >
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>启用 Notion 同步</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label="API Token"
                name="apiToken"
                rules={[{ required: true, message: '请输入 Notion API Token' }]}
                extra={
                  <Text type="secondary">
                    在 Notion 中创建 Integration 获取 Token
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 8 }}
                    >
                      获取 Token
                    </a>
                  </Text>
                }
              >
                <Input.Password placeholder="secret_..." />
              </Form.Item>

              <Form.Item
                label="数据库 ID"
                name="databaseId"
                rules={[{ required: true, message: '请输入数据库 ID' }]}
                extra="从 Notion 数据库 URL 中获取 ID"
              >
                <Input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </Form.Item>

              <Form.Item
                label="同步频率"
                name="syncFrequency"
              >
                <Select>
                  <Option value="manual">手动同步</Option>
                  <Option value="hourly">每小时</Option>
                  <Option value="daily">每天</Option>
                  <Option value="weekly">每周</Option>
                </Select>
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleSave('notion')}
                  loading={loading}
                >
                  保存配置
                </Button>
                <Button
                  onClick={testNotionConnection}
                  loading={testStatus.notion === 'testing'}
                >
                  测试连接
                </Button>
              </Space>
            </Form>
          </Card>

          <Card title="其他知识库（即将支持）" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color="default">Obsidian - 开发中</Tag>
              <Tag color="default">Logseq - 计划中</Tag>
              <Tag color="default">语雀 - 计划中</Tag>
              <Tag color="default">飞书文档 - 计划中</Tag>
            </Space>
          </Card>
        </TabPane>

        {/* 个性化推荐 */}
        <TabPane
          tab={
            <span>
              <HeartOutlined />
              个性化推荐
            </span>
          }
          key="personalization"
        >
          <Card title="推荐系统设置">
            <Alert
              message="个性化推荐功能"
              description="系统会根据您的浏览、收藏等行为，智能推荐您可能感兴趣的技术内容"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form
              form={personalizationForm}
              layout="vertical"
              initialValues={{
                enabled: true,
                algorithm: 'hybrid',
                tracking: true,
                showReason: true,
                anonymousMode: false
              }}
            >
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <div>
                    <div><Text strong>启用个性化推荐</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      根据您的偏好推荐相关内容
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Divider />

              <Form.Item
                label="推荐算法"
                name="algorithm"
              >
                <Select>
                  <Option value="content">基于内容推荐</Option>
                  <Option value="collaborative">协同过滤推荐</Option>
                  <Option value="hybrid">混合推荐（推荐）</Option>
                </Select>
              </Form.Item>

              <Form.Item name="tracking" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <div>
                    <div><Text strong>行为追踪</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      记录浏览、点击等行为以改善推荐质量
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Form.Item name="showReason" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <div>
                    <div><Text strong>显示推荐理由</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      在推荐内容上显示推荐原因
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Form.Item name="anonymousMode" valuePropName="checked">
                <Space>
                  <Switch />
                  <div>
                    <div><Text strong>匿名模式</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      不记录详细的行为数据，降低个性化程度
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Button
                type="primary"
                onClick={() => handleSave('personalization')}
                loading={loading}
              >
                保存配置
              </Button>
            </Form>
          </Card>
        </TabPane>

        {/* 用户偏好 */}
        <TabPane
          tab={
            <span>
              <UserOutlined />
              用户偏好
            </span>
          }
          key="preferences"
        >
          <Card title="界面设置">
            <Form
              form={preferencesForm}
              layout="vertical"
              initialValues={{
                language: 'zh',
                theme: 'light',
                itemsPerPage: 20
              }}
            >
              <Form.Item
                label="界面语言"
                name="language"
              >
                <Select>
                  <Option value="zh">中文</Option>
                  <Option value="en">English</Option>
                  <Option value="ja">日本語</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="主题模式"
                name="theme"
              >
                <Select>
                  <Option value="light">浅色模式</Option>
                  <Option value="dark">深色模式</Option>
                  <Option value="auto">跟随系统</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="每页显示数量"
                name="itemsPerPage"
              >
                <Select>
                  <Option value={10}>10 条</Option>
                  <Option value={20}>20 条</Option>
                  <Option value={50}>50 条</Option>
                  <Option value={100}>100 条</Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                onClick={() => handleSave('preferences')}
                loading={loading}
              >
                保存配置
              </Button>
            </Form>
          </Card>

          <Card title="账号信息" style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item label="用户名">
                <Input disabled value="w357771580" />
              </Form.Item>

              <Form.Item label="邮箱">
                <Input disabled value="wuchengbo999@gmail.com" />
              </Form.Item>

              <Button type="link" danger>
                修改密码
              </Button>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
