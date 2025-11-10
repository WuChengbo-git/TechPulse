import React from 'react'
import { Layout, Menu, Typography } from 'antd'
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
      label: t('discover.title') || '今日精选'
    },
    {
      key: 'explore',
      icon: <CompassOutlined />,
      label: t('explore.title') || '数据探索'
    },
    {
      key: 'collections',
      icon: <StarOutlined />,
      label: t('collections.title') || '我的收藏'
    },
    {
      key: 'trending',
      icon: <LineChartOutlined />,
      label: t('nav.trendAnalysis')
    },

    // Divider
    { type: 'divider' },

    // AI Assistant
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: t('nav.aiAssistant')
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
          <svg width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="techGradientCollapsed" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1890ff" />
                <stop offset="50%" stopColor="#52c41a" />
                <stop offset="100%" stopColor="#722ed1" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" stroke="url(#techGradientCollapsed)" strokeWidth="4" fill="none" strokeDasharray="10 5" />
            <path d="M 70 60 L 130 60 L 130 70 L 105 70 L 105 140 L 95 140 L 95 70 L 70 70 Z" fill="url(#techGradientCollapsed)" />
          </svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="32" height="32" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="techGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1890ff" />
                  <stop offset="50%" stopColor="#52c41a" />
                  <stop offset="100%" stopColor="#722ed1" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="90" stroke="url(#techGradient)" strokeWidth="4" fill="none" strokeDasharray="10 5" />
              <path d="M 70 60 L 130 60 L 130 70 L 105 70 L 105 140 L 95 140 L 95 70 L 70 70 Z" fill="url(#techGradient)" />
            </svg>
            <Text strong style={{
              fontSize: 16,
              background: 'linear-gradient(90deg, #1890ff, #52c41a, #722ed1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
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