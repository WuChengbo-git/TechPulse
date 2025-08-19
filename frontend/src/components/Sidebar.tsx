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
  TagsOutlined,
  SettingOutlined,
  ApiOutlined,
  CloudOutlined,
  UnorderedListOutlined,
  MonitorOutlined,
  FireOutlined,
  BarChartOutlined
} from '@ant-design/icons'

const { Sider } = Layout
const { Text } = Typography

interface SidebarProps {
  collapsed: boolean
  selectedKey: string
  onMenuSelect: (key: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, selectedKey, onMenuSelect }) => {
  const menuItems: MenuProps['items'] = [
    {
      key: 'overview',
      icon: <DashboardOutlined />,
      label: '首页仪表盘',
      children: [
        { key: 'dashboard', icon: <BarChartOutlined />, label: '数据概览' },
        { key: 'trending', icon: <FireOutlined />, label: '今日热门' }
      ]
    },
    {
      key: 'sources',
      icon: <ApiOutlined />,
      label: '数据源管理',
      children: [
        { key: 'github', icon: <GithubOutlined />, label: 'GitHub' },
        { key: 'arxiv', icon: <FileTextOutlined />, label: 'arXiv' },
        { key: 'huggingface', icon: <RobotOutlined />, label: 'Hugging Face' },
        { key: 'zenn', icon: <EditOutlined />, label: 'Zenn' }
      ]
    },
    {
      key: 'analysis',
      icon: <SearchOutlined />,
      label: '智能分析',
      children: [
        { key: 'search', icon: <SearchOutlined />, label: '智能搜索' },
        { key: 'trends', icon: <LineChartOutlined />, label: '趋势分析' },
        { key: 'tags', icon: <TagsOutlined />, label: '标签云' }
      ]
    },
    {
      key: 'system',
      icon: <SettingOutlined />,
      label: '系统管理',
      children: [
        { key: 'notion', icon: <CloudOutlined />, label: 'Notion 集成' },
        { key: 'api-config', icon: <ApiOutlined />, label: 'API 配置' },
        { key: 'tasks', icon: <UnorderedListOutlined />, label: '任务管理' },
        { key: 'status', icon: <MonitorOutlined />, label: '系统状态' }
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
      {/* Logo区域 */}
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

      {/* 菜单 */}
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