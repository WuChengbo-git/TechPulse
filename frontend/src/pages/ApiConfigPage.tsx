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

const ApiConfigPage: React.FC = () => {
  const { t } = useLanguage()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
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
        message.success('設定を保存しました')
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      message.error('設定の保存に失敗しました')
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

  useEffect(() => {
    loadConfig()
  }, [])

  // GitHub配置面板
  const renderGitHubConfig = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card title="🔍 検索条件" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="プログラミング言語">
              <Select
                mode="multiple"
                value={githubConfig.languages}
                onChange={(value) => setGithubConfig({...githubConfig, languages: value})}
                placeholder="言語を選択"
              >
                {githubLanguages.map(lang => (
                  <Option key={lang} value={lang}>{lang}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="トピック">
              <Select
                mode="multiple"
                value={githubConfig.topics}
                onChange={(value) => setGithubConfig({...githubConfig, topics: value})}
                placeholder="トピックを選択"
              >
                {githubTopics.map(topic => (
                  <Option key={topic} value={topic}>{topic}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="⭐ フィルタ条件" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="最小スター数">
              <InputNumber
                min={0}
                value={githubConfig.min_stars}
                onChange={(value) => setGithubConfig({...githubConfig, min_stars: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="期間（日）">
              <Select
                value={githubConfig.max_age_days}
                onChange={(value) => setGithubConfig({...githubConfig, max_age_days: value})}
              >
                <Option value={1}>1日</Option>
                <Option value={7}>1週間</Option>
                <Option value={30}>1ヶ月</Option>
                <Option value={90}>3ヶ月</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="取得数">
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
            <Form.Item label="ソート順">
              <Select
                value={githubConfig.sort_by}
                onChange={(value) => setGithubConfig({...githubConfig, sort_by: value})}
              >
                <Option value="stars">スター数</Option>
                <Option value="updated">更新日時</Option>
                <Option value="created">作成日時</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="フォークを除外">
              <Switch
                checked={githubConfig.exclude_forks}
                onChange={(checked) => setGithubConfig({...githubConfig, exclude_forks: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="アーカイブを含む">
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
      <Card title="📚 研究分野" size="small">
        <Form.Item label="カテゴリ">
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

      <Card title="🔑 キーワード" size="small">
        <Form.Item label="検索キーワード">
          <Select
            mode="tags"
            value={arxivConfig.keywords}
            onChange={(value) => setArxivConfig({...arxivConfig, keywords: value})}
            placeholder="キーワードを入力"
          />
        </Form.Item>
      </Card>

      <Card title="⚙️ 取得設定" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="期間（日）">
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
            <Form.Item label="最大結果数">
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
            <Form.Item label="ソート順">
              <Select
                value={arxivConfig.sort_by}
                onChange={(value) => setArxivConfig({...arxivConfig, sort_by: value})}
              >
                <Option value="relevance">関連度</Option>
                <Option value="lastUpdatedDate">更新日時</Option>
                <Option value="submittedDate">投稿日時</Option>
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
      <Card title="🤖 モデル設定" size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="パイプラインタスク">
              <Select
                mode="multiple"
                value={huggingfaceConfig.pipeline_tags}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, pipeline_tags: value})}
                placeholder="タスクを選択"
              >
                {huggingfacePipelineTags.map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="対応言語">
              <Select
                mode="multiple"
                value={huggingfaceConfig.languages}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, languages: value})}
                placeholder="言語を選択"
              >
                <Option value="en">英語</Option>
                <Option value="ja">日本語</Option>
                <Option value="zh">中国語</Option>
                <Option value="ko">韓国語</Option>
                <Option value="fr">フランス語</Option>
                <Option value="de">ドイツ語</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="📊 フィルタ条件" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="最小ダウンロード数">
              <InputNumber
                min={0}
                value={huggingfaceConfig.min_downloads}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, min_downloads: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="期間（日）">
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
            <Form.Item label="ソート順">
              <Select
                value={huggingfaceConfig.sort_by}
                onChange={(value) => setHuggingfaceConfig({...huggingfaceConfig, sort_by: value})}
              >
                <Option value="downloads">ダウンロード数</Option>
                <Option value="likes">いいね数</Option>
                <Option value="updated">更新日時</Option>
                <Option value="created">作成日時</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="データセットを含む">
              <Switch
                checked={huggingfaceConfig.include_datasets}
                onChange={(checked) => setHuggingfaceConfig({...huggingfaceConfig, include_datasets: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Spacesを含む">
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
      <Card title="📝 記事設定" size="small">
        <Form.Item label="興味のあるトピック">
          <Select
            mode="tags"
            value={zennConfig.topics}
            onChange={(value) => setZennConfig({...zennConfig, topics: value})}
            placeholder="トピックを入力"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="最小いいね数">
              <InputNumber
                min={0}
                value={zennConfig.min_likes}
                onChange={(value) => setZennConfig({...zennConfig, min_likes: value || 0})}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="期間（日）">
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
            <Form.Item label="ソート順">
              <Select
                value={zennConfig.sort_by}
                onChange={(value) => setZennConfig({...zennConfig, sort_by: value})}
              >
                <Option value="liked">いいね順</Option>
                <Option value="published_at">公開日順</Option>
                <Option value="updated_at">更新日順</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="本を含む">
              <Switch
                checked={zennConfig.include_books}
                onChange={(checked) => setZennConfig({...zennConfig, include_books: checked})}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="スクラップを含む">
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
    <Card title="⏰ 自動収集スケジュール">
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item label="有効化">
            <Switch
              checked={scheduleConfig.enabled}
              onChange={(checked) => setScheduleConfig({...scheduleConfig, enabled: checked})}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="頻度">
            <Select
              value={scheduleConfig.frequency}
              onChange={(value) => setScheduleConfig({...scheduleConfig, frequency: value})}
              disabled={!scheduleConfig.enabled}
            >
              <Option value="hourly">毎時</Option>
              <Option value="daily">毎日</Option>
              <Option value="weekly">毎週</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item label="実行時刻">
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
          <Form.Item label="タイムゾーン">
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
        message="データソース設定について"
        description="ここで設定した条件に基づいて、各データソースから技術情報が自動収集されます。設定変更後は必ず保存ボタンをクリックしてください。"
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
      </Tabs>
    </div>
  )
}

export default ApiConfigPage