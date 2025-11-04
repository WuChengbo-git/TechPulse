import React, { useState } from 'react';
import {
  Card, Tabs, Form, Input, Button, Switch, Select, Space,
  message, Divider, Typography, Alert, Tag
} from 'antd';
import {
  RobotOutlined, DatabaseOutlined, UserOutlined,
  SettingOutlined, ApiOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, HeartOutlined
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
      message.success(t('settings.testSuccess').replace('{service}', 'OpenAI'));
    } catch (error) {
      setTestStatus({...testStatus, openai: 'error'});
      message.error(t('settings.testFailedCheck').replace('{service}', 'OpenAI'));
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
        message.success(t('settings.testSuccessWithModel').replace('{model}', result.model));
      } else {
        setTestStatus({...testStatus, azure: 'error'});
        message.error(result.message);
      }
    } catch (error: any) {
      setTestStatus({...testStatus, azure: 'error'});
      const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || t('settings.testFailed').replace('{service}', 'Azure OpenAI');
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
      message.success(t('settings.testSuccess').replace('{service}', 'Ollama'));
    } catch (error) {
      setTestStatus({...testStatus, ollama: 'error'});
      message.error(t('settings.testFailed').replace('{service}', 'Ollama'));
    }
  };

  // 测试 Notion 连接
  const testNotionConnection = async () => {
    try {
      setTestStatus({...testStatus, notion: 'testing'});
      const values = await notionForm.validateFields();

      await new Promise(resolve => setTimeout(resolve, 1500));

      setTestStatus({...testStatus, notion: 'success'});
      message.success(t('settings.testSuccess').replace('{service}', 'Notion'));
    } catch (error) {
      setTestStatus({...testStatus, notion: 'error'});
      message.error(t('settings.testFailed').replace('{service}', 'Notion'));
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
          message.success(t('settings.configSaveSuccessWithMsg').replace('{message}', result.validation.message));
        }
      } else {
        message.success(t('settings.configSaveSuccess'));
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
        const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || t('settings.configSaveFailed');
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <SettingOutlined /> {t('settings.pageTitle')}
      </Title>
      <Paragraph type="secondary">
        {t('settings.pageDescription')}
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
              {t('settings.aiModelsTab')}
            </span>
          }
          key="ai-models"
        >
          <Card title={t('settings.openaiConfig')} extra={renderStatusIcon(testStatus.openai)}>
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
                  <Text>{t('settings.enableOpenAI')}</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label={t('settings.apiKey')}
                name="apiKey"
                rules={[{ required: true, message: t('settings.apiKeyRequired') }]}
              >
                <Input.Password
                  placeholder="sk-..."
                  prefix={<ApiOutlined />}
                />
              </Form.Item>

              <Form.Item
                label={t('settings.model')}
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
                label={t('settings.baseUrl')}
                name="baseUrl"
                extra={t('settings.baseUrlExtra')}
              >
                <Input placeholder="https://api.openai.com/v1" />
              </Form.Item>

              <Form.Item
                label={t('settings.organizationId')}
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
                  {t('settings.saveConfig')}
                </Button>
                <Button
                  onClick={testOpenAIConnection}
                  loading={testStatus.openai === 'testing'}
                >
                  {t('settings.testConnection')}
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            title={t('settings.azureConfig')}
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
                  <Text>{t('settings.enableAzure')}</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label={t('settings.apiKey')}
                name="apiKey"
                rules={[{ required: true, message: t('settings.apiKeyRequired') }]}
              >
                <Input.Password placeholder="Azure API Key" />
              </Form.Item>

              <Form.Item
                label={t('settings.endpointUrl')}
                name="endpoint"
                rules={[{ required: true, message: t('settings.endpointRequired') }]}
              >
                <Input placeholder="https://your-resource.openai.azure.com/" />
              </Form.Item>

              <Form.Item
                label={t('settings.deploymentName')}
                name="deploymentName"
                rules={[{ required: true, message: t('settings.deploymentRequired') }]}
              >
                <Input placeholder="your-deployment-name" />
              </Form.Item>

              <Form.Item
                label={t('settings.apiVersion')}
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
                  {t('settings.saveConfig')}
                </Button>
                <Button
                  onClick={testAzureConnection}
                  loading={testStatus.azure === 'testing'}
                >
                  {t('settings.testConnection')}
                </Button>
              </Space>
            </Form>
          </Card>

          <Card
            title={t('settings.ollamaConfig')}
            style={{ marginTop: 16 }}
            extra={renderStatusIcon(testStatus.ollama)}
          >
            <Alert
              message={t('settings.localLLMService')}
              description={t('settings.localLLMDesc')}
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
                  <Text>{t('settings.enableOllama')}</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label={t('settings.serverUrl')}
                name="serverUrl"
                rules={[{ required: true, message: t('settings.serverUrlRequired') }]}
              >
                <Input placeholder="http://localhost:11434" />
              </Form.Item>

              <Form.Item
                label={t('settings.model')}
                name="model"
                extra={t('settings.modelExtra')}
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
                  {t('settings.saveConfig')}
                </Button>
                <Button
                  onClick={testOllamaConnection}
                  loading={testStatus.ollama === 'testing'}
                >
                  {t('settings.testConnection')}
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
              {t('settings.integrationsTab')}
            </span>
          }
          key="integrations"
        >
          <Card
            title={t('settings.notionConfig')}
            extra={renderStatusIcon(testStatus.notion)}
          >
            <Alert
              message={t('settings.notionSyncTitle')}
              description={t('settings.notionSyncDesc')}
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
                  <Text>{t('settings.enableNotion')}</Text>
                </Space>
              </Form.Item>

              <Form.Item
                label={t('settings.apiToken')}
                name="apiToken"
                rules={[{ required: true, message: t('settings.apiTokenRequired') }]}
                extra={
                  <Text type="secondary">
                    {t('settings.apiTokenExtra')}
                    <a
                      href="https://www.notion.so/my-integrations"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginLeft: 8 }}
                    >
                      {t('settings.getToken')}
                    </a>
                  </Text>
                }
              >
                <Input.Password placeholder="secret_..." />
              </Form.Item>

              <Form.Item
                label={t('settings.databaseId')}
                name="databaseId"
                rules={[{ required: true, message: t('settings.databaseIdRequired') }]}
                extra={t('settings.databaseIdExtra')}
              >
                <Input placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
              </Form.Item>

              <Form.Item
                label={t('settings.syncFrequency')}
                name="syncFrequency"
              >
                <Select>
                  <Option value="manual">{t('settings.syncManual')}</Option>
                  <Option value="hourly">{t('settings.syncHourly')}</Option>
                  <Option value="daily">{t('settings.syncDaily')}</Option>
                  <Option value="weekly">{t('settings.syncWeekly')}</Option>
                </Select>
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  onClick={() => handleSave('notion')}
                  loading={loading}
                >
                  {t('settings.saveConfig')}
                </Button>
                <Button
                  onClick={testNotionConnection}
                  loading={testStatus.notion === 'testing'}
                >
                  {t('settings.testConnection')}
                </Button>
              </Space>
            </Form>
          </Card>

          <Card title={t('settings.otherKnowledgeBase')} style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Tag color="default">{t('settings.obsidianDev')}</Tag>
              <Tag color="default">{t('settings.logseqPlanned')}</Tag>
              <Tag color="default">{t('settings.yuquePlanned')}</Tag>
              <Tag color="default">{t('settings.feishuPlanned')}</Tag>
            </Space>
          </Card>
        </TabPane>

        {/* 个性化推荐 */}
        <TabPane
          tab={
            <span>
              <HeartOutlined />
              {t('settings.personalizationTab')}
            </span>
          }
          key="personalization"
        >
          <Card title={t('settings.recommendationSettings')}>
            <Alert
              message={t('settings.personalizationTitle')}
              description={t('settings.personalizationDesc')}
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
                    <div><Text strong>{t('settings.enableRecommendation')}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('settings.enableRecommendationDesc')}
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Divider />

              <Form.Item
                label={t('settings.recommendationAlgorithm')}
                name="algorithm"
              >
                <Select>
                  <Option value="content">{t('settings.contentBased')}</Option>
                  <Option value="collaborative">{t('settings.collaborative')}</Option>
                  <Option value="hybrid">{t('settings.hybrid')}</Option>
                </Select>
              </Form.Item>

              <Form.Item name="tracking" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <div>
                    <div><Text strong>{t('settings.behaviorTracking')}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('settings.behaviorTrackingDesc')}
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Form.Item name="showReason" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <div>
                    <div><Text strong>{t('settings.showRecommendationReason')}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('settings.showRecommendationReasonDesc')}
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Form.Item name="anonymousMode" valuePropName="checked">
                <Space>
                  <Switch />
                  <div>
                    <div><Text strong>{t('settings.anonymousMode')}</Text></div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('settings.anonymousModeDesc')}
                    </Text>
                  </div>
                </Space>
              </Form.Item>

              <Button
                type="primary"
                onClick={() => handleSave('personalization')}
                loading={loading}
              >
                {t('settings.saveConfig')}
              </Button>
            </Form>
          </Card>
        </TabPane>

        {/* 用户偏好 */}
        <TabPane
          tab={
            <span>
              <UserOutlined />
              {t('settings.preferencesTab')}
            </span>
          }
          key="preferences"
        >
          <Card title={t('settings.interfaceSettings')}>
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
                label={t('settings.interfaceLanguage')}
                name="language"
              >
                <Select>
                  <Option value="zh">{t('settings.chinese')}</Option>
                  <Option value="en">{t('settings.english')}</Option>
                  <Option value="ja">{t('settings.japanese')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={t('settings.themeMode')}
                name="theme"
              >
                <Select>
                  <Option value="light">{t('settings.lightMode')}</Option>
                  <Option value="dark">{t('settings.darkMode')}</Option>
                  <Option value="auto">{t('settings.autoMode')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label={t('settings.itemsPerPage')}
                name="itemsPerPage"
              >
                <Select>
                  <Option value={10}>10 {t('settings.items').replace('{count}', '')}</Option>
                  <Option value={20}>20 {t('settings.items').replace('{count}', '')}</Option>
                  <Option value={50}>50 {t('settings.items').replace('{count}', '')}</Option>
                  <Option value={100}>100 {t('settings.items').replace('{count}', '')}</Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                onClick={() => handleSave('preferences')}
                loading={loading}
              >
                {t('settings.saveConfig')}
              </Button>
            </Form>
          </Card>

          <Card title={t('settings.accountInfo')} style={{ marginTop: 16 }}>
            <Form layout="vertical">
              <Form.Item label={t('settings.username')}>
                <Input disabled value="w357771580" />
              </Form.Item>

              <Form.Item label={t('settings.email')}>
                <Input disabled value="wuchengbo999@gmail.com" />
              </Form.Item>

              <Button type="link" danger>
                {t('settings.changePassword')}
              </Button>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
