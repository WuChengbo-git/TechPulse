import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Input, Select, Button, Switch, Typography, Space, Tabs, InputNumber, Alert, message, Collapse, TimePicker, Checkbox } from 'antd';
import { GithubOutlined, FileTextOutlined, RobotOutlined, EditOutlined, SaveOutlined, ReloadOutlined, ApiOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import dayjs from 'dayjs';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const ApiConfigPage = () => {
    const { t } = useLanguage();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('github');
    // 配置状态
    const [githubConfig, setGithubConfig] = useState({
        languages: ['Python', 'JavaScript', 'TypeScript'],
        topics: ['machine-learning', 'artificial-intelligence', 'web-development'],
        min_stars: 100,
        max_age_days: 7,
        activity_period: 'daily',
        sort_by: 'stars',
        per_page: 50,
        exclude_forks: true,
        include_archived: false
    });
    const [arxivConfig, setArxivConfig] = useState({
        categories: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.CV'],
        keywords: ['neural network', 'machine learning', 'deep learning'],
        max_age_days: 30,
        max_results: 100,
        sort_by: 'submittedDate',
        include_cross_lists: true
    });
    const [huggingfaceConfig, setHuggingfaceConfig] = useState({
        pipeline_tags: ['text-generation', 'image-classification', 'question-answering'],
        model_types: ['transformer', 'pytorch', 'tensorflow'],
        languages: ['en', 'ja', 'zh'],
        min_downloads: 10,
        max_age_days: 30,
        sort_by: 'downloads',
        include_datasets: true,
        include_spaces: false
    });
    const [zennConfig, setZennConfig] = useState({
        topics: ['React', 'Python', 'AI', 'Machine Learning', 'Web Development'],
        article_types: ['tech'],
        max_age_days: 14,
        min_likes: 5,
        sort_by: 'liked',
        include_books: true,
        include_scraps: false
    });
    const [scheduleConfig, setScheduleConfig] = useState({
        enabled: true,
        frequency: 'daily',
        time: '09:00',
        timezone: 'Asia/Tokyo'
    });
    // 预定义选项
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
    // 保存配置
    const saveConfig = async () => {
        try {
            setLoading(true);
            const configData = {
                github: githubConfig,
                arxiv: arxivConfig,
                huggingface: huggingfaceConfig,
                zenn: zennConfig,
                schedule: scheduleConfig
            };
            const response = await fetch('/api/v1/config/sources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configData)
            });
            if (response.ok) {
                message.success('Settings saved successfully');
            }
            else {
                throw new Error('Save failed');
            }
        }
        catch (error) {
            message.error('Failed to save settings');
        }
        finally {
            setLoading(false);
        }
    };
    // 加载配置
    const loadConfig = async () => {
        try {
            const response = await fetch('/api/v1/config/sources');
            if (response.ok) {
                const data = await response.json();
                setGithubConfig(data.github || githubConfig);
                setArxivConfig(data.arxiv || arxivConfig);
                setHuggingfaceConfig(data.huggingface || huggingfaceConfig);
                setZennConfig(data.zenn || zennConfig);
                setScheduleConfig(data.schedule || scheduleConfig);
            }
        }
        catch (error) {
            console.error('Failed to load config:', error);
        }
    };
    useEffect(() => {
        loadConfig();
    }, []);
    // GitHub配置面板
    const renderGitHubConfig = () => (_jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsx(Card, { title: `🔍 ${t('apiConfig.searchCriteria')}`, size: "small", children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.programmingLanguages'), children: _jsx(Select, { mode: "multiple", value: githubConfig.languages, onChange: (value) => setGithubConfig({ ...githubConfig, languages: value }), placeholder: t('apiConfig.selectLanguages'), children: githubLanguages.map(lang => (_jsx(Option, { value: lang, children: lang }, lang))) }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.topics'), children: _jsx(Select, { mode: "multiple", value: githubConfig.topics, onChange: (value) => setGithubConfig({ ...githubConfig, topics: value }), placeholder: t('apiConfig.selectTopics'), children: githubTopics.map(topic => (_jsx(Option, { value: topic, children: topic }, topic))) }) }) })] }) }), _jsxs(Card, { title: `⭐ ${t('apiConfig.filterConditions')}`, size: "small", children: [_jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.minimumStars'), children: _jsx(InputNumber, { min: 0, value: githubConfig.min_stars, onChange: (value) => setGithubConfig({ ...githubConfig, min_stars: value || 0 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.periodDays'), children: _jsxs(Select, { value: githubConfig.max_age_days, onChange: (value) => setGithubConfig({ ...githubConfig, max_age_days: value }), children: [_jsx(Option, { value: 1, children: "1 day" }), _jsx(Option, { value: 7, children: "1 week" }), _jsx(Option, { value: 30, children: "1 month" }), _jsx(Option, { value: 90, children: "3 months" })] }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.fetchCount'), children: _jsx(InputNumber, { min: 10, max: 100, value: githubConfig.per_page, onChange: (value) => setGithubConfig({ ...githubConfig, per_page: value || 50 }), style: { width: '100%' } }) }) })] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.sortBy'), children: _jsxs(Select, { value: githubConfig.sort_by, onChange: (value) => setGithubConfig({ ...githubConfig, sort_by: value }), children: [_jsx(Option, { value: "stars", children: t('apiConfig.sortStars') }), _jsx(Option, { value: "updated", children: t('apiConfig.sortUpdated') }), _jsx(Option, { value: "created", children: t('apiConfig.sortCreated') })] }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.excludeForks'), children: _jsx(Switch, { checked: githubConfig.exclude_forks, onChange: (checked) => setGithubConfig({ ...githubConfig, exclude_forks: checked }) }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.includeArchived'), children: _jsx(Switch, { checked: githubConfig.include_archived, onChange: (checked) => setGithubConfig({ ...githubConfig, include_archived: checked }) }) }) })] })] })] }));
    // arXiv配置面板
    const renderArxivConfig = () => (_jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsx(Card, { title: `📚 ${t('apiConfig.researchFields')}`, size: "small", children: _jsx(Form.Item, { label: t('apiConfig.categories'), children: _jsx(Checkbox.Group, { value: arxivConfig.categories, onChange: (value) => setArxivConfig({ ...arxivConfig, categories: value }), children: _jsx(Row, { children: arxivCategories.map(cat => (_jsx(Col, { span: 12, style: { marginBottom: 8 }, children: _jsx(Checkbox, { value: cat.value, children: cat.label }) }, cat.value))) }) }) }) }), _jsx(Card, { title: `🔑 ${t('apiConfig.keywords')}`, size: "small", children: _jsx(Form.Item, { label: t('apiConfig.searchKeywords'), children: _jsx(Select, { mode: "tags", value: arxivConfig.keywords, onChange: (value) => setArxivConfig({ ...arxivConfig, keywords: value }), placeholder: t('apiConfig.enterKeywords') }) }) }), _jsx(Card, { title: `⚙️ ${t('apiConfig.fetchSettings')}`, size: "small", children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.periodDays'), children: _jsx(InputNumber, { min: 1, max: 365, value: arxivConfig.max_age_days, onChange: (value) => setArxivConfig({ ...arxivConfig, max_age_days: value || 30 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.maxResults'), children: _jsx(InputNumber, { min: 10, max: 1000, value: arxivConfig.max_results, onChange: (value) => setArxivConfig({ ...arxivConfig, max_results: value || 100 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.sortBy'), children: _jsxs(Select, { value: arxivConfig.sort_by, onChange: (value) => setArxivConfig({ ...arxivConfig, sort_by: value }), children: [_jsx(Option, { value: "relevance", children: t('apiConfig.sortRelevance') }), _jsx(Option, { value: "lastUpdatedDate", children: t('apiConfig.sortLastUpdated') }), _jsx(Option, { value: "submittedDate", children: t('apiConfig.sortSubmitted') })] }) }) })] }) })] }));
    // Hugging Face配置面板
    const renderHuggingFaceConfig = () => (_jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsx(Card, { title: `🤖 ${t('apiConfig.modelSettings')}`, size: "small", children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.pipelineTasks'), children: _jsx(Select, { mode: "multiple", value: huggingfaceConfig.pipeline_tags, onChange: (value) => setHuggingfaceConfig({ ...huggingfaceConfig, pipeline_tags: value }), placeholder: t('apiConfig.selectTasks'), children: huggingfacePipelineTags.map(tag => (_jsx(Option, { value: tag, children: tag }, tag))) }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.supportedLanguages'), children: _jsxs(Select, { mode: "multiple", value: huggingfaceConfig.languages, onChange: (value) => setHuggingfaceConfig({ ...huggingfaceConfig, languages: value }), placeholder: t('apiConfig.selectLanguages'), children: [_jsx(Option, { value: "en", children: "English" }), _jsx(Option, { value: "ja", children: "Japanese" }), _jsx(Option, { value: "zh", children: "Chinese" }), _jsx(Option, { value: "ko", children: "Korean" }), _jsx(Option, { value: "fr", children: "French" }), _jsx(Option, { value: "de", children: "German" })] }) }) })] }) }), _jsxs(Card, { title: `📊 ${t('apiConfig.filterConditions')}`, size: "small", children: [_jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.minDownloads'), children: _jsx(InputNumber, { min: 0, value: huggingfaceConfig.min_downloads, onChange: (value) => setHuggingfaceConfig({ ...huggingfaceConfig, min_downloads: value || 0 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.periodDays'), children: _jsx(InputNumber, { min: 1, max: 365, value: huggingfaceConfig.max_age_days, onChange: (value) => setHuggingfaceConfig({ ...huggingfaceConfig, max_age_days: value || 30 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.sortBy'), children: _jsxs(Select, { value: huggingfaceConfig.sort_by, onChange: (value) => setHuggingfaceConfig({ ...huggingfaceConfig, sort_by: value }), children: [_jsx(Option, { value: "downloads", children: t('apiConfig.sortDownloads') }), _jsx(Option, { value: "likes", children: t('apiConfig.sortLikes') }), _jsx(Option, { value: "updated", children: t('apiConfig.sortUpdated') }), _jsx(Option, { value: "created", children: t('apiConfig.sortCreated') })] }) }) })] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.includeDatasets'), children: _jsx(Switch, { checked: huggingfaceConfig.include_datasets, onChange: (checked) => setHuggingfaceConfig({ ...huggingfaceConfig, include_datasets: checked }) }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.includeSpaces'), children: _jsx(Switch, { checked: huggingfaceConfig.include_spaces, onChange: (checked) => setHuggingfaceConfig({ ...huggingfaceConfig, include_spaces: checked }) }) }) })] })] })] }));
    // Zenn配置面板
    const renderZennConfig = () => (_jsx(Space, { direction: "vertical", style: { width: '100%' }, children: _jsxs(Card, { title: `📝 ${t('apiConfig.articleSettings')}`, size: "small", children: [_jsx(Form.Item, { label: t('apiConfig.topicsOfInterest'), children: _jsx(Select, { mode: "tags", value: zennConfig.topics, onChange: (value) => setZennConfig({ ...zennConfig, topics: value }), placeholder: t('apiConfig.enterTopics') }) }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.minLikes'), children: _jsx(InputNumber, { min: 0, value: zennConfig.min_likes, onChange: (value) => setZennConfig({ ...zennConfig, min_likes: value || 0 }), style: { width: '100%' } }) }) }), _jsx(Col, { span: 12, children: _jsx(Form.Item, { label: t('apiConfig.periodDays'), children: _jsx(InputNumber, { min: 1, max: 365, value: zennConfig.max_age_days, onChange: (value) => setZennConfig({ ...zennConfig, max_age_days: value || 14 }), style: { width: '100%' } }) }) })] }), _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.sortBy'), children: _jsxs(Select, { value: zennConfig.sort_by, onChange: (value) => setZennConfig({ ...zennConfig, sort_by: value }), children: [_jsx(Option, { value: "liked", children: t('apiConfig.sortLiked') }), _jsx(Option, { value: "published_at", children: t('apiConfig.sortPublished') }), _jsx(Option, { value: "updated_at", children: t('apiConfig.sortUpdated') })] }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.includeBooks'), children: _jsx(Switch, { checked: zennConfig.include_books, onChange: (checked) => setZennConfig({ ...zennConfig, include_books: checked }) }) }) }), _jsx(Col, { span: 8, children: _jsx(Form.Item, { label: t('apiConfig.includeScraps'), children: _jsx(Switch, { checked: zennConfig.include_scraps, onChange: (checked) => setZennConfig({ ...zennConfig, include_scraps: checked }) }) }) })] })] }) }));
    // 调度配置面板
    const renderScheduleConfig = () => (_jsx(Card, { title: `⏰ ${t('apiConfig.autoCollectionSchedule')}`, children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 6, children: _jsx(Form.Item, { label: t('apiConfig.enable'), children: _jsx(Switch, { checked: scheduleConfig.enabled, onChange: (checked) => setScheduleConfig({ ...scheduleConfig, enabled: checked }) }) }) }), _jsx(Col, { span: 6, children: _jsx(Form.Item, { label: t('apiConfig.frequency'), children: _jsxs(Select, { value: scheduleConfig.frequency, onChange: (value) => setScheduleConfig({ ...scheduleConfig, frequency: value }), disabled: !scheduleConfig.enabled, children: [_jsx(Option, { value: "hourly", children: t('apiConfig.hourly') }), _jsx(Option, { value: "daily", children: t('apiConfig.daily') }), _jsx(Option, { value: "weekly", children: t('apiConfig.weekly') })] }) }) }), _jsx(Col, { span: 6, children: _jsx(Form.Item, { label: t('apiConfig.executionTime'), children: _jsx(TimePicker, { value: dayjs(scheduleConfig.time, 'HH:mm'), format: "HH:mm", onChange: (time) => setScheduleConfig({
                                ...scheduleConfig,
                                time: time ? time.format('HH:mm') : '09:00'
                            }), disabled: !scheduleConfig.enabled || scheduleConfig.frequency === 'hourly' }) }) }), _jsx(Col, { span: 6, children: _jsx(Form.Item, { label: t('apiConfig.timezone'), children: _jsxs(Select, { value: scheduleConfig.timezone, onChange: (value) => setScheduleConfig({ ...scheduleConfig, timezone: value }), disabled: !scheduleConfig.enabled, children: [_jsx(Option, { value: "Asia/Tokyo", children: "Asia/Tokyo" }), _jsx(Option, { value: "UTC", children: "UTC" }), _jsx(Option, { value: "Asia/Shanghai", children: "Asia/Shanghai" })] }) }) })] }) }));
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(ApiOutlined, { style: { color: '#1890ff' } }), t('apiConfig.title')] }), _jsx(Text, { type: "secondary", children: t('apiConfig.subtitle') })] }), _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: loadConfig, children: t('apiConfig.reloadSettings') }), _jsx(Button, { type: "primary", icon: _jsx(SaveOutlined, {}), onClick: saveConfig, loading: loading, children: t('apiConfig.saveSettings') })] })] }) }), _jsx(Alert, { message: "About Data Source Settings", description: "Based on the conditions set here, technical information will be automatically collected from each data source. Be sure to click the save button after changing settings.", type: "info", showIcon: true, style: { marginBottom: 24 } }), _jsxs(Tabs, { activeKey: activeTab, onChange: setActiveTab, style: { marginBottom: 24 }, children: [_jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(GithubOutlined, {}), "GitHub"] }), children: renderGitHubConfig() }, "github"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(FileTextOutlined, {}), "arXiv"] }), children: renderArxivConfig() }, "arxiv"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(RobotOutlined, {}), "Hugging Face"] }), children: renderHuggingFaceConfig() }, "huggingface"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(EditOutlined, {}), "Zenn"] }), children: renderZennConfig() }, "zenn"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(ClockCircleOutlined, {}), t('apiConfig.schedule')] }), children: renderScheduleConfig() }, "schedule")] })] }));
};
export default ApiConfigPage;
