# TechPulse 用户认证系统 - 完整文档

> **状态**: ✅ 已完成并上线
> **最后更新**: 2025-10-09

---

## 📋 目录

1. [系统概述](#系统概述)
2. [架构设计](#架构设计)
3. [已实现功能](#已实现功能)
4. [API 文档](#api-文档)
5. [数据库设计](#数据库设计)
6. [安全特性](#安全特性)
7. [使用指南](#使用指南)
8. [测试验证](#测试验证)

---

## 🎯 系统概述

TechPulse 采用 **FastAPI + React** 的现代化认证系统，提供完整的用户注册、登录、会话管理功能。

### 核心特点
- ✅ **密码加密**: Argon2 算法（比 Bcrypt 更安全）
- ✅ **JWT Token**: 24小时有效期，支持自动刷新
- ✅ **邮箱验证**: Pydantic EmailStr 自动验证
- ✅ **SQL 注入防护**: SQLAlchemy ORM 防护
- ✅ **精美 UI**: 渐变背景 + 动态 Logo 动画

---

## 🏗️ 架构设计

### 认证流程

```
用户提交登录表单 (React)
    ↓
前端发送 POST /api/v1/auth/login
    ↓
后端验证用户名密码 (FastAPI)
    ↓
查询数据库 (SQLAlchemy + SQLite)
    ↓
验证密码 (Argon2)
    ↓
生成 JWT Token (24h有效期)
    ↓
返回 Token + 用户信息
    ↓
前端存储到 LocalStorage/SessionStorage
    ↓
后续请求携带 Authorization: Bearer <token>
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端** | React + TypeScript | 类型安全的组件开发 |
| **UI库** | Ant Design | 企业级组件库 |
| **后端** | FastAPI | 现代异步 Python 框架 |
| **ORM** | SQLAlchemy | Python 最流行的 ORM |
| **数据库** | SQLite | 轻量级关系型数据库 |
| **认证** | JWT | JSON Web Token |
| **加密** | Argon2 | 现代密码哈希算法 |

---

## ✅ 已实现功能

### 后端功能

| 功能 | 文件位置 | 状态 |
|------|----------|------|
| 用户模型 | `backend/app/models/user.py` | ✅ 完成 |
| 数据验证 | `backend/app/models/user_schemas.py` | ✅ 完成 |
| 安全工具 | `backend/app/core/security.py` | ✅ 完成 |
| 认证路由 | `backend/app/api/auth.py` | ✅ 完成 |
| 数据库表 | `users` 表 | ✅ 完成 |
| 认证日志 | `auth_logs` 表 | ✅ 完成 |

### 前端功能

| 功能 | 文件位置 | 状态 |
|------|----------|------|
| API 工具 | `frontend/src/utils/api.ts` | ✅ 完成 |
| 登录页面 | `frontend/src/pages/Login.tsx` | ✅ 完成 |
| App 集成 | `frontend/src/App.tsx` | ✅ 完成 |
| Logo 组件 | `frontend/src/components/Logo.tsx` | ✅ 完成 |
| Token 管理 | LocalStorage + SessionStorage | ✅ 完成 |

---

## 📡 API 文档

### 1. 用户注册

**端点**: `POST /api/v1/auth/register`

**请求体**:
```json
{
  "username": "your_username",
  "email": "your@email.com",
  "password": "your_password"
}
```

**响应** (201 Created):
```json
{
  "id": 1,
  "username": "your_username",
  "email": "your@email.com",
  "display_name": "your_username",
  "avatar_url": null,
  "is_active": true,
  "created_at": "2025-10-02T05:24:34",
  "last_login": null
}
```

**错误响应**:
- `400`: 用户名或邮箱已存在
- `422`: 验证失败（密码太短、邮箱格式错误等）

---

### 2. 用户登录

**端点**: `POST /api/v1/auth/login`

**请求体**:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**响应** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "your_username",
    "email": "your@email.com",
    "display_name": "your_username",
    "avatar_url": null,
    "is_active": true,
    "created_at": "2025-10-02T05:24:34",
    "last_login": "2025-10-02T05:24:47"
  }
}
```

**错误响应**:
- `401`: 用户名或密码错误
- `403`: 账号已被禁用

---

### 3. 获取当前用户信息

**端点**: `GET /api/v1/auth/me`

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200 OK):
```json
{
  "id": 1,
  "username": "your_username",
  "email": "your@email.com",
  "display_name": "your_username",
  "avatar_url": null,
  "is_active": true,
  "created_at": "2025-10-02T05:24:34",
  "last_login": "2025-10-02T05:24:47"
}
```

**错误响应**:
- `401`: Token 无效或已过期

---

### 4. 更新用户信息

**端点**: `PUT /api/v1/auth/me`

**请求头**:
```
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "email": "newemail@example.com",
  "display_name": "New Name",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

**响应** (200 OK):
```json
{
  "id": 1,
  "username": "your_username",
  "email": "newemail@example.com",
  "display_name": "New Name",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

---

### 5. 用户登出

**端点**: `POST /api/v1/auth/logout`

**请求头**:
```
Authorization: Bearer <token>
```

**响应** (200 OK):
```json
{
  "message": "Successfully logged out"
}
```

---

## 💾 数据库设计

### users 表

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user',
    preferences JSON DEFAULT '{}'
);

-- 索引
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);
```

### auth_logs 表（认证日志）

```sql
CREATE TABLE auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL,  -- login, logout, register, etc.
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20),  -- success, failed
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX idx_auth_logs_created_at ON auth_logs(created_at);
```

---

## 🔐 安全特性

### 1. 密码安全
- **加密算法**: Argon2（内存硬算法，抗 GPU 破解）
- **Salt**: 自动生成随机盐值
- **验证规则**: 最少6位，前端+后端双重验证

### 2. Token 安全
- **算法**: HS256（HMAC + SHA256）
- **有效期**: 24小时
- **自动刷新**: 401 错误时清理过期 Token
- **存储位置**: LocalStorage（记住我）或 SessionStorage（临时）

### 3. API 安全
- **CORS**: 配置允许的源
- **SQL 注入**: SQLAlchemy ORM 自动转义
- **XSS 防护**: React 自动转义
- **CSRF**: Token 验证机制

### 4. 认证日志
- 记录所有登录、登出、注册行为
- 记录 IP 地址和 User-Agent
- 失败尝试追踪（可扩展：账号锁定机制）

---

## 🚀 使用指南

### 1. 启动后端

```bash
cd /home/AI/TechPulse/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**后端地址**: http://localhost:8000
**API 文档**: http://localhost:8000/docs

### 2. 启动前端

```bash
cd /home/AI/TechPulse/frontend
npm run dev
```

**前端地址**: http://localhost:5174

### 3. 访问应用

打开浏览器访问: http://localhost:5174

---

## 🧪 测试验证

### 后端 API 测试

#### 1. 注册测试
```bash
curl -X POST 'http://localhost:8000/api/v1/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123456"
  }'
```

**预期结果**: ✅ 返回用户信息（不含密码）

#### 2. 登录测试
```bash
curl -X POST 'http://localhost:8000/api/v1/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "testuser",
    "password": "test123456"
  }'
```

**预期结果**: ✅ 返回 JWT Token 和用户信息

#### 3. 获取用户信息
```bash
TOKEN="<your_token_here>"
curl -X GET 'http://localhost:8000/api/v1/auth/me' \
  -H "Authorization: Bearer $TOKEN"
```

**预期结果**: ✅ 返回当前用户完整信息

### 前端测试

1. **注册流程**: ✅ 通过
   - 表单验证正常
   - 错误提示友好
   - 成功后跳转登录

2. **登录流程**: ✅ 通过
   - 账号密码验证
   - Token 存储正常
   - 记住我功能正常

3. **状态管理**: ✅ 通过
   - 登录状态持久化
   - 页面刷新状态保持
   - 登出清理完整

4. **UI 体验**: ✅ 通过
   - 渐变背景美观
   - Logo 动画流畅
   - 响应式布局

---

## 📝 核心代码示例

### 后端：密码验证

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

# 注册时：加密密码
password_hash = ph.hash(password)

# 登录时：验证密码
try:
    ph.verify(user.password_hash, password)
    # 密码正确
except VerifyMismatchError:
    # 密码错误
    raise HTTPException(status_code=401, detail="Invalid credentials")
```

### 前端：Token 管理

```typescript
// 保存 Token
const saveToken = (token: string, remember: boolean) => {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('techpulse_token', token)
}

// 获取 Token
const getToken = () => {
  return localStorage.getItem('techpulse_token') ||
         sessionStorage.getItem('techpulse_token')
}

// 清除 Token
const clearToken = () => {
  localStorage.removeItem('techpulse_token')
  sessionStorage.removeItem('techpulse_token')
}
```

---

## 🔄 后续扩展计划

### P1 - 高优先级
- [ ] 邮箱验证（注册后发送验证邮件）
- [ ] 忘记密码功能
- [ ] 修改密码功能
- [ ] OAuth 第三方登录（GitHub, Google）

### P2 - 中优先级
- [ ] 双因素认证（2FA）
- [ ] 登录设备管理
- [ ] 异常登录检测
- [ ] 账号锁定机制（多次失败）

### P3 - 低优先级
- [ ] 密码强度检测
- [ ] 登录历史记录
- [ ] 会话管理（多设备）

---

## 📚 相关文档

- **API 文档**: http://localhost:8000/docs
- **数据库设计**: 见本文档 [数据库设计](#数据库设计) 章节
- **安全规范**: 见本文档 [安全特性](#安全特性) 章节

---

**最后更新**: 2025-10-09
**维护者**: TechPulse Team
