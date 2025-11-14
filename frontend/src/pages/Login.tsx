import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, message, Card, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Logo from '../components/Logo';
import LanguageSelector from '../components/LanguageSelector';
import { authAPI } from '../utils/api';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginFormValues {
  username: string;
  email?: string;
  password: string;
  confirmPassword?: string;
  remember: boolean;
}

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const [form] = Form.useForm();

  // 在组件加载时，从 localStorage 读取保存的用户名和密码
  React.useEffect(() => {
    const savedUsername = localStorage.getItem('techpulse_saved_username');
    const savedPassword = localStorage.getItem('techpulse_saved_password');
    const autoLogin = localStorage.getItem('techpulse_auto_login') === 'true';

    if (savedUsername) {
      form.setFieldsValue({
        username: savedUsername,
        password: savedPassword || '',
        remember: true,
      });
    }

    // 自动登录 - 添加更严格的验证，避免发送空请求
    if (autoLogin && savedUsername && savedPassword &&
        savedUsername.trim() !== '' && savedPassword.trim() !== '') {
      form.setFieldsValue({
        username: savedUsername,
        password: savedPassword,
        remember: true,
      });
      // 延迟100ms后自动提交表单
      setTimeout(() => {
        form.submit();
      }, 100);
    } else if (autoLogin) {
      // 如果启用了自动登录但凭据无效，清除自动登录标志
      console.log('清除无效的自动登录凭据');
      localStorage.removeItem('techpulse_auto_login');
      localStorage.removeItem('techpulse_saved_password');
    }
  }, [form]);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      if (isRegister) {
        // 注册
        await authAPI.register({
          username: values.username,
          email: values.email!,
          password: values.password,
        });
        message.success(t('login.registerSuccess'));
        // 清空表单
        form.resetFields();
        // 切换到登录模式
        setIsRegister(false);
      } else {
        // 登录
        const response = await authAPI.login({
          username: values.username,
          password: values.password,
        });

        const { access_token, user } = response.data;

        // 存储 token 和用户信息
        if (values.remember) {
          localStorage.setItem('techpulse_token', access_token);
          localStorage.setItem('techpulse_user', JSON.stringify(user));
          // 保存用户名和密码（用于下次自动填充和自动登录）
          localStorage.setItem('techpulse_saved_username', values.username);
          localStorage.setItem('techpulse_saved_password', values.password);
        } else {
          sessionStorage.setItem('techpulse_token', access_token);
          sessionStorage.setItem('techpulse_user', JSON.stringify(user));
          // 不记住时清除保存的密码
          localStorage.removeItem('techpulse_saved_password');
          localStorage.removeItem('techpulse_auto_login');
        }

        message.success(t('login.loginSuccess'));
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('认证错误:', error);
      console.error('错误响应:', error.response);

      let errorMsg = '';

      // 根据错误类型显示对应语言的错误信息
      if (error.response?.status === 401) {
        errorMsg = t('login.invalidCredentials');
      } else if (error.response?.status === 400) {
        errorMsg = t('login.badRequest');
      } else if (error.response?.status === 500) {
        errorMsg = t('login.serverError');
      } else if (error.message) {
        errorMsg = `${t('login.networkError')}: ${error.message}`;
      } else {
        errorMsg = isRegister ? t('login.registerFailed') : t('login.loginFailed');
      }

      message.error(errorMsg, 5); // 显示5秒
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.1
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: 'white',
              borderRadius: '50%',
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* 语言切换器 - 右上角 */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1000
      }}>
        <LanguageSelector
          value={language}
          onChange={(lang) => setLanguage(lang as 'zh-CN' | 'en-US' | 'ja-JP')}
          size="large"
        />
      </div>

      {/* 登录卡片 */}
      <Card
        style={{
          width: 450,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          borderRadius: 16,
          position: 'relative',
          zIndex: 1
        }}
        bodyStyle={{ padding: '40px 40px 24px' }}
      >
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <Logo size={100} showText={false} />
          <h1 style={{
            textAlign: 'center',
            margin: '16px 0 8px 0',
            fontSize: 32,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #1890ff, #52c41a, #722ed1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('login.title')}
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#8c8c8c',
            marginTop: 8,
            fontSize: 14
          }}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* 登录/注册表单 */}
        <Form
          form={form}
          name={isRegister ? "register" : "login"}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: t('login.usernameRequired') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('login.usernamePlaceholder')}
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('login.emailRequired') },
                { type: 'email', message: t('login.emailInvalid') }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t('login.emailPlaceholder')}
              />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('login.passwordPlaceholder')}
            />
          </Form.Item>

          {isRegister && (
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('login.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('login.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('login.confirmPasswordPlaceholder')}
              />
            </Form.Item>
          )}

          {!isRegister && (
            <Form.Item style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>{t('login.remember')}</Checkbox>
                  </Form.Item>
                  <a href="#" style={{ color: '#1890ff' }}>
                    {t('login.forgotPassword')}
                  </a>
                </div>
                <Checkbox
                  checked={localStorage.getItem('techpulse_auto_login') === 'true'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      localStorage.setItem('techpulse_auto_login', 'true');
                    } else {
                      localStorage.removeItem('techpulse_auto_login');
                    }
                  }}
                >
                  {t('login.autoLogin') || '自动登录'}
                </Checkbox>
              </div>
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 45,
                fontSize: 16,
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #1890ff, #52c41a)',
                border: 'none'
              }}
            >
              {isRegister ? t('login.registerButton') : t('login.loginButton')}
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Space>
              <Button
                type="link"
                onClick={() => setIsRegister(!isRegister)}
                style={{ padding: 0 }}
              >
                {isRegister ? t('login.switchToLogin') : t('login.switchToRegister')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* CSS 动画 */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
