import React, { useState, useEffect } from 'react'
import { 
  Card, Row, Col, Form, Input, Select, Button, Switch, Slider, 
  Typography, Space, Tabs, InputNumber, Tag, Alert, message,
  Collapse, Divider, TimePicker, Checkbox
} from 'antd'
import { 
  SettingOutlined, GithubOutlined, FileTextOutlined, RobotOutlined, 
  EditOutlined, SaveOutlined, ReloadOutlined, ApiOutlined,
  ClockCircleOutlined, FilterOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs
const { Panel } = Collapse
const { Option } = Select
const { TextArea } = Input

interface GitHubConfig {
  languages: string[]
  topics: string[]
  min_stars: number
  max_age_days: number
  activity_period: 'daily' | 'weekly' | 'monthly'
  sort_by: 'stars' | 'updated' | 'created'
  per_page: number
  exclude_forks: boolean
  include_archived: boolean
}

interface ArxivConfig {
  categories: string[]
  keywords: string[]
  max_age_days: number
  max_results: number
  sort_by: 'relevance' | 'lastUpdatedDate' | 'submittedDate'
  include_cross_lists: boolean
}

interface HuggingFaceConfig {
  pipeline_tags: string[]
  model_types: string[]
  languages: string[]
  min_downloads: number
  max_age_days: number
  sort_by: 'downloads' | 'likes' | 'updated' | 'created'
  include_datasets: boolean
  include_spaces: boolean
}

interface ZennConfig {
  topics: string[]
  article_types: string[]
  max_age_days: number
  min_likes: number
  sort_by: 'liked' | 'published_at' | 'updated_at'
  include_books: boolean
  include_scraps: boolean
}

interface ScheduleConfig {
  enabled: boolean
  frequency: 'hourly' | 'daily' | 'weekly'
  time: string
  timezone: string
}

interface AzureOpenAIConfig {
  service_type: string
  api_key: string
  api_endpoint: string
  api_version: string
  deployment_name: string
  embedding_deployment_name: string
  model_name: string
  is_enabled: boolean
}

const ApiConfigPage: React.FC = () => {
  const { t } = useLanguage()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('github')
  
  // 配置状态
  const [githubConfig, setGithubConfig] = useState<GitHubConfig>({
    languages: ['Python', 'JavaScript', 'TypeScript'],
    topics: ['machine-learning', 'artificial-intelligence', 'web-development'],
    min_stars: 100,
    max_age_days: 7,
    activity_period: 'daily',
    sort_by: 'stars',
    per_page: 50,
    exclude_forks: true,
    include_archived: false
  })

  const [arxivConfig, setArxivConfig] = useState<ArxivConfig>({
    categories: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV'],
    keywords: ['neural network', 'machine learning', 'deep learning'],
    max_age_days: 30,
    max_results: 100,
    sort_by: 'submittedDate',
    include_cross_lists: true
  })

  const [huggingfaceConfig, setHuggingfaceConfig] = useState<HuggingFaceConfig>({
    pipeline_tags: ['text-generation', 'image-classification', 'question-answering'],
    model_types: ['transformer', 'pytorch', 'tensorflow'],
    languages: ['en', 'ja', 'zh'],
    min_downloads: 10,
    max_age_days: 30,
    sort_by: 'downloads',
    include_datasets: true,
    include_spaces: false
  })

  const [zennConfig, setZennConfig] = useState<ZennConfig>({
    topics: ['React', 'Python', 'AI', 'Machine Learning', 'Web Development'],
    article_types: ['tech'],
    max_age_days: 14,
    min_likes: 5,
    sort_by: 'liked',
    include_books: true,
    include_scraps: false
  })

  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: true,
    frequency: 'daily',
    time: '09:00',
    timezone: 'Asia/Tokyo'
  })

  const [azureOpenAIConfig, setAzureOpenAIConfig] = useState<AzureOpenAIConfig>({
    service_type: 'azure_openai',
    api_key: '',
    api_endpoint: '',
    api_version: '2024-02-15-preview',
    deployment_name: 'gpt-4o',
    embedding_deployment_name: 'text-embedding-ada-002',
    model_name: 'gpt-4o',
    is_enabled: true
  })

  // 预定义选项
  const githubLanguages = [
    'Python', 'JavaScript', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'Julia'
  ]

  const githubTopics = [
    'machine-learning', 'artificial-intelligence', 'deep-learning', 'neural-networks',
    'web-development', 'mobile-development', 'data-science', 'blockchain',
    'cloud-computing', 'devops', 'frontend', 'backend', 'full-stack'
  ]

  const arxivCategories = [
    { value: 'cs.AI', label: 'Artificial Intelligence' },
    { value: 'cs.LG', label: 'Machine Learning' },
    { value: 'cs.CL', label: 'Computation and Language' },
    { value: 'cs.CV', label: 'Computer Vision' },
    { value: 'cs.RO', label: 'Robotics' },
    { value: 'cs.SE', label: 'Software Engineering' },
    { value: 'stat.ML', label: 'Machine Learning (Statistics)' }
  ]

  const huggingfacePipelineTags = [
    'text-generation', 'text-classification', 'token-classification',
    'question-answering', 'fill-mask', 'summarization', 'translation',
    'image-classification', 'object-detection', 'image-segmentation',
    'speech-recognition', 'text-to-speech'
  ]

  // 保存配置
  const saveConfig = async () => {
    try {
      setLoading(true)
      
      const configData = {
        github: githubConfig,
        arxiv: arxivConfig,
        huggingface: huggingfaceConfig,
        zenn: zennConfig,
        schedule: scheduleConfig
      }

      const response = await fetch('/api/v1/config/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      })

      if (response.ok) {
        message.success('Settings saved successfully')
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      message.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  // 加载配置
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/v1/config/sources')
      if (response.ok) {
        const data = await response.json()
        setGithubConfig(data.github || githubConfig)
        setArxivConfig(data.arxiv || arxivConfig)
        setHuggingfaceConfig(data.huggingface || huggingfaceConfig)
        setZennConfig(data.zenn || zennConfig)
        setScheduleConfig(data.schedule || scheduleConfig)
      }
    } catch (error) {
      console.error('Failed to load config:', error)
    }
  }

  // 保存Azure OpenAI配置
  const saveAzureOpenAIConfig = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/v1/ai-config/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureOpenAIConfig)
      })

      if (response.ok) {
        message.success('Azure OpenAI配置保存成功！')
      } else {
        const error = await response.json()
        throw new Error(error.detail || '保存失败')
      }
    } catch (error: any) {
      message.error(`保存失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 加载Azure OpenAI配置
  const loadAzureOpenAIConfig = async () => {
    try {
      const response = await fetch('/api/v1/ai-config/')
      if (response.ok) {
        const data = await response.json()
        setAzureOpenAIConfig({
          service_type: data.service_type || 'azure_openai',
          api_key: data.api_key || '',
          api_endpoint: data.api_endpoint || '',
          api_version: data.api_version || '2024-02-15-preview',
          deployment_name: data.deployment_name || 'gpt-4o',
          embedding_deployment_name: data.embedding_deployment_name || 'text-embedding-ada-002',
          model_name: data.model_name || 'gpt-4o',
          is_enabled: data.is_enabled !== undefined ? data.is_enabled : true
        })
      }
    } catch (error) {
      console.log('No Azure OpenAI config found or error loading:', error)
    }
  }

  // 测试Azure OpenAI配置
  const testAzureOpenAIConfig = async () => {
    try {
      setTestLoading(true)

      const response = await fetch('/api/v1/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureOpenAIConfig)
      })

      const result = await response.json()

      if (result.success) {
        message.success(result.message)
      } else {
        message.error(result.message)
      }
    } catch (error: any) {
      message.error(`测试失败: ${error.message}`)
    } finally {
      setTestLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
    loadAzureOpenAIConfig()
  }, [])

  // GitHub配置面板
  const renderGitHubConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="🔍 Search Criteria" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Programming Languages">
              <Select
                mode="multiple"
                value={githubConfig.languages}
                onChange={(value) => setGithubConfig({...githubConfig, languages: value})}
                placeholder="Select languages"
              >
                {githubLanguages.map(lang => (
                  <Option key={lang} value={lang}>{lang}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Topics">
              <Select
                mode="multiple"
                value={githubConfig.topics}
                onChange={(value) => setGithubConfig({...githubConfig, topics: value})}
                placeholder="Select topics"
              >
                {githubTopics.map(topic => (
                  <Option key={topic} value={topic}>{topic}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="⭐ Filter Conditions" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Minimum Stars">
              <InputNumber
                min={0}
                value={githubConfig.min_stars}
                onChange={(value) => setGithubConfig({...githubConfig, min_stars: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Period (Days)">
              <Select
                value={githubConfig.max_age_days}
                onChange={(value) => setGithubConfig({...githubConfig, max_age_days: value})}
              >
                <Option value={1}>1 day</Option>
                <Option value={7}>1 week</Option>
                <Option value={30}>1 month</Option>
                <Option value={90}>3 months</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Fetch Count">
              <InputNumber
                min={10}
                max={100}
                value={githubConfig.per_page}
                onChange={(value) => setGithubConfig({...githubConfig, per_page: value || 50})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Sort By">
              <Select
                value={githubConfig.sort_by}
                onChange={(value) => setGithubConfig({...githubConfig, sort_by: value})}
              >
                <Option value="stars">Stars</Option>
                <Option value="updated">Updated</Option>
                <Option value="created">Created</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Exclude Forks">
              <Switch
                checked={githubConfig.exclude_forks}
                onChange={(checked) => setGithubConfig({...githubConfig, exclude_forks: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Include Archived">
              <Switch
                checked={githubConfig.include_archived}
                onChange={(checked) => setGithubConfig({...githubConfig, include_archived: checked})}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  )

  // arXiv配置面板
  const renderArxivConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="📚 Research Fields" size="small">
        <Form.Item label="Categories">
          <Checkbox.Group
            value={arxivConfig.categories}
            onChange={(value) => setArxivConfig({...arxivConfig, categories: value as string[]})}
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

      <Card title="🔑 Keywords" size="small">
        <Form.Item label="Search Keywords">
          <Select
            mode="tags"
            value={arxivConfig.keywords}
            onChange={(value) => setArxivConfig({...arxivConfig, keywords: value})}
            placeholder="Enter keywords"
          />
        </Form.Item>
      </Card>

      <Card title="⚙️ Fetch Settings" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Period (Days)">
              <InputNumber
                min={1}
                max={365}
                value={arxivConfig.max_age_days}
                onChange={(value) => setArxivConfig({...arxivConfig, max_age_days: value || 30})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Max Results">
              <InputNumber
                min={10}
                max={1000}
                value={arxivConfig.max_results}
                onChange={(value) => setArxivConfig({...arxivConfig, max_results: value || 100})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sort By">
              <Select
                value={arxivConfig.sort_by}
                onChange={(value) => setArxivConfig({...arxivConfig, sort_by: value})}
              >
                <Option value="relevance">Relevance</Option>
                <Option value="lastUpdatedDate">Updated Date</Option>
                <Option value="submittedDate">Submitted Date</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  )

  // Hugging Face配置面板
  const renderHuggingFaceConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="🤖 Model Settings" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Pipeline Tasks">
              <Select
                mode="multiple"
                value={huggingfaceConfig.pipeline_tags}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, pipeline_tags: value})}
                placeholder="Select tasks"
              >
                {huggingfacePipelineTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Supported Languages">
              <Select
                mode="multiple"
                value={huggingfaceConfig.languages}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, languages: value})}
                placeholder="Select languages"
              >
                <Option value="en">English</Option>
                <Option value="ja">Japanese</Option>
                <Option value="zh">Chinese</Option>
                <Option value="ko">Korean</Option>
                <Option value="fr">French</Option>
                <Option value="de">German</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="📊 Filter Conditions" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Min Downloads">
              <InputNumber
                min={0}
                value={huggingfaceConfig.min_downloads}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, min_downloads: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Period (Days)">
              <InputNumber
                min={1}
                max={365}
                value={huggingfaceConfig.max_age_days}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, max_age_days: value || 30})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Sort By">
              <Select
                value={huggingfaceConfig.sort_by}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, sort_by: value})}
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
            <Form.Item label="Include Datasets">
              <Switch
                checked={huggingfaceConfig.include_datasets}
                onChange={(checked) => setHuggingfaceConfig({...huggingfaceConfig, include_datasets: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Include Spaces">
              <Switch
                checked={huggingfaceConfig.include_spaces}
                onChange={(checked) => setHuggingfaceConfig({...huggingfaceConfig, include_spaces: checked})}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  )

  // Zenn配置面板
  const renderZennConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="📝 Article Settings" size="small">
        <Form.Item label="Topics of Interest">
          <Select
            mode="tags"
            value={zennConfig.topics}
            onChange={(value) => setZennConfig({...zennConfig, topics: value})}
            placeholder="Enter topics"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Min Likes">
              <InputNumber
                min={0}
                value={zennConfig.min_likes}
                onChange={(value) => setZennConfig({...zennConfig, min_likes: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Period (Days)">
              <InputNumber
                min={1}
                max={365}
                value={zennConfig.max_age_days}
                onChange={(value) => setZennConfig({...zennConfig, max_age_days: value || 14})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Sort By">
              <Select
                value={zennConfig.sort_by}
                onChange={(value) => setZennConfig({...zennConfig, sort_by: value})}
              >
                <Option value="liked">Likes</Option>
                <Option value="published_at">Published Date</Option>
                <Option value="updated_at">Updated Date</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Include Books">
              <Switch
                checked={zennConfig.include_books}
                onChange={(checked) => setZennConfig({...zennConfig, include_books: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Include Scraps">
              <Switch
                checked={zennConfig.include_scraps}
                onChange={(checked) => setZennConfig({...zennConfig, include_scraps: checked})}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  )

  // 调度配置面板
  const renderScheduleConfig = () => (
    <Card title="⏰ Auto Collection Schedule">
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item label="Enable">
            <Switch
              checked={scheduleConfig.enabled}
              onChange={(checked) => setScheduleConfig({...scheduleConfig, enabled: checked})}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Frequency">
            <Select
              value={scheduleConfig.frequency}
              onChange={(value) => setScheduleConfig({...scheduleConfig, frequency: value})}
              disabled={!scheduleConfig.enabled}
            >
              <Option value="hourly">Hourly</Option>
              <Option value="daily">Daily</Option>
              <Option value="weekly">Weekly</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Execution Time">
            <TimePicker
              value={dayjs(scheduleConfig.time, 'HH:mm')}
              format="HH:mm"
              onChange={(time) => setScheduleConfig({
                ...scheduleConfig,
                time: time ? time.format('HH:mm') : '09:00'
              })}
              disabled={!scheduleConfig.enabled || scheduleConfig.frequency === 'hourly'}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="Timezone">
            <Select
              value={scheduleConfig.timezone}
              onChange={(value) => setScheduleConfig({...scheduleConfig, timezone: value})}
              disabled={!scheduleConfig.enabled}
            >
              <Option value="Asia/Tokyo">Asia/Tokyo</Option>
              <Option value="UTC">UTC</Option>
              <Option value="Asia/Shanghai">Asia/Shanghai</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  )

  // Azure OpenAI配置面板
  const renderAzureOpenAIConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Alert
        message="配置Azure OpenAI服务"
        description="配置后，系统将使用AI自动生成摘要、提取标签和试用建议。如果不配置，将使用基础功能。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card title="🤖 Azure OpenAI 基础配置" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="API Key" required>
              <Input.Password
                value={azureOpenAIConfig.api_key}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, api_key: e.target.value})}
                placeholder="请输入Azure OpenAI API Key"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="API Endpoint" required>
              <Input
                value={azureOpenAIConfig.api_endpoint}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, api_endpoint: e.target.value})}
                placeholder="https://your-resource.openai.azure.com/"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="API Version">
              <Input
                value={azureOpenAIConfig.api_version}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, api_version: e.target.value})}
                placeholder="2024-02-15-preview"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Deployment Name">
              <Input
                value={azureOpenAIConfig.deployment_name}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, deployment_name: e.target.value})}
                placeholder="gpt-4o"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Embedding Deployment">
              <Input
                value={azureOpenAIConfig.embedding_deployment_name}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, embedding_deployment_name: e.target.value})}
                placeholder="text-embedding-ada-002"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Model Name">
              <Input
                value={azureOpenAIConfig.model_name}
                onChange={(e) => setAzureOpenAIConfig({...azureOpenAIConfig, model_name: e.target.value})}
                placeholder="gpt-4o"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="启用AI功能">
              <Switch
                checked={azureOpenAIConfig.is_enabled}
                onChange={(checked) => setAzureOpenAIConfig({...azureOpenAIConfig, is_enabled: checked})}
              />
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                关闭后将不使用AI进行内容处理
              </Text>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveAzureOpenAIConfig}
                loading={loading}
              >
                保存配置
              </Button>
              <Button
                icon={<ApiOutlined />}
                onClick={testAzureOpenAIConfig}
                loading={testLoading}
              >
                测试连接
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  )

  return (
    <div>
      {/* 头部 */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ApiOutlined style={{ color: '#1890ff' }} />
              {t('apiConfig.title')}
            </Title>
            <Text type="secondary">{t('apiConfig.subtitle')}</Text>
          </div>
          
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadConfig}
            >
              {t('apiConfig.reloadSettings')}
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={saveConfig}
              loading={loading}
            >
              {t('apiConfig.saveSettings')}
            </Button>
          </Space>
        </div>
      </div>

      <Alert
        message="About Data Source Settings"
        description="Based on the conditions set here, technical information will be automatically collected from each data source. Be sure to click the save button after changing settings."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 配置选项卡 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: 24 }}>
        <TabPane 
          tab={<span><GithubOutlined />GitHub</span>} 
          key="github"
        >
          {renderGitHubConfig()}
        </TabPane>
        
        <TabPane 
          tab={<span><FileTextOutlined />arXiv</span>} 
          key="arxiv"
        >
          {renderArxivConfig()}
        </TabPane>
        
        <TabPane 
          tab={<span><RobotOutlined />Hugging Face</span>} 
          key="huggingface"
        >
          {renderHuggingFaceConfig()}
        </TabPane>
        
        <TabPane 
          tab={<span><EditOutlined />Zenn</span>} 
          key="zenn"
        >
          {renderZennConfig()}
        </TabPane>
        
        <TabPane
          tab={<span><ClockCircleOutlined />{t('apiConfig.schedule')}</span>}
          key="schedule"
        >
          {renderScheduleConfig()}
        </TabPane>

        <TabPane
          tab={<span><RobotOutlined />Azure OpenAI</span>}
          key="azure-openai"
        >
          {renderAzureOpenAIConfig()}
        </TabPane>
      </Tabs>
    </div>
  )
}

export default ApiConfigPage