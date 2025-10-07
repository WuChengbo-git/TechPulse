# TechPulse 用户认证系统集成指南

## 📋 当前状态

### ✅ 已完成（前端）
- 精美的登录/注册页面
- 动态 Logo 动画
- 表单验证
- LocalStorage/SessionStorage 状态管理
- 第三方登录 UI 入口

### ❌ 待实现（后端）
- 用户数据库
- 密码加密存储
- JWT Token 认证
- API 接口
- 会话管理

---

## 🏗️ 完整认证系统架构

```
前端 (React)
    ↓
    登录表单提交
    ↓
后端 API (Python/Node.js)
    ↓
    1. 验证用户名密码
    2. 查询数据库
    3. 生成 JWT Token
    ↓
返回 Token 给前端
    ↓
前端存储 Token
    ↓
后续请求携带 Token
```

---

## 📊 数据库设计

### 用户表 (users)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- 加密后的密码
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user'  -- user, admin, etc.
);

-- 索引
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
```

### 会话表 (sessions) - 可选

```sql
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔧 后端实现

### 方案 1: Python (Flask) 实现

#### 1. 安装依赖

```bash
pip install flask flask-cors flask-jwt-extended bcrypt sqlite3
```

#### 2. 创建认证 API (`backend/auth.py`)

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
import sqlite3
from datetime import timedelta

app = Flask(__name__)
CORS(app)

# 配置
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'  # 请修改为安全的密钥
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

# 数据库连接
def get_db():
    conn = sqlite3.connect('techpulse.db')
    conn.row_factory = sqlite3.Row
    return conn

# 初始化数据库
def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            display_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE
        )
    ''')
    conn.commit()
    conn.close()

# 注册接口
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': '缺少必填字段'}), 400

    # 密码加密
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    conn = get_db()
    try:
        conn.execute(
            'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
            (username, email, password_hash, username)
        )
        conn.commit()
        return jsonify({'message': '注册成功'}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': '用户名或邮箱已存在'}), 400
    finally:
        conn.close()

# 登录接口
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': '缺少用户名或密码'}), 400

    conn = get_db()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        (username, username)
    ).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': '用户不存在'}), 401

    # 验证密码
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        return jsonify({'error': '密码错误'}), 401

    # 生成 Token
    access_token = create_access_token(
        identity=user['id'],
        additional_claims={
            'username': user['username'],
            'email': user['email']
        }
    )

    # 更新最后登录时间
    conn = get_db()
    conn.execute(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        (user['id'],)
    )
    conn.commit()
    conn.close()

    return jsonify({
        'token': access_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'display_name': user['display_name']
        }
    }), 200

# 获取当前用户信息（需要认证）
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': '用户不存在'}), 404

    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'display_name': user['display_name'],
        'created_at': user['created_at'],
        'last_login': user['last_login']
    }), 200

# 登出接口（可选，主要在前端清除 token）
@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # JWT 是无状态的，登出主要在前端处理
    # 如果需要服务端登出，可以使用黑名单机制
    return jsonify({'message': '登出成功'}), 200

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
```

#### 3. 启动后端服务

```bash
cd backend
python auth.py
```

API 运行在: http://localhost:5000

---

### 方案 2: Node.js (Express) 实现

#### 1. 安装依赖

```bash
npm install express cors jsonwebtoken bcryptjs sqlite3 body-parser
```

#### 2. 创建认证 API (`backend/auth.js`)

```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = 'your-secret-key-change-this'; // 请修改
const db = new sqlite3.Database('techpulse.db');

// 初始化数据库
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
  )
`);

// 注册接口
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: '缺少必填字段' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
    [username, email, password_hash, username],
    function(err) {
      if (err) {
        return res.status(400).json({ error: '用户名或邮箱已存在' });
      }
      res.status(201).json({ message: '注册成功' });
    }
  );
});

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: '缺少用户名或密码' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [username, username],
    async (err, user) => {
      if (err || !user) {
        return res.status(401).json({ error: '用户不存在' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: '密码错误' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name
        }
      });
    }
  );
});

// 认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: '未授权' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token 无效' });
  }
};

// 获取当前用户
app.get('/api/auth/me', authMiddleware, (req, res) => {
  db.get(
    'SELECT id, username, email, display_name, created_at, last_login FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      res.json(user);
    }
  );
});

app.listen(5000, () => {
  console.log('Auth API running on http://localhost:5000');
});
```

---

## 🎨 前端集成

### 更新 Login.tsx

```typescript
import { useState } from 'react';
import { Form, Input, Button, Checkbox, message } from 'antd';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const response = await axios.post(`${API_URL}${endpoint}`, {
        username: values.username,
        email: values.email, // 注册时需要
        password: values.password
      });

      if (isRegister) {
        message.success('注册成功！请登录');
        setIsRegister(false);
      } else {
        // 登录成功，保存 token
        const { token, user } = response.data;

        if (values.remember) {
          localStorage.setItem('techpulse_token', token);
          localStorage.setItem('techpulse_user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('techpulse_token', token);
          sessionStorage.setItem('techpulse_user', JSON.stringify(user));
        }

        message.success('登录成功！');
        onLoginSuccess();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || '操作失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ... 其余代码保持不变
};
```

### 创建 API 工具类 (`src/utils/api.ts`)

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// 创建 axios 实例
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// 请求拦截器：自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('techpulse_token') ||
                  sessionStorage.getItem('techpulse_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：处理 401 错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期或无效，清除登录状态
      localStorage.removeItem('techpulse_token');
      localStorage.removeItem('techpulse_user');
      sessionStorage.removeItem('techpulse_token');
      sessionStorage.removeItem('techpulse_user');

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API 方法
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),

  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),

  getCurrentUser: () =>
    api.get('/auth/me'),

  logout: () =>
    api.post('/auth/logout')
};
```

---

## 🚀 部署步骤

### 1. 设置数据库

```bash
cd /home/AI/TechPulse/backend
python auth.py  # 会自动创建数据库
```

### 2. 启动后端服务

```bash
# Python
python auth.py

# 或 Node.js
node auth.js
```

### 3. 更新前端代码

将上面的前端代码集成到项目中

### 4. 启动前端

```bash
cd /home/AI/TechPulse/frontend
npm run dev
```

### 5. 测试

1. 访问 http://localhost:5175
2. 注册新用户
3. 登录测试
4. 查看浏览器开发者工具的 Network 标签，确认 API 调用

---

## 🔒 安全建议

### 必须做的：
1. ✅ **修改 JWT_SECRET** - 使用随机生成的强密码
2. ✅ **HTTPS** - 生产环境必须使用 HTTPS
3. ✅ **密码强度** - 前端添加密码强度验证
4. ✅ **防暴力破解** - 添加登录失败次数限制
5. ✅ **XSS 防护** - 输入验证和转义
6. ✅ **CSRF 防护** - 添加 CSRF Token

### 建议添加的：
1. 📧 **邮箱验证** - 注册后发送验证邮件
2. 🔐 **双因素认证** - 2FA/TOTP
3. 📱 **第三方登录** - OAuth (GitHub, Google)
4. 🔑 **密码重置** - 忘记密码功能
5. 📊 **登录日志** - 记录登录历史
6. ⏱️ **Token 刷新** - Refresh Token 机制

---

## 📝 API 接口文档

### POST /api/auth/register
注册新用户

**请求体**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

**响应**:
```json
{
  "message": "注册成功"
}
```

### POST /api/auth/login
用户登录

**请求体**:
```json
{
  "username": "testuser",
  "password": "password123"
}
```

**响应**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "display_name": "testuser"
  }
}
```

### GET /api/auth/me
获取当前用户信息（需要认证）

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "display_name": "testuser",
  "created_at": "2025-10-02 12:00:00",
  "last_login": "2025-10-02 13:00:00"
}
```

---

## 🎯 下一步

选择您想要的实现方式：

1. **快速开始** - 使用 Python Flask 方案（推荐）
2. **Node.js** - 使用 Express 方案
3. **自定义** - 我可以帮您创建具体的代码文件

需要我帮您实现完整的后端认证系统吗？
