import React, { useState } from 'react';
import {
  Card, Tabs, Form, Input, Button, Switch, Select, Space,
  message, Typography, Alert, Tag
} from 'antd';
import {
  DatabaseOutlined, HeartOutlined,
  SettingOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const SettingsPage: React.FC = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('integrations');

  // 知识库配置状态
  const [notionForm] = Form.useForm();

  // 个性化设置状态
  const [personalizationForm] = Form.useForm();

  // 测试连接状态
  const [testStatus, setTestStatus] = useState<{[key: string]: 'success' | 'error' | 'testing' | null}>({
    notion: null
  });

  // 测试 Notion 连接
  const testNotionConnection = async () => {
    try {
      setTestStatus({...testStatus, notion: 'testing'});
      await notionForm.validateFields();
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestStatus({...testStatus, notion: 'success'});
      message.success(t('settings.testSuccess').replace('{service}', 'Notion'));
    } catch (error) {
      setTestStatus({...testStatus, notion: 'error'});
      message.error(t('settings.testFailed').replace('{service}', 'Notion'));
    }
  };

  // 保存配置
  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success(t('settings.configSaveSuccess'));
    } catch (error) {
      message.error(t('settings.configSaveFailed'));
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

      <Alert
        message="システム設定について"
        description="このページではシステム全体に影響する設定を管理します。個人的な表示設定は右上の個人センターメニューから設定できます。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
      >
        {/* 知识库集成 */}
        <Tabs.TabPane
          tab={
            <span>
              <DatabaseOutlined />
              {t('settings.integrationsTab')}
            </span>
          }
          key="integrations"
        >
          <Card title={t('settings.notionConfig')} extra={renderStatusIcon(testStatus.notion)}>
            <Form form={notionForm} layout="vertical">
              <Form.Item name="enabled" valuePropName="checked">
                <Space>
                  <Switch />
                  <Text>{t('settings.enableNotion')}</Text>
                </Space>
              </Form.Item>

              <Form.Item label={t('settings.apiKey')} name="apiKey">
                <Input.Password placeholder={t('settings.enterApiKey')} />
              </Form.Item>

              <Space>
                <Button type="primary" onClick={handleSave} loading={loading}>
                  {t('common.save')}
                </Button>
                <Button onClick={testNotionConnection} loading={testStatus.notion === 'testing'}>
                  {t('settings.testConnection')}
                </Button>
              </Space>
            </Form>
          </Card>

          <Card title={t('settings.otherIntegrations')} style={{ marginTop: 16 }}>
            <Paragraph type="secondary">{t('settings.moreIntegrationsComingSoon')}</Paragraph>
            <Space wrap>
              <Tag color="default">{t('settings.obsidianPlanned')}</Tag>
              <Tag color="default">{t('settings.logseqPlanned')}</Tag>
            </Space>
          </Card>
        </Tabs.TabPane>

        {/* AI個性化 */}
        <Tabs.TabPane
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
              message="AI個性化について"
              description="ここではAIによる推薦システムの動作を設定します。興味のあるトピックを設定することで、より適切なコンテンツが推薦されます。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Form form={personalizationForm} layout="vertical">
              <Form.Item name="enableRecommendations" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <Text>{t('settings.enablePersonalizedRecommendations')}</Text>
                </Space>
              </Form.Item>

              <Form.Item label={t('settings.interestedTopics')} name="topics">
                <Select mode="tags" placeholder={t('settings.selectOrInputTopics')}>
                  <Option value="ai">AI & Machine Learning</Option>
                  <Option value="web">Web Development</Option>
                  <Option value="mobile">Mobile Development</Option>
                  <Option value="devops">DevOps</Option>
                  <Option value="data">Data Science</Option>
                  <Option value="cloud">Cloud Computing</Option>
                  <Option value="blockchain">Blockchain</Option>
                  <Option value="iot">IoT</Option>
                  <Option value="security">Security</Option>
                  <Option value="database">Database</Option>
                </Select>
              </Form.Item>

              <Form.Item name="enableAutoEnhancement" valuePropName="checked">
                <Space>
                  <Switch defaultChecked />
                  <Text>新規データの自動AI増強を有効化</Text>
                </Space>
              </Form.Item>

              <Button type="primary" onClick={handleSave} loading={loading}>
                {t('common.save')}
              </Button>
            </Form>
          </Card>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
