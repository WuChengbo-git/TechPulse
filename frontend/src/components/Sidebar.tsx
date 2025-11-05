import React from 'react'
import { Layout, Menu, Avatar, Typography } from 'antd'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  GithubOutlined,
  FileTextOutlined,
  RobotOutlined,
  EditOutlined,
  SearchOutlined,
  LineChartOutlined,
  SettingOutlined,
  ApiOutlined,
  CloudOutlined,
  UnorderedListOutlined,
  MonitorOutlined,
  FireOutlined,
  BarChartOutlined,
  MessageOutlined,
  DashboardOutlined as AnalyticsOutlined,
  StarOutlined,
  CompassOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { useLanguage } from '../contexts/LanguageContext'

const { Sider } = Layout
const { Text } = Typography

interface SidebarProps {
  collapsed: boolean
  selectedKey: string
  onMenuSelect: (key: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, selectedKey, onMenuSelect }) => {
  const { t } = useLanguage()
  
  const menuItems: MenuProps['items'] = [
    // New v0.4.0 main navigation
    {
      key: 'discover',
      icon: <FireOutlined />,
      label: t('discover.title') || '🎯 今日精选'
    },
    {
      key: 'explore',
      icon: <CompassOutlined />,
      label: t('explore.title') || '🔍 数据探索'
    },
    {
      key: 'collections',
      icon: <StarOutlined />,
      label: t('collections.title') || '我的收藏'
    },
    {
      key: 'trending',
      icon: <LineChartOutlined />,
      label: t('nav.trending')
    },

    // Divider
    { type: 'divider' },

    // AI Assistant
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: t('nav.aiAssistant')
    },

    // Legacy pages (folded under submenus)
    {
      key: 'legacy',
      icon: <DashboardOutlined />,
      label: '传统视图',
      children: [
        { key: 'dashboard', icon: <BarChartOutlined />, label: t('nav.dashboard') },
        { key: 'github', icon: <GithubOutlined />, label: t('nav.github') },
        { key: 'arxiv', icon: <FileTextOutlined />, label: t('nav.arxiv') },
        { key: 'huggingface', icon: <RobotOutlined />, label: t('nav.huggingface') },
        { key: 'zenn', icon: <EditOutlined />, label: t('nav.zenn') },
        { key: 'analytics', icon: <AnalyticsOutlined />, label: t('nav.dataAnalysis') },
        { key: 'trends', icon: <LineChartOutlined />, label: t('nav.trendAnalysis') }
      ]
    },

    // Divider
    { type: 'divider' },

    // System management
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: t('sidebar.systemManagement'),
      children: [
        { key: 'settings', icon: <SettingOutlined />, label: t('nav.systemSettings') },
        { key: 'llm-providers', icon: <CloudOutlined />, label: 'LLM模型管理' },
        { key: 'api-config', icon: <ApiOutlined />, label: t('nav.apiConfig') },
        { key: 'tasks', icon: <UnorderedListOutlined />, label: t('nav.taskManagement') },
        { key: 'status', icon: <MonitorOutlined />, label: t('nav.systemStatus') }
      ]
    }
  ]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      theme="light"
      width={220}
      style={{
        boxShadow: '2px 0 8px 0 rgba(29, 35, 41, 0.05)',
        borderRight: '1px solid #f0f0f0'
      }}
    >
      {/* ロゴエリア */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 24px',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        {collapsed ? (
          <Avatar style={{ backgroundColor: '#1890ff' }} size="small">
            T
          </Avatar>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar style={{ backgroundColor: '#1890ff' }} size="small">
              T
            </Avatar>
            <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
              TechPulse
            </Text>
          </div>
        )}
      </div>

      {/* メニュー */}
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        style={{ borderRight: 0, paddingTop: 8 }}
        items={menuItems}
        onClick={({ key }) => onMenuSelect(key)}
      />
    </Sider>
  )
}

export default Sidebar