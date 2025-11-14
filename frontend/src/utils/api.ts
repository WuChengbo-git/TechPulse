import axios, { AxiosInstance } from 'axios';

// API 基础URL
// 在开发环境使用相对路径（通过 Vite 代理），生产环境使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// 创建 axios 实例
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动添加 token 并验证登录请求
api.interceptors.request.use(
  (config) => {
    // 如果是登录请求，验证请求体
    if (config.url?.includes('/auth/login') && config.method === 'post') {
      const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {};

      // 如果用户名或密码为空或只有空格，拒绝请求
      if (!data.username || !data.password ||
          data.username.trim() === '' || data.password.trim() === '') {
        console.log('阻止空的登录请求');

        // 清除无效的自动登录凭据
        localStorage.removeItem('techpulse_auto_login');
        localStorage.removeItem('techpulse_saved_password');

        // 返回一个被拒绝的Promise，阻止请求发送
        return Promise.reject(new Error('Invalid login credentials'));
      }
    }

    const token =
      localStorage.getItem('techpulse_token') ||
      sessionStorage.getItem('techpulse_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 防止重复刷新页面的标志
let isHandling401 = false;

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 只有在已登录状态下遇到 401 才清除登录状态
    // 登录接口返回 401 时不应该刷新页面
    if (error.response?.status === 401) {
      // 检查是否是登录或注册接口
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') ||
                            error.config?.url?.includes('/auth/register');

      if (!isAuthEndpoint && !isHandling401) {
        // 非登录接口的 401 错误：Token 过期或无效，清除登录状态
        isHandling401 = true; // 设置标志，防止重复处理

        console.log('Token expired or invalid, clearing auth state...');

        // 清除登录状态
        localStorage.removeItem('techpulse_token');
        localStorage.removeItem('techpulse_user');
        sessionStorage.removeItem('techpulse_token');
        sessionStorage.removeItem('techpulse_user');

        // 延迟刷新，给其他 401 请求一些时间完成
        // 注意：不要立即刷新，避免页面加载时的闪烁
        setTimeout(() => {
          // 检查当前页面是否还在应用内部（不是登录页）
          if (window.location.pathname !== '/login') {
            console.log('Redirecting to login page...');
            window.location.reload();
          }
          isHandling401 = false; // 重置标志
        }, 500); // 增加延迟到 500ms
      }
      // 登录接口的 401 错误：正常抛出，让 Login 组件处理
    }
    return Promise.reject(error);
  }
);

// 用户认证 API
export const authAPI = {
  // 用户注册
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/api/v1/auth/register', data),

  // 用户登录
  login: (data: { username: string; password: string }) =>
    api.post('/api/v1/auth/login', data),

  // 获取当前用户信息
  getCurrentUser: () => api.get('/api/v1/auth/me'),

  // 更新用户信息
  updateUser: (data: {
    email?: string;
    display_name?: string;
    avatar_url?: string;
  }) => api.put('/api/v1/auth/me', data),

  // 登出
  logout: () => api.post('/api/v1/auth/logout'),

  // 检查认证状态
  checkAuth: () => api.get('/api/v1/auth/check'),
};

export default api;
