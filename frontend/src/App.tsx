import { useState } from 'react'
import { ConfigProvider, Layout, Button, Breadcrumb, Typography, Space, Avatar } from 'antd'
import { BrowserRouter as Router } from 'react-router-dom'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined } from '@ant-design/icons'
import Sidebar from './components/Sidebar'
import VersionInfo from './components/VersionInfo'
import Dashboard from './pages/Dashboard'
import Overview from './pages/Overview'
import DataSources from './pages/DataSources'
import Chat from './pages/Chat'
import Analytics from './pages/Analytics'
import './App.css'

const { Header, Content, Footer } = Layout
const { Text } = Typography

function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('dashboard')

  const getBreadcrumbItems = () => {
    const breadcrumbMap: Record<string, string[]> = {
      dashboard: ['首页', '数据概览'],
      trending: ['首页', '今日热门'],
      github: ['数据源', 'GitHub'],
      arxiv: ['数据源', 'arXiv'],
      huggingface: ['数据源', 'Hugging Face'],
      zenn: ['数据源', 'Zenn'],
      analytics: ['智能分析', '数据分析'],
      chat: ['智能分析', 'AI 智能助手'],
      search: ['智能分析', '智能搜索'],
      trends: ['智能分析', '趋势分析'],
      tags: ['智能分析', '标签云'],
      notion: ['系统管理', 'Notion 集成'],
      'api-config': ['系统管理', 'API 配置'],
      tasks: ['系统管理', '任务管理'],
      status: ['系统管理', '系统状态']
    }
    
    const items = breadcrumbMap[selectedKey] || ['首页']
    return items.map(item => ({ title: item }))
  }

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <Overview />
      case 'trending':
        return <Dashboard />
      case 'analytics':
        return <Analytics />
      case 'chat':
        return <Chat />
      case 'github':
      case 'arxiv':
      case 'huggingface':
      case 'zenn':
        return <DataSources />
      default:
        return <Overview />
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar 
            collapsed={collapsed}
            selectedKey={selectedKey}
            onMenuSelect={setSelectedKey}
          />
          
          <Layout>
            <Header style={{ 
              padding: '0 24px', 
              background: '#fff', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #f0f0f0',
              boxShadow: '0 1px 4px rgba(0,21,41,.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{ fontSize: '16px' }}
                />
                <Breadcrumb items={getBreadcrumbItems()} />
              </div>
              
              <Space>
                <Button type="text" icon={<BellOutlined />} />
                <Button type="text" icon={<SettingOutlined />} />
                <Avatar style={{ backgroundColor: '#1890ff' }}>A</Avatar>
              </Space>
            </Header>
            
            <Content style={{ 
              margin: '24px', 
              padding: '24px',
              background: '#fff',
              borderRadius: '8px',
              minHeight: 'calc(100vh - 164px)',
              overflow: 'auto'
            }}>
              {renderContent()}
            </Content>
            
            <Footer style={{ 
              textAlign: 'center', 
              background: '#f0f2f5',
              padding: '12px 24px',
              fontSize: '12px',
              color: '#999'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space split={<Text type="secondary">|</Text>}>
                  <Text type="secondary">TechPulse ©2025</Text>
                  <Text type="secondary">技术情报仪表盘</Text>
                  <Text type="secondary">实时掌握技术动态</Text>
                </Space>
                <VersionInfo />
              </div>
            </Footer>
          </Layout>
        </Layout>
      </Router>
    </ConfigProvider>
  )
}

export default App