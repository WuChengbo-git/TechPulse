import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, Switch, Typography, Popconfirm, message, Row, Col, Statistic, Progress } from 'antd';
import { UnorderedListOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import dayjs from 'dayjs';
const { Title, Text } = Typography;
const { Option } = Select;
const TaskManagementPage = () => {
    const { t } = useLanguage();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form] = Form.useForm();
    // Mock data - 実際はAPIから取得
    useEffect(() => {
        loadTasks();
    }, []);
    const loadTasks = async () => {
        setLoading(true);
        // TODO: API呼び出し
        setTimeout(() => {
            setTasks([
                {
                    id: 1,
                    name: 'GitHub Trending Daily Sync',
                    type: 'github',
                    status: 'completed',
                    schedule: 'daily',
                    next_run: '2025-10-08 09:00:00',
                    last_run: '2025-10-07 09:00:00',
                    success_count: 145,
                    failure_count: 2,
                    enabled: true,
                    created_at: '2025-09-01 10:00:00'
                },
                {
                    id: 2,
                    name: 'arXiv Papers Collection',
                    type: 'arxiv',
                    status: 'running',
                    schedule: 'daily',
                    next_run: '2025-10-08 10:00:00',
                    last_run: '2025-10-07 10:00:00',
                    success_count: 132,
                    failure_count: 5,
                    enabled: true,
                    created_at: '2025-09-01 10:00:00'
                },
                {
                    id: 3,
                    name: 'Hugging Face Models Sync',
                    type: 'huggingface',
                    status: 'pending',
                    schedule: 'weekly',
                    next_run: '2025-10-14 08:00:00',
                    last_run: '2025-10-07 08:00:00',
                    success_count: 20,
                    failure_count: 1,
                    enabled: true,
                    created_at: '2025-09-05 10:00:00'
                },
                {
                    id: 4,
                    name: 'Zenn Articles Hourly Update',
                    type: 'zenn',
                    status: 'paused',
                    schedule: 'hourly',
                    next_run: '-',
                    last_run: '2025-10-07 14:00:00',
                    success_count: 890,
                    failure_count: 12,
                    enabled: false,
                    created_at: '2025-09-01 10:00:00'
                },
                {
                    id: 5,
                    name: 'Full Data Source Sync',
                    type: 'all',
                    status: 'failed',
                    schedule: 'daily',
                    next_run: '2025-10-08 02:00:00',
                    last_run: '2025-10-07 02:00:00',
                    success_count: 35,
                    failure_count: 1,
                    enabled: true,
                    created_at: '2025-09-10 10:00:00'
                }
            ]);
            setLoading(false);
        }, 500);
    };
    const getStatusTag = (status) => {
        const statusConfig = {
            pending: { color: 'default', icon: _jsx(ClockCircleOutlined, {}), text: '待機中' },
            running: { color: 'processing', icon: _jsx(SyncOutlined, { spin: true }), text: '実行中' },
            completed: { color: 'success', icon: _jsx(CheckCircleOutlined, {}), text: '完了' },
            failed: { color: 'error', icon: _jsx(CloseCircleOutlined, {}), text: '失敗' },
            paused: { color: 'warning', icon: _jsx(PauseCircleOutlined, {}), text: '一時停止' }
        };
        const config = statusConfig[status];
        return _jsx(Tag, { icon: config.icon, color: config.color, children: config.text });
    };
    const getTypeTag = (type) => {
        const typeConfig = {
            github: { color: 'blue', text: 'GitHub' },
            arxiv: { color: 'orange', text: 'arXiv' },
            huggingface: { color: 'purple', text: 'Hugging Face' },
            zenn: { color: 'cyan', text: 'Zenn' },
            all: { color: 'green', text: '全データ源' }
        };
        const config = typeConfig[type];
        return _jsx(Tag, { color: config.color, children: config.text });
    };
    const handleRunTask = async (taskId) => {
        message.loading({ content: 'タスクを実行中...', key: 'run' });
        // TODO: API呼び出し
        setTimeout(() => {
            message.success({ content: 'タスクを開始しました', key: 'run' });
            loadTasks();
        }, 1000);
    };
    const handlePauseTask = async (taskId) => {
        // TODO: API呼び出し
        message.success('タスクを一時停止しました');
        loadTasks();
    };
    const handleDeleteTask = async (taskId) => {
        // TODO: API呼び出し
        message.success('タスクを削除しました');
        loadTasks();
    };
    const handleToggleTask = async (taskId, enabled) => {
        // TODO: API呼び出し
        message.success(enabled ? 'タスクを有効化しました' : 'タスクを無効化しました');
        loadTasks();
    };
    const handleCreateTask = () => {
        form.resetFields();
        setEditingTask(null);
        setModalVisible(true);
    };
    const handleEditTask = (task) => {
        form.setFieldsValue({
            ...task,
            next_run: dayjs(task.next_run)
        });
        setEditingTask(task);
        setModalVisible(true);
    };
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            // TODO: API呼び出し
            message.success(editingTask ? 'タスクを更新しました' : 'タスクを作成しました');
            setModalVisible(false);
            loadTasks();
        }
        catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const columns = [
        {
            title: 'タスク名',
            dataIndex: 'name',
            key: 'name',
            width: 250,
            render: (name, record) => (_jsxs(Space, { direction: "vertical", size: 0, children: [_jsx(Text, { strong: true, children: name }), _jsxs(Text, { type: "secondary", style: { fontSize: 12 }, children: ["ID: ", record.id] })] }))
        },
        {
            title: 'データソース',
            dataIndex: 'type',
            key: 'type',
            width: 130,
            render: (type) => getTypeTag(type)
        },
        {
            title: 'ステータス',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => getStatusTag(status)
        },
        {
            title: 'スケジュール',
            dataIndex: 'schedule',
            key: 'schedule',
            width: 100,
            render: (schedule) => {
                const scheduleMap = {
                    manual: '手動',
                    hourly: '毎時',
                    daily: '毎日',
                    weekly: '毎週'
                };
                return scheduleMap[schedule] || schedule;
            }
        },
        {
            title: '次回実行',
            dataIndex: 'next_run',
            key: 'next_run',
            width: 160,
            render: (time) => (_jsx(Text, { style: { fontSize: 12 }, children: time }))
        },
        {
            title: '実行統計',
            key: 'stats',
            width: 120,
            render: (_, record) => {
                const total = record.success_count + record.failure_count;
                const successRate = total > 0 ? (record.success_count / total * 100).toFixed(1) : '0';
                return (_jsxs(Space, { direction: "vertical", size: 0, children: [_jsxs(Text, { style: { fontSize: 12 }, children: ["\u6210\u529F: ", record.success_count] }), _jsxs(Text, { style: { fontSize: 12 }, type: "secondary", children: ["\u5931\u6557: ", record.failure_count] }), _jsx(Progress, { percent: Number(successRate), size: "small", status: Number(successRate) >= 95 ? 'success' : 'normal', showInfo: false })] }));
            }
        },
        {
            title: '有効/無効',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 80,
            render: (enabled, record) => (_jsx(Switch, { checked: enabled, onChange: (checked) => handleToggleTask(record.id, checked), checkedChildren: "ON", unCheckedChildren: "OFF" }))
        },
        {
            title: '操作',
            key: 'actions',
            width: 180,
            fixed: 'right',
            render: (_, record) => (_jsxs(Space, { size: "small", children: [record.status !== 'running' && (_jsx(Button, { type: "primary", size: "small", icon: _jsx(PlayCircleOutlined, {}), onClick: () => handleRunTask(record.id), children: "\u5B9F\u884C" })), record.status === 'running' && (_jsx(Button, { size: "small", icon: _jsx(PauseCircleOutlined, {}), onClick: () => handlePauseTask(record.id), children: "\u505C\u6B62" })), _jsx(Button, { size: "small", icon: _jsx(EditOutlined, {}), onClick: () => handleEditTask(record) }), _jsx(Popconfirm, { title: "\u3053\u306E\u30BF\u30B9\u30AF\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F", onConfirm: () => handleDeleteTask(record.id), okText: "\u524A\u9664", cancelText: "\u30AD\u30E3\u30F3\u30BB\u30EB", children: _jsx(Button, { size: "small", danger: true, icon: _jsx(DeleteOutlined, {}) }) })] }))
        }
    ];
    // 統計情報の計算
    const stats = {
        total: tasks.length,
        running: tasks.filter(t => t.status === 'running').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        failed: tasks.filter(t => t.status === 'failed').length
    };
    return (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 24 }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsxs("div", { children: [_jsxs(Title, { level: 2, style: { margin: 0, display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx(UnorderedListOutlined, { style: { color: '#1890ff' } }), "\u30BF\u30B9\u30AF\u7BA1\u7406"] }), _jsx(Text, { type: "secondary", children: "\u5B9A\u671F\u5B9F\u884C\u30BF\u30B9\u30AF\u306E\u7BA1\u7406\u3068\u76E3\u8996" })] }), _jsxs(Space, { children: [_jsx(Button, { icon: _jsx(ReloadOutlined, {}), onClick: loadTasks, loading: loading, children: "\u66F4\u65B0" }), _jsx(Button, { type: "primary", icon: _jsx(PlusOutlined, {}), onClick: handleCreateTask, children: "\u65B0\u898F\u30BF\u30B9\u30AF" })] })] }) }), _jsxs(Row, { gutter: 16, style: { marginBottom: 24 }, children: [_jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u7DCF\u30BF\u30B9\u30AF\u6570", value: stats.total, prefix: _jsx(UnorderedListOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5B9F\u884C\u4E2D", value: stats.running, valueStyle: { color: '#1890ff' }, prefix: _jsx(SyncOutlined, { spin: stats.running > 0 }) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5F85\u6A5F\u4E2D", value: stats.pending, valueStyle: { color: '#52c41a' }, prefix: _jsx(ClockCircleOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "\u5931\u6557", value: stats.failed, valueStyle: { color: stats.failed > 0 ? '#ff4d4f' : undefined }, prefix: _jsx(CloseCircleOutlined, {}) }) }) })] }), _jsx(Card, { children: _jsx(Table, { columns: columns, dataSource: tasks, rowKey: "id", loading: loading, pagination: {
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `総数 ${total} 件`
                    }, scroll: { x: 1200 } }) }), _jsx(Modal, { title: editingTask ? 'タスク編集' : '新規タスク作成', open: modalVisible, onOk: handleModalOk, onCancel: () => setModalVisible(false), width: 600, children: _jsxs(Form, { form: form, layout: "vertical", initialValues: {
                        schedule: 'daily',
                        enabled: true
                    }, children: [_jsx(Form.Item, { name: "name", label: "\u30BF\u30B9\u30AF\u540D", rules: [{ required: true, message: 'タスク名を入力してください' }], children: _jsx(Input, { placeholder: "\u4F8B: GitHub Trending Daily Sync" }) }), _jsx(Form.Item, { name: "type", label: "\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9", rules: [{ required: true, message: 'データソースを選択してください' }], children: _jsxs(Select, { placeholder: "\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9\u3092\u9078\u629E", children: [_jsx(Option, { value: "github", children: "GitHub" }), _jsx(Option, { value: "arxiv", children: "arXiv" }), _jsx(Option, { value: "huggingface", children: "Hugging Face" }), _jsx(Option, { value: "zenn", children: "Zenn" }), _jsx(Option, { value: "all", children: "\u5168\u30C7\u30FC\u30BF\u30BD\u30FC\u30B9" })] }) }), _jsx(Form.Item, { name: "schedule", label: "\u5B9F\u884C\u983B\u5EA6", rules: [{ required: true }], children: _jsxs(Select, { children: [_jsx(Option, { value: "manual", children: "\u624B\u52D5\u5B9F\u884C\u306E\u307F" }), _jsx(Option, { value: "hourly", children: "\u6BCE\u6642" }), _jsx(Option, { value: "daily", children: "\u6BCE\u65E5" }), _jsx(Option, { value: "weekly", children: "\u6BCE\u9031" })] }) }), _jsx(Form.Item, { name: "next_run", label: "\u6B21\u56DE\u5B9F\u884C\u6642\u523B", children: _jsx(DatePicker, { showTime: true, format: "YYYY-MM-DD HH:mm:ss", style: { width: '100%' } }) }), _jsx(Form.Item, { name: "enabled", label: "\u6709\u52B9\u5316", valuePropName: "checked", children: _jsx(Switch, { checkedChildren: "\u6709\u52B9", unCheckedChildren: "\u7121\u52B9" }) })] }) })] }));
};
export default TaskManagementPage;
