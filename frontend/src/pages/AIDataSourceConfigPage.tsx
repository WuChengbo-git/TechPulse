/**
 * AI & データソース設定 Page
 * Combines LLM configuration and Data Source filtering settings
 */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Form, Input, Select, Button, Switch, InputNumber,
  Typography, Space, Tabs, Tag, Alert, message, Table, Popconfirm,
  Tooltip, Badge, Modal, Checkbox
} from 'antd';
import {
  ApiOutlined, CloudOutlined, DesktopOutlined, CheckCircleOutlined,
  ReloadOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, GithubOutlined, FileTextOutlined, RobotOutlined,
  SaveOutlined, FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import llmService, {
  LLMProvider,
  LLMModel,
  ProviderTemplate,
  ProviderType,
  ProviderCategory
} from '../services/llmService';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Data Source Config Interfaces
interface GitHubConfig {
  languages: string[];
  topics: string[];
  min_stars: number;
  max_age_days: number;
  sort_by: 'stars' | 'updated' | 'created';
  per_page: number;
  exclude_forks: boolean;
  include_archived: boolean;
}

interface ArxivConfig {
  categories: string[];
  keywords: string[];
  max_age_days: number;
  max_results: number;
  sort_by: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
  include_cross_lists: boolean;
}

interface HuggingFaceConfig {
  pipeline_tags: string[];
  model_types: string[];
  languages: string[];
  min_downloads: number;
  max_age_days: number;
  sort_by: 'downloads' | 'likes' | 'updated' | 'created';
  include_datasets: boolean;
  include_spaces: boolean;
}

interface ZennConfig {
  topics: string[];
  article_types: string[];
  max_age_days: number;
  min_likes: number;
  sort_by: 'liked' | 'published_at' | 'updated_at';
  include_books: boolean;
  include_scraps: boolean;
}

const AIDataSourceConfigPage: React.FC = () => {
  const { t } = useLanguage();
  const [mainTab, setMainTab] = useState('llm');
  const [dataSourceTab, setDataSourceTab] = useState('github');

  // LLM Provider States
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [templates, setTemplates] = useState<{
    cloud_providers: ProviderTemplate[];
    local_providers: ProviderTemplate[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [currentProviderModels, setCurrentProviderModels] = useState<LLMModel[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProviderTemplate | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const [form] = Form.useForm();
  const [modelForm] = Form.useForm();

  // Data Source Config States
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    languages: ['Python', 'JavaScript', 'TypeScript'],
    topics: ['machine-learning', 'artificial-intelligence', 'web-development'],
    min_stars: 100,
    max_age_days: 7,
    sort_by: 'stars',
    per_page: 50,
    exclude_forks: true,
    include_archived: false
  });

  const [arxivConfig, setArxivConfig] = useState<ArxivConfig>({
    categories: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV'],
    keywords: ['neural network', 'machine learning', 'deep learning'],
    max_age_days: 30,
    max_results: 100,
    sort_by: 'submittedDate',
    include_cross_lists: true
  });

  const [huggingfaceConfig, setHuggingfaceConfig] = useState<HuggingFaceConfig>({
    pipeline_tags: ['text-generation', 'image-classification', 'question-answering'],
    model_types: ['transformer', 'pytorch', 'tensorflow'],
    languages: ['en', 'ja', 'zh'],
    min_downloads: 10,
    max_age_days: 30,
    sort_by: 'downloads',
    include_datasets: true,
    include_spaces: false
  });

  const [zennConfig, setZennConfig] = useState<ZennConfig>({
    topics: ['React', 'Python', 'AI', 'Machine Learning', 'Web Development'],
    article_types: ['tech'],
    max_age_days: 14,
    min_likes: 5,
    sort_by: 'liked',
    include_books: true,
    include_scraps: false
  });

  // Predefined options for data sources
  const githubLanguages = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'Julia'
  ];

  const githubTopics = [
    'machine-learning', 'artificial-intelligence', 'deep-learning', 'neural-networks',
    'web-development', 'mobile-development', 'data-science', 'blockchain',
    'cloud-computing', 'devops', 'frontend', 'backend', 'full-stack'
  ];

  const arxivCategories = [
    { value: 'cs.AI', label: 'Artificial Intelligence' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Computation and Language' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.RO', label: 'Robotics' },
    { value: 'cs.SE', label: 'Software Engineering' },
    { value: 'stat.ML', label: 'Machine Learning (Statistics)' }
  ];

  const huggingfacePipelineTags = [
    'text-generation', 'text-classification', 'token-classification',
    'question-answering', 'fill-mask', 'summarization', 'translation',
    'image-classification', 'object-detection', 'image-segmentation',
    'speech-recognition', 'text-to-speech'
  ];

  // Load data on mount
  useEffect(() => {
    if (mainTab === 'llm') {
      loadTemplates();
      loadProviders();
    } else {
      loadDataSourceConfig();
    }
  }, [mainTab]);

  // LLM Provider Functions
  const loadTemplates = async () => {
    try {
      const data = await llmService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await llmService.listProviders();
      setProviders(data);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        message.error(t('llmProviders.loadProvidersFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadProviderModels = async (providerId: number) => {
    try {
      const models = await llmService.listModels(providerId);
      setCurrentProviderModels(models);
    } catch (error) {
      message.error(t('llmProviders.loadModelsFailed'));
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingProvider(null);
    setSelectedTemplate(null);
    form.resetFields();
  };

  const handleAddProvider = () => {
    setEditingProvider(null);
    setSelectedTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProvider = async (provider: LLMProvider) => {
    try {
      const allTemplates = [
        ...(templates?.cloud_providers || []),
        ...(templates?.local_providers || [])
      ];
      const template = allTemplates.find(t => t.category === provider.provider_category);

      await loadProviderModels(provider.id);

      setEditingProvider(provider);
      setSelectedTemplate(template || null);

      setTimeout(() => {
        const formValues = {
          provider_name: provider.provider_name,
          provider_category: provider.provider_category,
          is_enabled: Boolean(provider.is_enabled),
          is_default: Boolean(provider.is_default),
          ...provider.config
        };
        form.setFieldsValue(formValues);
        setModalVisible(true);
      }, 100);
    } catch (error) {
      console.error('Failed to edit provider:', error);
      message.error(t('llmProviders.loadProviderFailed'));
    }
  };

  const handleSelectTemplate = (category: ProviderCategory) => {
    const allTemplates = [
      ...(templates?.cloud_providers || []),
      ...(templates?.local_providers || [])
    ];
    const template = allTemplates.find(t => t.category === category);
    setSelectedTemplate(template || null);

    if (template && template.config_fields) {
      const defaultConfig: any = {
        is_enabled: true,
        is_default: false
      };
      template.config_fields.forEach(field => {
        if (field.default) {
          defaultConfig[field.name] = field.default;
        }
      });
      form.setFieldsValue(defaultConfig);
    }
  };

  const handleTestConnection = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!selectedTemplate) {
        message.warning(t('llmProviders.selectProviderTypeFirst'));
        return;
      }

      setTestingConnection(true);

      const config: Record<string, any> = {};
      if (selectedTemplate.config_fields) {
        selectedTemplate.config_fields.forEach(field => {
          const value = values[field.name] || field.default;
          if (value) {
            config[field.name] = value;
          }
        });
      }

      const result = await llmService.testConnection({
        provider_category: selectedTemplate.category,
        config,
        test_model: values.test_model
      });

      let translatedMessage = result.message;
      if (result.message_code) {
        switch (result.message_code) {
          case 'OLLAMA_CONNECTION_SUCCESS':
            translatedMessage = t('llmProviders.ollamaConnectionSuccess').replace('{count}', result.details?.model_count || 0);
            break;
          case 'CONNECTION_SUCCESS':
            translatedMessage = t('llmProviders.connectionSuccess');
            break;
          case 'TEST_FAILED':
            translatedMessage = t('llmProviders.testFailed').replace('{error}', result.details?.error || '');
            break;
        }
      }

      if (result.success) {
        message.success(translatedMessage);
      } else {
        message.error(translatedMessage);
      }
    } catch (error: any) {
      message.error(t('llmProviders.testConnectionFailed'));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveProvider = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedTemplate && !editingProvider) {
        message.warning(t('llmProviders.selectProviderTypeFirst'));
        return;
      }

      const template = selectedTemplate || templates?.cloud_providers.find(
        t => t.category === editingProvider?.provider_category
      ) || templates?.local_providers.find(
        t => t.category === editingProvider?.provider_category
      );

      if (!template) {
        message.error(t('llmProviders.providerTemplateNotFound'));
        return;
      }

      const config: Record<string, any> = {};
      if (template.config_fields) {
        template.config_fields.forEach(field => {
          const value = values[field.name] || field.default;
          if (value !== undefined) {
            config[field.name] = value;
          }
        });
      }

      if (editingProvider) {
        await llmService.updateProvider(editingProvider.id, {
          provider_name: values.provider_name,
          config,
          is_enabled: values.is_enabled,
          is_default: values.is_default
        });
        message.success(t('llmProviders.providerUpdatedSuccess'));
      } else {
        await llmService.createProvider({
          provider_name: values.provider_name,
          provider_type: template.type,
          provider_category: template.category,
          config,
          is_enabled: values.is_enabled ?? true,
          is_default: values.is_default ?? false
        });
        message.success(t('llmProviders.providerCreatedSuccess'));
      }

      handleCloseModal();
      loadProviders();
    } catch (error: any) {
      if (error.errorFields) {
        message.error(t('llmProviders.fillRequiredFields'));
      } else {
        message.error(t('llmProviders.saveFailed'));
      }
    }
  };

  const handleDeleteProvider = async (providerId: number) => {
    try {
      await llmService.deleteProvider(providerId);
      message.success(t('llmProviders.providerDeletedSuccess'));
      loadProviders();
    } catch (error) {
      message.error(t('llmProviders.deleteFailed'));
    }
  };

  const handleAddModel = () => {
    if (!editingProvider) return;
    modelForm.resetFields();
    setModelModalVisible(true);
  };

  const handleSaveModel = async () => {
    if (!editingProvider) return;

    try {
      const values = await modelForm.validateFields();

      await llmService.createModel({
        provider_id: editingProvider.id,
        ...values
      });

      message.success(t('llmProviders.modelAddedSuccess'));
      setModelModalVisible(false);
      await loadProviderModels(editingProvider.id);
    } catch (error: any) {
      if (error.errorFields) {
        message.error(t('llmProviders.fillRequiredFields'));
      } else {
        message.error(t('llmProviders.saveModelFailed'));
      }
    }
  };

  const handleDeleteModel = async (modelId: number) => {
    try {
      await llmService.deleteModel(modelId);
      message.success(t('llmProviders.modelDeletedSuccess'));
      if (editingProvider) {
        await loadProviderModels(editingProvider.id);
      }
    } catch (error) {
      message.error(t('llmProviders.deleteModelFailed'));
    }
  };

  // Data Source Functions
  const loadDataSourceConfig = async () => {
    try {
      const response = await fetch('/api/v1/sources');
      if (response.ok) {
        const sources = await response.json();

        // 从API响应映射到前端配置
        sources.forEach((source: any) => {
          if (source.name === 'github') {
            setGithubConfig({
              ...githubConfig,
              min_stars: source.min_stars || 100
            });
          } else if (source.name === 'huggingface') {
            setHuggingfaceConfig({
              ...huggingfaceConfig,
              min_downloads: source.min_likes || 20
            });
          } else if (source.name === 'zenn') {
            setZennConfig({
              ...zennConfig,
              min_likes: source.min_likes || 20
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const saveDataSourceConfig = async () => {
    try {
      setLoading(true);

      // 构建符合后端API格式的配置数据
      const configData = {
        github: {
          min_stars: githubConfig.min_stars
        },
        huggingface: {
          min_likes: huggingfaceConfig.min_downloads
        },
        zenn: {
          min_likes: zennConfig.min_likes
        },
        arxiv: {
          min_citations: 0
        }
      };

      const response = await fetch('/api/v1/sources/batch/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(configData)
      });

      if (response.ok) {
        message.success(t('common.saveSuccess') || 'Settings saved successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Save failed');
      }
    } catch (error: any) {
      console.error('Failed to save config:', error);
      message.error(t('common.saveFailed') || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // LLM Provider Table Columns
  const providerColumns: ColumnsType<LLMProvider> = [
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
        };
        return <Tag>{labels[category] || category}</Tag>;
      }
    },
    {
      title: t('llmProviders.status'),
      key: 'status',
      render: (_, record) => (
        <Badge
          status={record.is_enabled ? 'success' : 'default'}
          text={record.is_enabled ? t('llmProviders.enabled') : t('llmProviders.disabled')}
        />
      )
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
  ];

  // Model Table Columns
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
  ];

  // Render GitHub Config
  const renderGitHubConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title={`🔍 ${t('apiConfig.searchCriteria') || '検索条件'}`} size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('apiConfig.programmingLanguages') || 'プログラミング言語'}>
              <Select
                mode="multiple"
                value={githubConfig.languages}
                onChange={(value) => setGithubConfig({ ...githubConfig, languages: value })}
                placeholder={t('apiConfig.selectLanguages') || '言語を選択'}
              >
                {githubLanguages.map(lang => (
                  <Option key={lang} value={lang}>{lang}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('apiConfig.topics') || 'トピック'}>
              <Select
                mode="multiple"
                value={githubConfig.topics}
                onChange={(value) => setGithubConfig({ ...githubConfig, topics: value })}
                placeholder={t('apiConfig.selectTopics') || 'トピックを選択'}
              >
                {githubTopics.map(topic => (
                  <Option key={topic} value={topic}>{topic}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={`⭐ ${t('apiConfig.filterConditions') || 'フィルタ条件'}`} size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('apiConfig.minimumStars') || '最小スター数'}>
              <InputNumber
                min={0}
                value={githubConfig.min_stars}
                onChange={(value) => setGithubConfig({ ...githubConfig, min_stars: value || 0 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.periodDays') || '期間（日）'}>
              <Select
                value={githubConfig.max_age_days}
                onChange={(value) => setGithubConfig({ ...githubConfig, max_age_days: value })}
              >
                <Option value={1}>1 day</Option>
                <Option value={7}>1 week</Option>
                <Option value={30}>1 month</Option>
                <Option value={90}>3 months</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.fetchCount') || '取得件数'}>
              <InputNumber
                min={10}
                max={100}
                value={githubConfig.per_page}
                onChange={(value) => setGithubConfig({ ...githubConfig, per_page: value || 50 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('apiConfig.sortBy') || 'ソート'}>
              <Select
                value={githubConfig.sort_by}
                onChange={(value) => setGithubConfig({ ...githubConfig, sort_by: value })}
              >
                <Option value="stars">Stars</Option>
                <Option value="updated">Updated</Option>
                <Option value="created">Created</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.excludeForks') || 'Forkを除外'}>
              <Switch
                checked={githubConfig.exclude_forks}
                onChange={(checked) => setGithubConfig({ ...githubConfig, exclude_forks: checked })}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.includeArchived') || 'アーカイブ含む'}>
              <Switch
                checked={githubConfig.include_archived}
                onChange={(checked) => setGithubConfig({ ...githubConfig, include_archived: checked })}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  );

  // Render arXiv Config
  const renderArxivConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title={`📚 ${t('apiConfig.researchFields') || '研究分野'}`} size="small">
        <Form.Item label={t('apiConfig.categories') || 'カテゴリ'}>
          <Checkbox.Group
            value={arxivConfig.categories}
            onChange={(value) => setArxivConfig({ ...arxivConfig, categories: value as string[] })}
          >
            <Row>
              {arxivCategories.map(cat => (
                <Col span={12} key={cat.value} style={{ marginBottom: 8 }}>
                  <Checkbox value={cat.value}>{cat.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </Card>

      <Card title={`🔑 ${t('apiConfig.keywords') || 'キーワード'}`} size="small">
        <Form.Item label={t('apiConfig.searchKeywords') || '検索キーワード'}>
          <Select
            mode="tags"
            value={arxivConfig.keywords}
            onChange={(value) => setArxivConfig({ ...arxivConfig, keywords: value })}
            placeholder={t('apiConfig.enterKeywords') || 'キーワードを入力'}
          />
        </Form.Item>
      </Card>

      <Card title={`⚙️ ${t('apiConfig.fetchSettings') || '取得設定'}`} size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('apiConfig.periodDays') || '期間（日）'}>
              <InputNumber
                min={1}
                max={365}
                value={arxivConfig.max_age_days}
                onChange={(value) => setArxivConfig({ ...arxivConfig, max_age_days: value || 30 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.maxResults') || '最大件数'}>
              <InputNumber
                min={10}
                max={1000}
                value={arxivConfig.max_results}
                onChange={(value) => setArxivConfig({ ...arxivConfig, max_results: value || 100 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.sortBy') || 'ソート'}>
              <Select
                value={arxivConfig.sort_by}
                onChange={(value) => setArxivConfig({ ...arxivConfig, sort_by: value })}
              >
                <Option value="relevance">Relevance</Option>
                <Option value="lastUpdatedDate">Last Updated</Option>
                <Option value="submittedDate">Submitted</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  );

  // Render HuggingFace Config
  const renderHuggingFaceConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title={`🤖 ${t('apiConfig.modelSettings') || 'モデル設定'}`} size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('apiConfig.pipelineTasks') || 'パイプラインタスク'}>
              <Select
                mode="multiple"
                value={huggingfaceConfig.pipeline_tags}
                onChange={(value) => setHuggingfaceConfig({ ...huggingfaceConfig, pipeline_tags: value })}
                placeholder={t('apiConfig.selectTasks') || 'タスクを選択'}
              >
                {huggingfacePipelineTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('apiConfig.supportedLanguages') || '対応言語'}>
              <Select
                mode="multiple"
                value={huggingfaceConfig.languages}
                onChange={(value) => setHuggingfaceConfig({ ...huggingfaceConfig, languages: value })}
                placeholder={t('apiConfig.selectLanguages') || '言語を選択'}
              >
                <Option value="en">English</Option>
                <Option value="ja">Japanese</Option>
                <Option value="zh">Chinese</Option>
                <Option value="ko">Korean</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title={`📊 ${t('apiConfig.filterConditions') || 'フィルタ条件'}`} size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('apiConfig.minDownloads') || '最小ダウンロード数'}>
              <InputNumber
                min={0}
                value={huggingfaceConfig.min_downloads}
                onChange={(value) => setHuggingfaceConfig({ ...huggingfaceConfig, min_downloads: value || 0 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.periodDays') || '期間（日）'}>
              <InputNumber
                min={1}
                max={365}
                value={huggingfaceConfig.max_age_days}
                onChange={(value) => setHuggingfaceConfig({ ...huggingfaceConfig, max_age_days: value || 30 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.sortBy') || 'ソート'}>
              <Select
                value={huggingfaceConfig.sort_by}
                onChange={(value) => setHuggingfaceConfig({ ...huggingfaceConfig, sort_by: value })}
              >
                <Option value="downloads">Downloads</Option>
                <Option value="likes">Likes</Option>
                <Option value="updated">Updated</Option>
                <Option value="created">Created</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('apiConfig.includeDatasets') || 'データセット含む'}>
              <Switch
                checked={huggingfaceConfig.include_datasets}
                onChange={(checked) => setHuggingfaceConfig({ ...huggingfaceConfig, include_datasets: checked })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('apiConfig.includeSpaces') || 'Spaces含む'}>
              <Switch
                checked={huggingfaceConfig.include_spaces}
                onChange={(checked) => setHuggingfaceConfig({ ...huggingfaceConfig, include_spaces: checked })}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  );

  // Render Zenn Config
  const renderZennConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title={`📝 ${t('apiConfig.articleSettings') || '記事設定'}`} size="small">
        <Form.Item label={t('apiConfig.topicsOfInterest') || '興味のあるトピック'}>
          <Select
            mode="tags"
            value={zennConfig.topics}
            onChange={(value) => setZennConfig({ ...zennConfig, topics: value })}
            placeholder={t('apiConfig.enterTopics') || 'トピックを入力'}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label={t('apiConfig.minLikes') || '最小いいね数'}>
              <InputNumber
                min={0}
                value={zennConfig.min_likes}
                onChange={(value) => setZennConfig({ ...zennConfig, min_likes: value || 0 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.periodDays') || '期間（日）'}>
              <InputNumber
                min={1}
                max={365}
                value={zennConfig.max_age_days}
                onChange={(value) => setZennConfig({ ...zennConfig, max_age_days: value || 14 })}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label={t('apiConfig.sortBy') || 'ソート'}>
              <Select
                value={zennConfig.sort_by}
                onChange={(value) => setZennConfig({ ...zennConfig, sort_by: value })}
              >
                <Option value="liked">Liked</Option>
                <Option value="published_at">Published</Option>
                <Option value="updated_at">Updated</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('apiConfig.includeBooks') || '本を含む'}>
              <Switch
                checked={zennConfig.include_books}
                onChange={(checked) => setZennConfig({ ...zennConfig, include_books: checked })}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('apiConfig.includeScraps') || 'スクラップ含む'}>
              <Switch
                checked={zennConfig.include_scraps}
                onChange={(checked) => setZennConfig({ ...zennConfig, include_scraps: checked })}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <ApiOutlined /> AI & データソース設定
          </Title>
          <Paragraph type="secondary">
            LLMモデルとデータ収集ソースの設定を管理
          </Paragraph>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={mainTab === 'llm' ? loadProviders : loadDataSourceConfig}>
              {t('common.refresh') || '更新'}
            </Button>
            {mainTab === 'llm' ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProvider}>
                {t('llmProviders.addProvider') || 'プロバイダ追加'}
              </Button>
            ) : (
              <Button type="primary" icon={<SaveOutlined />} onClick={saveDataSourceConfig} loading={loading}>
                {t('common.save') || '保存'}
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      <Tabs activeKey={mainTab} onChange={setMainTab}>
        {/* LLM Configuration Tab */}
        <TabPane
          tab={
            <span>
              <CloudOutlined />
              {t('aiDataSource.llmSettings') || 'LLMモデル設定'}
            </span>
          }
          key="llm"
        >
          <Alert
            message={t('aiDataSource.llmDescription') || 'LLMプロバイダとモデルの管理'}
            description={t('aiDataSource.llmSubtitle') || 'ローカルモデル（Ollama）とクラウドプロバイダ（OpenAI、Azureなど）を設定できます'}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Card>
            <Table
              columns={providerColumns}
              dataSource={providers}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: t('llmProviders.noProvidersHint') || 'プロバイダがありません' }}
            />
          </Card>
        </TabPane>

        {/* Data Source Configuration Tab */}
        <TabPane
          tab={
            <span>
              <FilterOutlined />
              {t('aiDataSource.dataSourceSettings') || 'データソース設定'}
            </span>
          }
          key="datasource"
        >
          <Alert
            message={t('apiConfig.dataSourceDescription') || 'データソースのフィルタ設定'}
            description={t('apiConfig.dataSourceSubtitle') || 'GitHub、arXiv、HuggingFace、Zennからの収集条件を設定'}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Tabs activeKey={dataSourceTab} onChange={setDataSourceTab}>
            <TabPane
              tab={
                <span>
                  <GithubOutlined />
                  GitHub
                </span>
              }
              key="github"
            >
              {renderGitHubConfig()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  arXiv
                </span>
              }
              key="arxiv"
            >
              {renderArxivConfig()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <RobotOutlined />
                  Hugging Face
                </span>
              }
              key="huggingface"
            >
              {renderHuggingFaceConfig()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <EditOutlined />
                  Zenn
                </span>
              }
              key="zenn"
            >
              {renderZennConfig()}
            </TabPane>
          </Tabs>
        </TabPane>
      </Tabs>

      {/* Provider Configuration Modal */}
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

          {selectedTemplate?.config_fields?.map(field => (
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
          )) || null}

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

          {/* Model List (only when editing) */}
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

      {/* Add Model Modal */}
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
  );
};

export default AIDataSourceConfigPage;
