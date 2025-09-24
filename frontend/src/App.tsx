import { useState } from 'react'
import { ConfigProvider, Layout, Button, Breadcrumb, Typography, Space, Avatar } from 'antd'
import { BrowserRouter as Router } from 'react-router-dom'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined } from '@ant-design/icons'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import Sidebar from './components/Sidebar'
import VersionInfo from './components/VersionInfo'
import Dashboard from './pages/Dashboard'
import Overview from './pages/Overview'
import GitHubPage from './pages/GitHubPage'
import ArxivPage from './pages/ArxivPage'
import HuggingFacePage from './pages/HuggingFacePage'
import ZennPage from './pages/ZennPage'
import Chat from './pages/Chat'
import Analytics from './pages/Analytics'
import TrendsPage from './pages/TrendsPage'
import ApiConfigPage from './pages/ApiConfigPage'
import './App.css'

const { Header, Content, Footer } = Layout
const { Text } = Typography

function AppContent() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('dashboard')
  const { t } = useLanguage()

  const getBreadcrumbItems = () => {
    const breadcrumbMap: Record<string, string[]> = {
      dashboard: [t('nav.home'), t('nav.dashboard')],
      trending: [t('nav.home'), t('nav.trending')],
      github: [t('nav.dataSources'), t('nav.github')],
      arxiv: [t('nav.dataSources'), t('nav.arxiv')],
      huggingface: [t('nav.dataSources'), t('nav.huggingface')],
      zenn: [t('nav.dataSources'), t('nav.zenn')],
      analytics: [t('nav.analytics'), t('nav.dataAnalysis')],
      trends: [t('nav.analytics'), t('nav.trendAnalysis')],
      chat: [t('nav.analytics'), t('nav.aiAssistant')],
      notion: [t('nav.systemManagement'), t('nav.notionIntegration')],
      'api-config': [t('nav.systemManagement'), t('nav.apiConfig')],
      tasks: [t('nav.systemManagement'), t('nav.taskManagement')],
      status: [t('nav.systemManagement'), t('nav.systemStatus')]
    }
    
    const items = breadcrumbMap[selectedKey] || [t('nav.home')]
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
      case 'trends':
        return <TrendsPage />
      case 'chat':
        return <Chat />
      case 'github':
        return <GitHubPage />
      case 'arxiv':
        return <ArxivPage />
      case 'huggingface':
        return <HuggingFacePage />
      case 'zenn':
        return <ZennPage />
      case 'api-config':
        return <ApiConfigPage />
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
                  <Text type="secondary">{t('app.copyright')}</Text>
                  <Text type="secondary">{t('app.subtitle')}</Text>
                  <Text type="secondary">{t('app.description')}</Text>
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

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App