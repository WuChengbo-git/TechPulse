import { useState, useEffect } from 'react'
import { ConfigProvider, Layout, Button, Breadcrumb, Typography, Space, Avatar, Dropdown, Badge, Modal, Form, Input, message } from 'antd'
import type { MenuProps } from 'antd'
import { BrowserRouter as Router } from 'react-router-dom'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, LogoutOutlined, UserOutlined, GlobalOutlined, LockOutlined, ProfileOutlined, SafetyOutlined, QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import Sidebar from './components/Sidebar'
import VersionInfo from './components/VersionInfo'
import LanguageSelector from './components/LanguageSelector'
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
import SettingsPage from './pages/SettingsPage'
import TaskManagementPage from './pages/TaskManagementPage'
import SystemStatusPage from './pages/SystemStatusPage'
import Login from './pages/Login'
import './App.css'

const { Header, Content, Footer } = Layout
const { Text } = Typography

function AppContent() {
  const [collapsed, setCollapsed] = useState(false)
  const [selectedKey, setSelectedKey] = useState('dashboard')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [form] = Form.useForm()
  const { t, language, setLanguage } = useLanguage()

  // 检查登录状态
  useEffect(() => {
    const localToken = localStorage.getItem('techpulse_token')
    const sessionToken = sessionStorage.getItem('techpulse_token')
    const localUser = localStorage.getItem('techpulse_user')
    const sessionUser = sessionStorage.getItem('techpulse_user')

    if ((localToken || sessionToken) && (localUser || sessionUser)) {
      setIsLoggedIn(true)
      const userStr = localUser || sessionUser || ''
      try {
        const user = JSON.parse(userStr)
        setUsername(user.username || user.display_name || '')
      } catch {
        setUsername(userStr)
      }
    }
  }, [])

  // 处理登录成功
  const handleLoginSuccess = () => {
    const localUser = localStorage.getItem('techpulse_user')
    const sessionUser = sessionStorage.getItem('techpulse_user')
    const userStr = localUser || sessionUser || ''

    setIsLoggedIn(true)
    try {
      const user = JSON.parse(userStr)
      setUsername(user.username || user.display_name || '')
    } catch {
      setUsername(userStr)
    }
  }

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('techpulse_token')
    localStorage.removeItem('techpulse_user')
    sessionStorage.removeItem('techpulse_token')
    sessionStorage.removeItem('techpulse_user')
    setIsLoggedIn(false)
    setUsername('')
  }

  // 处理修改密码
  const handleChangePassword = async (values: any) => {
    try {
      // TODO: 调用修改密码API
      message.success(t('nav.changePasswordSuccess'))
      setChangePasswordVisible(false)
      form.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.detail || t('nav.changePasswordFailed'))
    }
  }

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

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
      settings: [t('nav.systemManagement'), t('nav.systemSettings')],
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
      case 'settings':
        return <SettingsPage />
      case 'tasks':
        return <TaskManagementPage />
      case 'status':
        return <SystemStatusPage />
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
              
              <Space size="middle">
                {/* 通知图标 */}
                <Badge count={0} showZero={false}>
                  <Button type="text" icon={<BellOutlined />} title={t('nav.notifications')} />
                </Badge>

                {/* 用户下拉菜单 */}
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'user-info',
                        label: (
                          <div style={{ padding: '8px 0' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{username}</div>
                            <div style={{ fontSize: '12px', color: '#999' }}>{t('nav.personalCenter')}</div>
                          </div>
                        ),
                        disabled: true,
                      },
                      { type: 'divider' },
                      {
                        key: 'profile',
                        label: t('nav.profileSettings'),
                        icon: <ProfileOutlined />,
                        onClick: () => message.info(t('nav.comingSoon')),
                      },
                      {
                        key: 'change-password',
                        label: t('nav.changePassword'),
                        icon: <LockOutlined />,
                        onClick: () => setChangePasswordVisible(true),
                      },
                      {
                        key: 'security',
                        label: t('nav.securitySettings'),
                        icon: <SafetyOutlined />,
                        onClick: () => message.info(t('nav.comingSoon')),
                      },
                      { type: 'divider' },
                      {
                        key: 'language',
                        label: t('nav.languageSwitch'),
                        icon: <GlobalOutlined />,
                        children: [
                          {
                            key: 'zh',
                            label: '简体中文',
                            onClick: () => setLanguage('zh'),
                          },
                          {
                            key: 'en',
                            label: 'English',
                            onClick: () => setLanguage('en'),
                          },
                        ],
                      },
                      {
                        key: 'settings',
                        label: t('nav.systemSettings'),
                        icon: <SettingOutlined />,
                        onClick: () => setSelectedKey('settings'),
                      },
                      { type: 'divider' },
                      {
                        key: 'help',
                        label: t('nav.helpCenter'),
                        icon: <QuestionCircleOutlined />,
                        onClick: () => message.info(t('nav.comingSoon')),
                      },
                      {
                        key: 'about',
                        label: t('nav.about'),
                        icon: <InfoCircleOutlined />,
                        onClick: () => message.info('TechPulse v0.1.9'),
                      },
                      { type: 'divider' },
                      {
                        key: 'logout',
                        label: t('common.logout'),
                        icon: <LogoutOutlined />,
                        danger: true,
                        onClick: handleLogout,
                      },
                    ],
                  }}
                  placement="bottomRight"
                  trigger={['click']}
                >
                  <Avatar
                    style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                    icon={!username ? <UserOutlined /> : undefined}
                  >
                    {username ? username.charAt(0).toUpperCase() : ''}
                  </Avatar>
                </Dropdown>
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

        {/* 修改密码弹窗 */}
        <Modal
          title={t('nav.changePassword')}
          open={changePasswordVisible}
          onCancel={() => {
            setChangePasswordVisible(false)
            form.resetFields()
          }}
          onOk={() => form.submit()}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="oldPassword"
              label={t('nav.oldPassword')}
              rules={[{ required: true, message: t('nav.oldPasswordRequired') }]}
            >
              <Input.Password placeholder={t('nav.oldPasswordPlaceholder')} />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label={t('nav.newPassword')}
              rules={[
                { required: true, message: t('nav.newPasswordRequired') },
                { min: 6, message: t('nav.passwordMinLength') }
              ]}
            >
              <Input.Password placeholder={t('nav.newPasswordPlaceholder')} />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t('nav.confirmNewPassword')}
              dependencies={['newPassword']}
              rules={[
                { required: true, message: t('nav.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error(t('login.passwordMismatch')))
                  },
                }),
              ]}
            >
              <Input.Password placeholder={t('nav.confirmPasswordPlaceholder')} />
            </Form.Item>
          </Form>
        </Modal>
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