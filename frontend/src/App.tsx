import React from 'react'
import { ConfigProvider, Layout, Typography } from 'antd'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import './App.css'

const { Header, Content, Footer } = Layout
const { Title } = Typography

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Layout>
          <Header style={{ display: 'flex', alignItems: 'center', background: '#001529' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                🚀 TechPulse
              </Title>
            </Link>
          </Header>
          
          <Content style={{ padding: '24px', minHeight: 'calc(100vh - 134px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </Content>
          
          <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
            TechPulse ©2024 - 技术情报仪表盘
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  )
}

export default App