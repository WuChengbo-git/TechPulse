import axios, { AxiosInstance } from 'axios';

// API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除登录状态
      localStorage.removeItem('techpulse_token');
      localStorage.removeItem('techpulse_user');
      sessionStorage.removeItem('techpulse_token');
      sessionStorage.removeItem('techpulse_user');

      // 重定向到登录页（在 App 组件中会自动处理）
      window.location.reload();
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
