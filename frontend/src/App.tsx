import { useState, useEffect } from 'react'
import { ConfigProvider, Layout, Button, Breadcrumb, Typography, Space, Avatar, Dropdown, Badge, Modal, Form, Input, message } from 'antd'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, SettingOutlined, LogoutOutlined, UserOutlined, GlobalOutlined, LockOutlined, ProfileOutlined, SafetyOutlined, QuestionCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import Sidebar from './components/Sidebar'
import VersionInfo from './components/VersionInfo'
import InterestSurvey from './components/InterestSurvey'
import type { UserPreferences } from './components/InterestSurvey'
import { APP_VERSION } from './config/version'
// New v0.4.0 pages
import DiscoverPage from './pages/DiscoverPage'
import ExplorePage from './pages/ExplorePage'
import DetailPage from './pages/DetailPage'
import CollectionsPage from './pages/CollectionsPage'

// Legacy pages (backed up to src/pages/legacy_backup/)
// Uncomment if needed: Dashboard, Overview, GitHubPage, ArxivPage, HuggingFacePage, ZennPage, Analytics

// Other pages
import Chat from './pages/Chat'
import TrendsPage from './pages/TrendsPage'
import ApiConfigPage from './pages/ApiConfigPage'
import SettingsPage from './pages/SettingsPage'
import TaskManagementPage from './pages/TaskManagementPage'
import SystemStatusPage from './pages/SystemStatusPage'
import LLMProvidersPage from './pages/LLMProvidersPage'
import Login from './pages/Login'
import './App.css'
import './styles/responsive.css'

const { Header, Content, Footer } = Layout
const { Text } = Typography

function AppContent() {
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [surveyVisible, setSurveyVisible] = useState(false)
  const [form] = Form.useForm()
  const { t, language, setLanguage } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()

  // 从路由路径推断选中的菜单项
  const getSelectedKeyFromPath = (pathname: string) => {
    // Handle detail page specially (always select 'discover')
    if (pathname.startsWith('/detail/')) {
      return 'discover'
    }

    const pathMap: Record<string, string> = {
      '/': 'discover',
      '/discover': 'discover',
      '/explore': 'explore',
      '/collections': 'collections',
      '/trending': 'trending',
      '/chat': 'chat',
      // System management
      '/settings': 'settings',
      '/api-config': 'api-config',
      '/llm-providers': 'llm-providers',
      '/tasks': 'tasks',
      '/status': 'status'
    }
    return pathMap[pathname] || 'discover'
  }

  const selectedKey = getSelectedKeyFromPath(location.pathname)

  // 菜单选择处理 - 使用路由导航
  const handleMenuSelect = (key: string) => {
    const keyToPath: Record<string, string> = {
      // New v0.4.0 pages
      'discover': '/discover',
      'explore': '/explore',
      'collections': '/collections',
      'trending': '/trending',
      'chat': '/chat',
      // System management
      'settings': '/settings',
      'api-config': '/api-config',
      'llm-providers': '/llm-providers',
      'tasks': '/tasks',
      'status': '/status'
    }
    navigate(keyToPath[key] || '/discover')
  }

  // 动态更新页面标题
  useEffect(() => {
    document.title = t('app.pageTitle')
  }, [language, t])

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

  // 检查是否需要显示问卷
  const checkSurveyStatus = async () => {
    const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token')
    if (!token) return

    try {
      const response = await fetch('/api/v1/preferences/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const preferences = await response.json()
        // 如果用户未完成问卷，显示问卷
        if (!preferences.onboarding_completed) {
          setSurveyVisible(true)
        }
      }
    } catch (error) {
      console.error('Failed to check survey status:', error)
    }
  }

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

    // 检查是否需要显示问卷
    checkSurveyStatus()
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

  // 处理问卷完成
  const handleSurveyComplete = (preferences: UserPreferences) => {
    setSurveyVisible(false)
    message.success('欢迎使用 TechPulse！我们将根据你的偏好推荐内容 🎉')
  }

  // 处理跳过问卷
  const handleSurveySkip = () => {
    setSurveyVisible(false)
    message.info('你可以随时在个人中心完成偏好设置')
  }

  // 处理修改密码
  const handleChangePassword = async (values: any) => {
    try {
      const token = localStorage.getItem('techpulse_token') || sessionStorage.getItem('techpulse_token')

      const response = await fetch('/api/v1/auth/password/change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: values.oldPassword,
          new_password: values.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || t('nav.changePasswordFailed'))
      }

      message.success(t('nav.changePasswordSuccess'))
      setChangePasswordVisible(false)
      form.resetFields()

      // 密码修改成功后，提示用户重新登录
      message.info(t('nav.pleaseRelogin') || '请重新登录', 3)
      setTimeout(() => {
        handleLogout()
      }, 3000)
    } catch (error: any) {
      message.error(error.message || t('nav.changePasswordFailed'))
    }
  }

  // 如果未登录，显示登录页面
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }

  const getBreadcrumbItems = () => {
    const breadcrumbMap: Record<string, string[]> = {
      // New v0.4.0 pages
      discover: [t('nav.home'), t('discover.title') || '今日精选'],
      explore: [t('nav.home'), t('explore.title') || '数据探索'],
      collections: [t('nav.home'), t('collections.title') || '我的收藏'],
      // Trending & Analysis
      trending: [t('nav.analytics'), t('nav.trendAnalysis')],
      chat: [t('nav.analytics'), t('nav.aiAssistant')],
      // System management
      settings: [t('nav.systemManagement'), t('nav.systemSettings')],
      'api-config': [t('nav.systemManagement'), t('nav.apiConfig')],
      'llm-providers': [t('nav.systemManagement'), 'LLM模型管理'],
      tasks: [t('nav.systemManagement'), t('nav.taskManagement')],
      status: [t('nav.systemManagement'), t('nav.systemStatus')]
    }

    const items = breadcrumbMap[selectedKey] || [t('nav.home')]
    return items.map(item => ({ title: item }))
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
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar
            collapsed={collapsed}
            selectedKey={selectedKey}
            onMenuSelect={handleMenuSelect}
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
                            key: 'zh-CN',
                            label: '简体中文',
                            onClick: () => setLanguage('zh-CN'),
                          },
                          {
                            key: 'en-US',
                            label: 'English',
                            onClick: () => setLanguage('en-US'),
                          },
                          {
                            key: 'ja-JP',
                            label: '日本語',
                            onClick: () => setLanguage('ja-JP'),
                          },
                        ],
                      },
                      {
                        key: 'settings',
                        label: t('nav.systemSettings'),
                        icon: <SettingOutlined />,
                        onClick: () => navigate('/settings'),
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
                        onClick: () => message.info(`TechPulse v${APP_VERSION}`),
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
              <Routes>
                {/* Default route - redirect to new discover page */}
                <Route path="/" element={<Navigate to="/discover" replace />} />

                {/* New v0.4.0 pages */}
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/detail/:id" element={<DetailPage />} />
                <Route path="/collections" element={<CollectionsPage />} />

                {/* Trending & Analysis */}
                <Route path="/trending" element={<TrendsPage />} />
                <Route path="/chat" element={<Chat />} />

                {/* Legacy data source pages (backed up to src/pages/legacy_backup/) */}
                {/* Uncomment if needed in the future:
                <Route path="/dashboard" element={<Overview />} />
                <Route path="/github" element={<GitHubPage />} />
                <Route path="/arxiv" element={<ArxivPage />} />
                <Route path="/huggingface" element={<HuggingFacePage />} />
                <Route path="/zenn" element={<ZennPage />} />
                <Route path="/analytics" element={<Analytics />} />
                */}

                {/* System management */}
                <Route path="/api-config" element={<ApiConfigPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/llm-providers" element={<LLMProvidersPage />} />
                <Route path="/tasks" element={<TaskManagementPage />} />
                <Route path="/status" element={<SystemStatusPage />} />

                {/* Catch all - redirect to discover */}
                <Route path="*" element={<Navigate to="/discover" replace />} />
              </Routes>
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

        {/* 用户兴趣问卷 */}
        <InterestSurvey
          visible={surveyVisible}
          onComplete={handleSurveyComplete}
          onSkip={handleSurveySkip}
        />
    </ConfigProvider>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <Router>
          <AppContent />
        </Router>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default App