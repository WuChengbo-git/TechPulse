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

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
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
let isRedirecting = false;

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

      if (!isAuthEndpoint && !isRedirecting) {
        // 非登录接口的 401 错误：Token 过期或无效，清除登录状态
        isRedirecting = true; // 设置标志，防止重复刷新

        console.log('Token expired or invalid, redirecting to login...');

        localStorage.removeItem('techpulse_token');
        localStorage.removeItem('techpulse_user');
        sessionStorage.removeItem('techpulse_token');
        sessionStorage.removeItem('techpulse_user');

        // 使用 setTimeout 延迟刷新，避免多个401请求同时触发刷新
        setTimeout(() => {
          window.location.reload();
        }, 100);
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
