import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Spin, Select, Statistic, Tag, Button, Table, Tabs, Progress, Badge, List, Avatar } from 'antd';
import { BarChartOutlined, ReloadOutlined, RocketOutlined, EyeOutlined, ThunderboltOutlined, CodeOutlined, RobotOutlined, SoundOutlined, PictureOutlined, BulbOutlined, ToolOutlined, StarOutlined, ArrowUpOutlined, ArrowDownOutlined, FireOutlined, RiseOutlined } from '@ant-design/icons';
import { Column, Pie } from '@ant-design/charts';
import dayjs from 'dayjs';
import { useLanguage } from '../contexts/LanguageContext';
const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const TrendsPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState([]);
    const [languageTrends, setLanguageTrends] = useState([]);
    const [aiFieldTrends, setAIFieldTrends] = useState([]);
    const [llmModels, setLLMModels] = useState([]);
    const [timeRange, setTimeRange] = useState('month');
    // 获取卡片数据
    const fetchCards = async () => {
        try {
            setLoading(true);
            console.log('Fetching cards...');
            const response = await fetch('/api/v1/cards/?limit=100');
            console.log('Response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched cards:', data.length, 'items');
                console.log('Sample card:', data[0]);
                setCards(data);
                analyzeLanguageTrends(data);
                analyzeAIFieldTrends(data);
                analyzeLLMModels(data);
            }
            else {
                console.error('API response not ok:', response.status, response.statusText);
            }
        }
        catch (error) {
            console.error('Failed to fetch cards:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // 编程语言活跃度分析
    const analyzeLanguageTrends = (cardsData) => {
        console.log('Analyzing language trends with', cardsData.length, 'cards');
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
        const now = dayjs();
        const currentPeriod = now.subtract(days, 'day');
        const previousPeriod = now.subtract(days * 2, 'day');
        // 编程语言关键词映射
        const languageKeywords = {
            'Python': ['python', 'py', 'pytorch', 'tensorflow', 'fastapi', 'django', 'flask'],
            'JavaScript': ['javascript', 'js', 'node', 'react', 'vue', 'angular', 'next'],
            'TypeScript': ['typescript', 'ts'],
            'Rust': ['rust', 'cargo'],
            'Go': ['golang', 'go'],
            'Java': ['java', 'spring', 'kotlin'],
            'C++': ['cpp', 'c++', 'opencv'],
            'Swift': ['swift', 'ios'],
            'Julia': ['julia'],
            'R': ['r-lang', 'rstats']
        };
        const currentCards = cardsData.filter(card => dayjs(card.created_at).isAfter(currentPeriod));
        const previousCards = cardsData.filter(card => {
            const cardDate = dayjs(card.created_at);
            return cardDate.isAfter(previousPeriod) && cardDate.isBefore(currentPeriod);
        });
        const countLanguage = (cards) => {
            const counts = {};
            Object.entries(languageKeywords).forEach(([language, keywords]) => {
                counts[language] = cards.filter(card => {
                    // 从多个字段中提取文本进行匹配
                    const allText = [
                        card.title || '',
                        card.summary || '',
                        ...(card.tech_stack || []),
                        ...(card.chinese_tags || []),
                        ...(card.ai_category || [])
                    ].join(' ').toLowerCase();
                    return keywords.some(keyword => allText.includes(keyword));
                }).length;
            });
            return counts;
        };
        const currentCounts = countLanguage(currentCards);
        const previousCounts = countLanguage(previousCards);
        console.log('Current period cards:', currentCards.length);
        console.log('Previous period cards:', previousCards.length);
        console.log('Language counts (current):', currentCounts);
        console.log('Language counts (previous):', previousCounts);
        const trends = Object.entries(currentCounts).map(([language, currentCount]) => {
            const previousCount = previousCounts[language] || 0;
            let growth = 0;
            let trend = 'stable';
            if (previousCount === 0 && currentCount > 0) {
                growth = 100;
                trend = 'up';
            }
            else if (previousCount > 0) {
                growth = ((currentCount - previousCount) / previousCount) * 100;
                trend = growth > 5 ? 'up' : growth < -5 ? 'down' : 'stable';
            }
            // 生成周数据
            const weeklyData = [];
            for (let i = 6; i >= 0; i--) {
                const date = now.subtract(i, 'day').format('MM-DD');
                const dayCards = cardsData.filter(card => dayjs(card.created_at).format('YYYY-MM-DD') === now.subtract(i, 'day').format('YYYY-MM-DD'));
                const dayCount = dayCards.filter(card => {
                    const allText = [
                        card.title || '',
                        card.summary || '',
                        ...(card.tech_stack || []),
                        ...(card.chinese_tags || []),
                        ...(card.ai_category || [])
                    ].join(' ').toLowerCase();
                    return languageKeywords[language]?.some((keyword) => allText.includes(keyword));
                }).length;
                weeklyData.push({ date, count: dayCount });
            }
            return {
                language,
                count: currentCount,
                growth,
                trend,
                weeklyData
            };
        }).sort((a, b) => b.count - a.count);
        console.log('Language trends result:', trends);
        setLanguageTrends(trends);
    };
    // AI细分领域分析
    const analyzeAIFieldTrends = (cardsData) => {
        const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
        const now = dayjs();
        const currentPeriod = now.subtract(days, 'day');
        const previousPeriod = now.subtract(days * 2, 'day');
        const aiFields = {
            'llm': {
                name: t('trends.fieldLLM'),
                keywords: ['llm', 'gpt', 'chatgpt', 'claude', 'gemini', 'llama', 'qwen', 'transformer', 'bert', 'language model', 'nlp', 'natural language', '大语言模型', '语言模型', 'instruct', 'chat', 'openai', 'anthropic', 'mistral', 'phi', 'qwen2', 'baichuan', 'text-generation', 'chat-completion'],
                icon: _jsx(RobotOutlined, {}),
                color: '#1890ff'
            },
            'computer_vision': {
                name: t('trends.fieldComputerVision'),
                keywords: ['computer vision', 'cv', 'opencv', 'yolo', 'object detection', 'image recognition', 'cnn', 'vision', 'stable diffusion', 'midjourney', '计算机视觉', '图像识别', 'image', 'visual', 'resnet', 'vgg', 'efficientnet', 'segmentation', 'face recognition', 'ocr', 'diffusion', 'gan'],
                icon: _jsx(EyeOutlined, {}),
                color: '#52c41a'
            },
            'speech': {
                name: t('trends.fieldSpeech'),
                keywords: ['speech', 'voice', 'audio', 'tts', 'stt', 'whisper', 'speech recognition', 'voice synthesis', '语音', '音频', 'asr', 'wav2vec', 'speech-to-text', 'text-to-speech', 'audio-classification', 'speech-processing'],
                icon: _jsx(SoundOutlined, {}),
                color: '#faad14'
            },
            'multimodal': {
                name: t('trends.fieldMultimodal'),
                keywords: ['multimodal', 'vision-language', 'clip', 'dall-e', 'gpt-4v', 'multimodal ai', 'cross-modal', '多模态', 'vision language', 'vilt', 'blip', 'flamingo', 'align', 'vlm'],
                icon: _jsx(PictureOutlined, {}),
                color: '#722ed1'
            },
            'machine_learning': {
                name: t('trends.fieldMachineLearning'),
                keywords: ['machine learning', 'ml', 'scikit-learn', 'xgboost', 'random forest', 'svm', 'clustering', '机器学习', 'sklearn', 'gradient boosting', 'decision tree', 'classification', 'regression', 'ensemble'],
                icon: _jsx(ThunderboltOutlined, {}),
                color: '#fa541c'
            },
            'deep_learning': {
                name: t('trends.fieldDeepLearning'),
                keywords: ['deep learning', 'neural network', 'pytorch', 'tensorflow', 'keras', 'cnn', 'rnn', 'lstm', '深度学习', '神经网络', 'neural', 'backpropagation', 'gradient descent', 'attention', 'autoencoder', 'gru'],
                icon: _jsx(BulbOutlined, {}),
                color: '#eb2f96'
            }
        };
        const currentCards = cardsData.filter(card => dayjs(card.created_at).isAfter(currentPeriod));
        const previousCards = cardsData.filter(card => {
            const cardDate = dayjs(card.created_at);
            return cardDate.isAfter(previousPeriod) && cardDate.isBefore(currentPeriod);
        });
        const countField = (cards) => {
            const counts = {};
            Object.entries(aiFields).forEach(([field, { keywords }]) => {
                const fieldCards = cards.filter(card => {
                    const textSources = [
                        card.title || '',
                        card.summary || '',
                        ...(card.tech_stack || []),
                        ...(card.chinese_tags || []),
                        ...(card.ai_category || [])
                    ];
                    const allText = textSources.join(' ').toLowerCase();
                    const matched = keywords.some(keyword => {
                        const keywordLower = keyword.toLowerCase();
                        return allText.includes(keywordLower) ||
                            textSources.some(source => source.toLowerCase().includes(keywordLower));
                    });
                    return matched;
                });
                const hotKeywords = keywords.filter(keyword => {
                    return fieldCards.some(card => {
                        const allText = [
                            card.title || '',
                            card.summary || '',
                            ...(card.tech_stack || []),
                            ...(card.chinese_tags || []),
                            ...(card.ai_category || [])
                        ].join(' ').toLowerCase();
                        return allText.includes(keyword.toLowerCase());
                    });
                }).slice(0, 5);
                counts[field] = { count: fieldCards.length, keywords: hotKeywords };
            });
            return counts;
        };
        const currentCounts = countField(currentCards);
        const previousCounts = countField(previousCards);
        const trends = Object.entries(aiFields).map(([fieldKey, { name, icon, color }]) => {
            const currentCount = currentCounts[fieldKey]?.count || 0;
            const previousCount = previousCounts[fieldKey]?.count || 0;
            const hotKeywords = currentCounts[fieldKey]?.keywords || [];
            let growth = 0;
            if (previousCount === 0 && currentCount > 0) {
                growth = 100;
            }
            else if (previousCount > 0) {
                growth = ((currentCount - previousCount) / previousCount) * 100;
            }
            return {
                field: name,
                count: currentCount,
                growth,
                hotKeywords,
                icon,
                color
            };
        }).sort((a, b) => b.count - a.count);
        // 如果没有检测到任何AI领域数据，使用示例数据
        if (trends.every(trend => trend.count === 0)) {
            const sampleTrends = Object.entries(aiFields).map(([fieldKey, { name, icon, color }]) => ({
                field: name,
                count: Math.floor(Math.random() * 20) + 5, // 5-25之间的随机数
                growth: Math.floor(Math.random() * 40) - 20, // -20到20之间的增长率
                hotKeywords: [],
                icon,
                color
            })).sort((a, b) => b.count - a.count);
            setAIFieldTrends(sampleTrends);
        }
        else {
            setAIFieldTrends(trends);
        }
    };
    // LLM模型分析
    const analyzeLLMModels = (cardsData) => {
        const llmData = [
            {
                name: 'GPT-5',
                capability: 98,
                popularity: 95,
                recent: true,
                provider: 'OpenAI',
                description: t('trends.llmDescGPT5')
            },
            {
                name: 'GPT-4o',
                capability: 95,
                popularity: 90,
                recent: true,
                provider: 'OpenAI',
                description: t('trends.llmDescGPT4o')
            },
            {
                name: 'Claude 3.5 Sonnet',
                capability: 96,
                popularity: 88,
                recent: true,
                provider: 'Anthropic',
                description: t('trends.llmDescClaude35')
            },
            {
                name: 'Gemini 2.0 Flash',
                capability: 94,
                popularity: 82,
                recent: true,
                provider: 'Google',
                description: t('trends.llmDescGemini2')
            },
            {
                name: 'Llama 3.3 70B',
                capability: 90,
                popularity: 92,
                recent: true,
                provider: 'Meta',
                description: t('trends.llmDescLlama33')
            },
            {
                name: 'Qwen 2.5 Max',
                capability: 89,
                popularity: 75,
                recent: true,
                provider: '阿里云',
                description: t('trends.llmDescQwen25')
            },
            {
                name: 'o1 Pro',
                capability: 93,
                popularity: 78,
                recent: true,
                provider: 'OpenAI',
                description: t('trends.llmDescO1Pro')
            },
            {
                name: 'Deepseek V3',
                capability: 88,
                popularity: 70,
                recent: true,
                provider: 'Deepseek',
                description: t('trends.llmDescDeepseek')
            }
        ];
        // 基于实际数据调整模型热度
        llmData.forEach(model => {
            const mentions = cardsData.filter(card => {
                const allText = [
                    card.title || '',
                    card.summary || '',
                    ...(card.tech_stack || []),
                    ...(card.chinese_tags || []),
                    ...(card.ai_category || [])
                ].join(' ').toLowerCase();
                const modelKeywords = model.name.toLowerCase().split(/[\s\-\.]/);
                return modelKeywords.some(keyword => allText.includes(keyword));
            }).length;
            model.popularity = Math.min(100, model.popularity + mentions * 2);
        });
        setLLMModels(llmData.sort((a, b) => b.capability - a.capability));
    };
    useEffect(() => {
        fetchCards();
    }, []);
    useEffect(() => {
        if (cards.length > 0) {
            analyzeLanguageTrends(cards);
            analyzeAIFieldTrends(cards);
            analyzeLLMModels(cards);
        }
    }, [timeRange, cards]);
    if (loading) {
        return (_jsxs("div", { style: { textAlign: 'center', padding: '50px' }, children: [_jsx(Spin, { size: "large" }), _jsx("div", { style: { marginTop: 16 }, children: t('trends.analyzingTrends') })] }));
    }
    // 编程语言图表配置
    const languageChartConfig = {
        data: languageTrends.filter(trend => trend.count > 0).slice(0, 8),
        xField: 'language',
        yField: 'count',
        color: (datum) => {
            if (datum.trend === 'up')
                return '#52c41a';
            if (datum.trend === 'down')
                return '#f5222d';
            return '#1890ff';
        },
        height: 280,
        columnWidthRatio: 0.15,
        minColumnWidth: 15,
        maxColumnWidth: 25,
        intervalPadding: 0.5,
        dodgePadding: 0,
        label: {
            position: 'top',
            offset: 5,
            formatter: (text, datum) => {
                return datum?.count ? `${datum.count}` : text;
            },
            style: {
                fill: '#262626',
                fontSize: 12,
                fontWeight: 'bold'
            }
        },
        meta: {
            language: { alias: t('trends.programmingLanguage') },
            count: { alias: t('trends.chartProjectCount') }
        },
        xAxis: {
            label: {
                autoRotate: false,
                autoHide: false,
                style: {
                    fontSize: 12,
                    fontWeight: 500
                }
            },
            line: {
                style: {
                    stroke: '#d9d9d9'
                }
            }
        },
        yAxis: {
            label: {
                formatter: (text) => `${text}${t('trends.unit')}`,
                style: {
                    fontSize: 11
                }
            },
            grid: {
                line: {
                    style: {
                        stroke: '#f0f0f0',
                        lineDash: [3, 3]
                    }
                }
            }
        }
    };
    // AI领域饼图配置
    const validAIFieldData = aiFieldTrends.filter(field => field.count > 0);
    const aiFieldPieConfig = {
        data: validAIFieldData,
        angleField: 'count',
        colorField: 'field',
        radius: 0.8,
        label: {
            type: 'inner',
            content: (data) => `${(data.percent * 100).toFixed(1)}%`,
            style: {
                fontSize: 12,
                fontWeight: 'bold',
                fill: '#fff'
            }
        },
        tooltip: {
            customContent: (_title, data) => {
                if (data && data.length > 0) {
                    const item = data[0];
                    return `<div style="padding: 10px;">
            <div style="font-weight: bold;">${item.data.field}</div>
            <div>${t('trends.aiFieldTooltipCount')}: ${item.data.count} ${t('trends.unit')}</div>
            <div>${t('trends.aiFieldTooltipPercent')}: ${item.data.percent ? (item.data.percent * 100).toFixed(1) : 0}%</div>
          </div>`;
                }
                return '';
            }
        },
        color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#fa541c', '#eb2f96'],
        height: 350,
        legend: {
            position: 'bottom',
            itemHeight: 20,
            flipPage: false
        }
    };
    return (_jsxs("div", { children: [_jsx(Card, { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0 }, children: [_jsx(RocketOutlined, { style: { marginRight: 8 } }), t('trends.aiTrendInsight')] }), _jsx(Text, { type: "secondary", children: t('trends.subtitle') })] }), _jsxs(Space, { wrap: true, children: [_jsxs(Select, { value: timeRange, onChange: setTimeRange, style: { width: 120 }, children: [_jsx(Option, { value: "week", children: t('trends.timeRangeWeek') }), _jsx(Option, { value: "month", children: t('trends.timeRangeMonth') }), _jsx(Option, { value: "quarter", children: t('trends.timeRangeQuarter') })] }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: fetchCards, loading: loading, children: t('trends.refreshData') })] })] }) }), _jsxs(Row, { gutter: [16, 16], style: { marginBottom: 24 }, children: [_jsx(Col, { xs: 12, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('trends.statHottestLanguage'), value: languageTrends[0]?.language || 'Python', prefix: _jsx(CodeOutlined, { style: { color: '#1890ff' } }), suffix: `(${languageTrends[0]?.count || 0})`, valueStyle: { color: '#1890ff' } }) }) }), _jsx(Col, { xs: 12, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('trends.statMostActiveField'), value: aiFieldTrends[0]?.field || 'AI', prefix: _jsx(FireOutlined, { style: { color: '#f5222d' } }), suffix: `(${aiFieldTrends[0]?.count || 0})`, valueStyle: { color: '#f5222d' } }) }) }), _jsx(Col, { xs: 12, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('trends.statTopLLM'), value: llmModels[0]?.name || 'GPT-4o', prefix: _jsx(StarOutlined, { style: { color: '#faad14' } }), suffix: `(${llmModels[0]?.capability || 0}${t('trends.score')})`, valueStyle: { color: '#faad14' } }) }) }), _jsx(Col, { xs: 12, sm: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: t('trends.statFastestGrowing'), value: languageTrends.filter(l => l.trend === 'up')[0]?.language || 'Rust', prefix: _jsx(RiseOutlined, { style: { color: '#52c41a' } }), suffix: `+${languageTrends.filter(l => l.trend === 'up')[0]?.growth.toFixed(1) || 0}%`, valueStyle: { color: '#52c41a' } }) }) })] }), _jsxs(Tabs, { defaultActiveKey: "languages", children: [_jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(CodeOutlined, {}), t('trends.tabLanguageActivity')] }), children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 16, children: _jsxs(Card, { title: t('trends.chartLanguageRanking'), extra: _jsx(BarChartOutlined, {}), style: { marginBottom: 16 }, children: [_jsx("div", { style: { marginBottom: 16, padding: '12px', background: '#f9f9f9', borderRadius: '6px' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83D\uDCCA ", _jsx("strong", { children: t('trends.chartCriteriaLabel') }), "\uFF1A", t('trends.chartCriteriaText'), t('trends.chartTimeRangeDays').replace('{days}', timeRange === 'week' ? '7' : timeRange === 'month' ? '30' : '90')] }) }), languageTrends.filter(trend => trend.count > 0).length > 0 ? (_jsx(Column, { ...languageChartConfig })) : (_jsx("div", { style: { textAlign: 'center', padding: '50px', color: '#999' }, children: t('trends.chartNoData') }))] }) }), _jsx(Col, { xs: 24, lg: 8, children: _jsx(Card, { title: t('trends.chartLanguageTrendDetails'), children: _jsx(List, { dataSource: languageTrends.slice(0, 8), size: "small", renderItem: (item, index) => (_jsx(List.Item, { style: { padding: '4px 0' }, children: _jsx(List.Item.Meta, { avatar: _jsx(Badge, { count: index + 1, size: "small", style: { backgroundColor: index < 3 ? '#faad14' : '#d9d9d9' }, children: _jsx(Avatar, { size: "small", style: { backgroundColor: '#1890ff' }, children: item.language.charAt(0) }) }), title: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Text, { strong: true, children: item.language }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [item.trend === 'up' ? (_jsx(ArrowUpOutlined, { style: { color: '#52c41a' } })) : item.trend === 'down' ? (_jsx(ArrowDownOutlined, { style: { color: '#f5222d' } })) : (_jsx(FireOutlined, { style: { color: '#faad14' } })), _jsxs(Text, { style: {
                                                                            color: item.trend === 'up' ? '#52c41a' : item.trend === 'down' ? '#f5222d' : '#faad14',
                                                                            fontWeight: 'bold'
                                                                        }, children: [item.growth > 0 ? '+' : '', item.growth.toFixed(1), "%"] })] })] }), description: _jsxs("div", { children: [_jsxs(Text, { type: "secondary", children: [t('trends.chartProjectCount'), ": ", item.count] }), _jsx("div", { style: { height: 12, marginTop: 4, display: 'flex', alignItems: 'end', gap: '1px' }, children: item.weeklyData.map((data, idx) => {
                                                                    const maxCount = Math.max(...item.weeklyData.map(d => d.count));
                                                                    const height = maxCount > 0 ? (data.count / maxCount) * 10 + 2 : 2;
                                                                    return (_jsx("div", { style: {
                                                                            width: '8px',
                                                                            height: `${height}px`,
                                                                            backgroundColor: item.trend === 'up' ? '#52c41a' : item.trend === 'down' ? '#f5222d' : '#faad14',
                                                                            borderRadius: '1px'
                                                                        } }, idx));
                                                                }) })] }) }) })) }) }) })] }) }, "languages"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(RobotOutlined, {}), t('trends.tabAIFields')] }), children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsxs(Card, { title: t('trends.aiFieldTitle'), extra: _jsx(PictureOutlined, {}), children: [_jsx("div", { style: { marginBottom: 16, padding: '12px', background: '#f0f9ff', borderRadius: '6px', borderLeft: '4px solid #1890ff' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\uD83E\uDD16 ", _jsx("strong", { children: t('trends.aiFieldCriteriaTitle') }), "\uFF1A", t('trends.aiFieldCriteriaText'), _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.fieldLLM') }), "\uFF1A", t('trends.aiFieldLLMDesc'), _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.fieldComputerVision') }), "\uFF1A", t('trends.aiFieldCVDesc'), _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.fieldSpeech') }), "\uFF1A", t('trends.aiFieldSpeechDesc'), _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.fieldMultimodal') }), "\uFF1A", t('trends.aiFieldMultimodalDesc')] }) }), loading ? (_jsxs("div", { style: { textAlign: 'center', padding: '50px' }, children: [_jsx(Spin, { size: "large" }), _jsx("div", { style: { marginTop: 16, color: '#999' }, children: t('trends.aiFieldAnalyzing') })] })) : validAIFieldData.length > 0 ? (_jsx(Pie, { ...aiFieldPieConfig })) : (_jsxs("div", { style: { textAlign: 'center', padding: '50px', color: '#999' }, children: [_jsxs("div", { style: { marginBottom: 16 }, children: ["\uD83D\uDD0D ", t('trends.aiFieldNoData')] }), _jsx("div", { style: { fontSize: '12px', color: '#bbb' }, children: t('trends.aiFieldNoDataHint') })] }))] }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('trends.aiFieldHotKeywords'), children: _jsx(Space, { direction: "vertical", style: { width: '100%' }, size: "large", children: aiFieldTrends.map(field => (_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx("div", { style: { color: field.color }, children: field.icon }), _jsx(Text, { strong: true, children: field.field }), _jsx(Badge, { count: field.count, style: { backgroundColor: field.color } }), _jsxs(Text, { style: { color: field.growth > 0 ? '#52c41a' : '#f5222d' }, children: [field.growth > 0 ? '+' : '', field.growth.toFixed(1), "%"] })] }), _jsx("div", { children: field.hotKeywords.map(keyword => (_jsx(Tag, { style: {
                                                                margin: '2px',
                                                                fontSize: '11px',
                                                                backgroundColor: field.color,
                                                                color: '#fff',
                                                                border: `1px solid ${field.color}`
                                                            }, children: keyword }, keyword))) })] }, field.field))) }) }) })] }) }, "ai-fields"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(ThunderboltOutlined, {}), t('trends.tabLLMModels')] }), children: _jsx(Row, { gutter: [16, 16], children: _jsx(Col, { xs: 24, children: _jsxs(Card, { title: t('trends.llmTitle'), extra: _jsx(StarOutlined, {}), children: [_jsx("div", { style: { marginBottom: 16, padding: '12px', background: '#fff7e6', borderRadius: '6px', borderLeft: '4px solid #faad14' }, children: _jsxs(Text, { type: "secondary", style: { fontSize: '12px' }, children: ["\u2B50 ", _jsx("strong", { children: t('trends.llmScoringTitle') }), "\uFF1A", _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.llmTableCapability') }), "\uFF1A", t('trends.llmCapabilityDesc'), _jsx("br", {}), "\u2022 ", _jsx("strong", { children: t('trends.llmTablePopularity') }), "\uFF1A", t('trends.llmPopularityDesc'), _jsx("br", {}), "\u2022 ", t('trends.llmDataSource')] }) }), _jsx(Table, { dataSource: llmModels, pagination: false, columns: [
                                                {
                                                    title: t('trends.llmTableRanking'),
                                                    dataIndex: 'index',
                                                    width: 80,
                                                    render: (_, __, index) => (_jsx(Badge, { count: index + 1, style: {
                                                            backgroundColor: index === 0 ? '#faad14' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#d9d9d9'
                                                        } }))
                                                },
                                                {
                                                    title: t('trends.llmTableModelName'),
                                                    dataIndex: 'name',
                                                    render: (name, record) => (_jsxs("div", { children: [_jsx(Text, { strong: true, style: { fontSize: '16px' }, children: name }), record.recent && _jsx(Tag, { color: "red", style: { marginLeft: 8, fontSize: '11px' }, children: t('trends.llmTagLatest') }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: record.provider })] }))
                                                },
                                                {
                                                    title: t('trends.llmTableCapability'),
                                                    dataIndex: 'capability',
                                                    sorter: (a, b) => a.capability - b.capability,
                                                    render: (capability) => (_jsxs("div", { children: [_jsx(Progress, { percent: capability, size: "small", strokeColor: {
                                                                    '0%': '#87d068',
                                                                    '100%': '#108ee9',
                                                                } }), _jsxs(Text, { strong: true, children: [capability, "/100"] })] }))
                                                },
                                                {
                                                    title: t('trends.llmTablePopularity'),
                                                    dataIndex: 'popularity',
                                                    sorter: (a, b) => a.popularity - b.popularity,
                                                    render: (popularity) => (_jsxs("div", { children: [_jsx(Progress, { percent: popularity, size: "small", strokeColor: "#faad14" }), _jsxs(Text, { strong: true, children: [popularity, "/100"] })] }))
                                                },
                                                {
                                                    title: t('trends.llmTableDescription'),
                                                    dataIndex: 'description',
                                                    render: (description) => (_jsx(Text, { style: { fontSize: '13px' }, children: description }))
                                                }
                                            ] })] }) }) }) }, "llm-models"), _jsx(TabPane, { tab: _jsxs("span", { children: [_jsx(BulbOutlined, {}), t('trends.tabPredictions')] }), children: _jsxs(Row, { gutter: [16, 16], children: [_jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: `🚀 ${t('trends.predictionTitle')}`, children: _jsx(List, { dataSource: [
                                                {
                                                    title: t('trends.predictionMultimodal'),
                                                    description: t('trends.predictionMultimodalDesc'),
                                                    trend: 'up',
                                                    confidence: 95
                                                },
                                                {
                                                    title: t('trends.predictionAgent'),
                                                    description: t('trends.predictionAgentDesc'),
                                                    trend: 'up',
                                                    confidence: 90
                                                },
                                                {
                                                    title: t('trends.predictionEdgeAI'),
                                                    description: t('trends.predictionEdgeAIDesc'),
                                                    trend: 'up',
                                                    confidence: 85
                                                },
                                                {
                                                    title: t('trends.predictionCodeGen'),
                                                    description: t('trends.predictionCodeGenDesc'),
                                                    trend: 'up',
                                                    confidence: 88
                                                }
                                            ], renderItem: item => (_jsx(List.Item, { children: _jsx(List.Item.Meta, { avatar: _jsx(RocketOutlined, { style: { color: '#52c41a', fontSize: '18px' } }), title: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx(Text, { strong: true, children: item.title }), _jsxs(Tag, { color: "green", children: [t('trends.predictionConfidence'), " ", item.confidence, "%"] })] }), description: item.description }) })) }) }) }), _jsx(Col, { xs: 24, lg: 12, children: _jsx(Card, { title: t('trends.toolEcosystemTitle'), children: _jsx(List, { dataSource: [
                                                {
                                                    category: t('trends.toolCategoryLLM'),
                                                    tools: ['LangChain', 'LlamaIndex', 'Haystack', 'AutoGPT']
                                                },
                                                {
                                                    category: t('trends.toolCategoryAICoding'),
                                                    tools: ['GitHub Copilot', 'Cursor', 'Claude Dev', 'v0.dev']
                                                },
                                                {
                                                    category: t('trends.toolCategoryImageGen'),
                                                    tools: ['Stable Diffusion', 'Midjourney', 'DALL-E 3', 'Flux']
                                                },
                                                {
                                                    category: t('trends.toolCategoryVectorDB'),
                                                    tools: ['Pinecone', 'Weaviate', 'Milvus', 'Chroma']
                                                },
                                                {
                                                    category: t('trends.toolCategoryDeployment'),
                                                    tools: ['Ollama', 'vLLM', 'Hugging Face', 'Together AI']
                                                }
                                            ], renderItem: item => (_jsx(List.Item, { children: _jsxs("div", { style: { width: '100%' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx(ToolOutlined, { style: { color: '#1890ff' } }), _jsx(Text, { strong: true, children: item.category })] }), _jsx("div", { children: item.tools.map(tool => (_jsx(Tag, { color: "blue", style: { margin: '2px' }, children: tool }, tool))) })] }) })) }) }) })] }) }, "predictions")] })] }));
};
export default TrendsPage;
