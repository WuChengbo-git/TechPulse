import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Space, Typography, Button, Badge, Timeline, Alert } from 'antd';
import { MonitorOutlined, DatabaseOutlined, ApiOutlined, CloudServerOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { Line } from '@ant-design/charts';
const { Title, Text } = Typography;
const SystemStatusPage = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [systemHealth, setSystemHealth] = useState({
        cpu: 45,
        memory: 62,
        disk: 38,
        network: 23
    });
    const [services, setServices] = useState([
        {
            name: 'Backend API',
            status: 'healthy',
            response_time: 45,
            last_check: '2025-10-07 15:30:25',
            uptime: 99.9
        },
        {
            name: 'Database',
            status: 'healthy',
            response_time: 12,
            last_check: '2025-10-07 15:30:25',
            uptime: 99.8
        },
        {
            name: 'GitHub API',
            status: 'healthy',
            response_time: 234,
            last_check: '2025-10-07 15:29:15',
            uptime: 98.5
        },
        {
            name: 'arXiv API',
            status: 'warning',
            response_time: 1523,
            last_check: '2025-10-07 15:28:45',
            uptime: 95.2
        },
        {
            name: 'Hugging Face API',
            status: 'healthy',
            response_time: 456,
            last_check: '2025-10-07 15:30:10',
            uptime: 97.8
        },
        {
            name: 'OpenAI API',
            status: 'healthy',
            response_time: 678,
            last_check: '2025-10-07 15:29:55',
            uptime: 99.2
        }
    ]);
    const [apiUsage, setApiUsage] = useState([
        {
            api: 'GitHub API',
            requests_today: 3420,
            limit: 5000,
            last_used: '2025-10-07 15:25:30'
        },
        {
            api: 'OpenAI API',
            requests_today: 856,
            limit: 10000,
            last_used: '2025-10-07 15:28:12'
        },
        {
            api: 'Hugging Face API',
            requests_today: 234,
            limit: 1000,
            last_used: '2025-10-07 15:12:45'
        },
        {
            api: 'arXiv API',
            requests_today: 145,
            limit: 1000,
            last_used: '2025-10-07 14:55:20'
        }
    ]);
    // リソース使用履歴データ（過去24時間）
    const resourceHistory = [
        { time: '00:00', cpu: 35, memory: 55, network: 15 },
        { time: '04:00', cpu: 28, memory: 52, network: 12 },
        { time: '08:00', cpu: 42, memory: 58, network: 25 },
        { time: '12:00', cpu: 55, memory: 65, network: 35 },
        { time: '16:00', cpu: 45, memory: 62, network: 23 },
        { time: '20:00', cpu: 38, memory: 60, network: 18 }
    ];
    const refreshStatus = async () => {
        setLoading(true);
        // TODO: 実際のAPIから取得
        setTimeout(() => {
            setLoading(false);
        }, 1000);
    };
    const getStatusBadge = (status) => {
        const statusConfig = {
            healthy: { status: 'success', icon: _jsx(CheckCircleOutlined, {}), text: '正常' },
            warning: { status: 'warning', icon: _jsx(WarningOutlined, {}), text: '警告' },
            error: { status: 'error', icon: _jsx(CloseCircleOutlined, {}), text: 'エラー' }
        };
        const config = statusConfig[status];
        return _jsx(Badge, { status: config.status, text: config.text });
    };
    const serviceColumns = [
        {
            title: 'サービス名',
            dataIndex: 'name',
            key: 'name',
            render: (name) => _jsx(Text, { strong: true, children: name })
        },
        {
            title: 'ステータス',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusBadge(status)
        },
        {
            title: '応答時間',
            dataIndex: 'response_time',
            key: 'response_time',
            render: (time) => {
                const color = time < 100 ? '#52c41a' : time < 500 ? '#faad14' : '#ff4d4f';
                return _jsxs(Text, { style: { color }, children: [time, "ms"] });
            }
        },
        {
            title: '稼働率',
            dataIndex: 'uptime',
            key: 'uptime',
            render: (uptime) => {
                const status = uptime >= 99 ? 'success' : uptime >= 95 ? 'normal' : 'exception';
                return (_jsx(Space, { children: _jsx(Progress, { type: "circle", percent: uptime, width: 50, status: status, format: (percent) => `${percent}%` }) }));
            }
        },
        {
            title: '最終確認',
            dataIndex: 'last_check',
            key: 'last_check',
            render: (time) => _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: time })
        }
    ];
    const apiColumns = [
        {
            title: 'API名',
            dataIndex: 'api',
            key: 'api',
            render: (name) => _jsx(Text, { strong: true, children: name })
        },
        {
            title: '今日の使用量',
            dataIndex: 'requests_today',
            key: 'requests_today',
            render: (requests, record) => {
                const percentage = (requests / record.limit) * 100;
                const status = percentage >= 90 ? 'exception' : percentage >= 70 ? 'normal' : 'success';
                return (_jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsxs(Text, { children: [requests.toLocaleString(), " / ", record.limit.toLocaleString()] }), _jsx(Progress, { percent: Number(percentage.toFixed(1)), status: status })] }));
            }
        },
        {
            title: '最終使用',
            dataIndex: 'last_used',
            key: 'last_used',
            render: (time) => _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: time })
        }
    ];
    // リソース使用率チャート設定
    const lineConfig = {
        data: resourceHistory.flatMap(item => [
            { time: item.time, value: item.cpu, category: 'CPU' },
            { time: item.time, value: item.memory, category: 'メモリ' },
            { time: item.time, value: item.network, category: 'ネットワーク' }
        ]),
        xField: 'time',
        yField: 'value',
        seriesField: 'category',
        smooth: true,
        animation: {
            appear: {
                animation: 'path-in',
                duration: 1000
            }
        },
        yAxis: {
            label: {
                formatter: (v) => `${v}%`
            }
        }
    };
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(MonitorOutlined, { style: { color: '#1890ff' } }), "\u30B7\u30B9\u30C6\u30E0\u30B9\u30C6\u30FC\u30BF\u30B9"] }), _jsx(Text, { type: "secondary", children: "\u30B7\u30B9\u30C6\u30E0\u306E\u5065\u5168\u6027\u3068\u30EA\u30BD\u30FC\u30B9\u4F7F\u7528\u72B6\u6CC1" })] }), _jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: refreshStatus, loading: loading, children: "\u66F4\u65B0" })] }) }), _jsx(Alert, { message: "\u30B7\u30B9\u30C6\u30E0\u306F\u6B63\u5E38\u306B\u7A3C\u50CD\u4E2D", description: "\u3059\u3079\u3066\u306E\u30B3\u30A2\u30B5\u30FC\u30D3\u30B9\u304C\u6B63\u5E38\u306B\u52D5\u4F5C\u3057\u3066\u3044\u307E\u3059\u3002\u4E00\u90E8\u306E\u5916\u90E8API\u3067\u8EFD\u5FAE\u306A\u9045\u5EF6\u304C\u691C\u51FA\u3055\u308C\u3066\u3044\u307E\u3059\u3002", type: "success", showIcon: true, icon: _jsx(CheckCircleOutlined, {}), style: { marginBottom: 24 } }), _jsxs(Row, { gutter: 16, style: { marginBottom: 24 }, children: [_jsx(Col, { span: 6, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "CPU\u4F7F\u7528\u7387", value: systemHealth.cpu, suffix: "%", prefix: _jsx(LineChartOutlined, {}), valueStyle: { color: systemHealth.cpu > 80 ? '#ff4d4f' : '#3f8600' } }), _jsx(Progress, { percent: systemHealth.cpu, status: systemHealth.cpu > 80 ? 'exception' : 'normal', showInfo: false })] }) }), _jsx(Col, { span: 6, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "\u30E1\u30E2\u30EA\u4F7F\u7528\u7387", value: systemHealth.memory, suffix: "%", prefix: _jsx(DatabaseOutlined, {}), valueStyle: { color: systemHealth.memory > 80 ? '#ff4d4f' : '#3f8600' } }), _jsx(Progress, { percent: systemHealth.memory, status: systemHealth.memory > 80 ? 'exception' : 'normal', showInfo: false })] }) }), _jsx(Col, { span: 6, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "\u30C7\u30A3\u30B9\u30AF\u4F7F\u7528\u7387", value: systemHealth.disk, suffix: "%", prefix: _jsx(CloudServerOutlined, {}), valueStyle: { color: systemHealth.disk > 80 ? '#ff4d4f' : '#3f8600' } }), _jsx(Progress, { percent: systemHealth.disk, status: systemHealth.disk > 80 ? 'exception' : 'normal', showInfo: false })] }) }), _jsx(Col, { span: 6, children: _jsxs(Card, { children: [_jsx(Statistic, { title: "\u30CD\u30C3\u30C8\u30EF\u30FC\u30AF\u4F7F\u7528\u7387", value: systemHealth.network, suffix: "%", prefix: _jsx(ApiOutlined, {}), valueStyle: { color: '#3f8600' } }), _jsx(Progress, { percent: systemHealth.network, status: "normal", showInfo: false })] }) })] }), _jsx(Card, { title: "\u30EA\u30BD\u30FC\u30B9\u4F7F\u7528\u5C65\u6B74\uFF08\u904E\u53BB24\u6642\u9593\uFF09", style: { marginBottom: 24 }, children: _jsx(Line, { ...lineConfig, height: 300 }) }), _jsx(Card, { title: "\u30B5\u30FC\u30D3\u30B9\u30B9\u30C6\u30FC\u30BF\u30B9", style: { marginBottom: 24 }, children: _jsx(Table, { columns: serviceColumns, dataSource: services, rowKey: "name", pagination: false }) }), _jsx(Card, { title: "API\u4F7F\u7528\u72B6\u6CC1", style: { marginBottom: 24 }, children: _jsx(Table, { columns: apiColumns, dataSource: apiUsage, rowKey: "api", pagination: false }) }), _jsx(Card, { title: "\u6700\u8FD1\u306E\u30B7\u30B9\u30C6\u30E0\u30A4\u30D9\u30F3\u30C8", children: _jsx(Timeline, { items: [
                        {
                            color: 'green',
                            children: (_jsxs(_Fragment, { children: [_jsx(Text, { strong: true, children: "\u30B7\u30B9\u30C6\u30E0\u8D77\u52D5" }), _jsx("br", {}), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "2025-10-07 09:00:00" }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: "\u3059\u3079\u3066\u306E\u30B5\u30FC\u30D3\u30B9\u304C\u6B63\u5E38\u306B\u8D77\u52D5\u3057\u307E\u3057\u305F" })] }))
                        },
                        {
                            color: 'blue',
                            children: (_jsxs(_Fragment, { children: [_jsx(Text, { strong: true, children: "\u30C7\u30FC\u30BF\u53CE\u96C6\u5B8C\u4E86" }), _jsx("br", {}), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "2025-10-07 10:00:00" }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: "GitHub Trending: 50\u4EF6\u3001arXiv: 120\u4EF6\u3092\u53CE\u96C6" })] }))
                        },
                        {
                            color: 'orange',
                            children: (_jsxs(_Fragment, { children: [_jsx(Text, { strong: true, children: "API\u5FDC\u7B54\u9045\u5EF6\u691C\u51FA" }), _jsx("br", {}), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "2025-10-07 14:25:00" }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: "arXiv API\u306E\u5FDC\u7B54\u6642\u9593\u304C\u901A\u5E38\u3088\u308A\u9045\u5EF6\u3057\u3066\u3044\u307E\u3059\uFF081523ms\uFF09" })] }))
                        },
                        {
                            color: 'green',
                            children: (_jsxs(_Fragment, { children: [_jsx(Text, { strong: true, children: "\u81EA\u52D5\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u5B8C\u4E86" }), _jsx("br", {}), _jsx(Text, { type: "secondary", style: { fontSize: 12 }, children: "2025-10-07 15:00:00" }), _jsx("br", {}), _jsx(Text, { type: "secondary", children: "\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306E\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u304C\u6B63\u5E38\u306B\u5B8C\u4E86\u3057\u307E\u3057\u305F" })] }))
                        }
                    ] }) })] }));
};
export default SystemStatusPage;
