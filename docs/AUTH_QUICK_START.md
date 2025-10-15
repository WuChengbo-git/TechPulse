# 🚀 TechPulse 增强认证系统 - 快速开始

## 📌 概述

本指南帮助你快速启用 TechPulse 的增强认证系统，包括邮箱验证、密码重置、MFA 和 OAuth2 登录。

---

## ⚡ 5 分钟快速启动

### 1. 安装依赖

```bash
cd backend
poetry install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，至少配置以下内容：
SECRET_KEY=your-random-secret-key-here
JWT_SECRET_KEY=another-random-secret-key
```

生成随机密钥：
```bash
poetry run python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. 执行数据库迁移

```bash
poetry run python scripts/migrate_auth_enhancements.py
```

### 4. 启动服务

```bash
poetry run uvicorn app.main:app --reload
```

### 5. 测试 API

打开浏览器访问：http://localhost:8000/docs

你将看到新增的认证端点！

---

## 📧 启用邮件功能（可选但推荐）

### 使用 Gmail

1. 登录 Gmail 账号
2. 前往 [Google 账号设置](https://myaccount.google.com/)
3. 启用"两步验证"
4. 创建"应用专用密码"
5. 在 `.env` 中配置：

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM_EMAIL=noreply@techpulse.com
```

### 测试邮件发送

```bash
poetry run python -c "
import asyncio
from app.core.email import send_email

asyncio.run(send_email(
    to_emails=['your-email@example.com'],
    subject='测试邮件',
    html_content='<h1>邮件配置成功！</h1><p>TechPulse 邮件服务已就绪。</p>'
))
print('邮件发送成功！检查你的收件箱。')
"
```

---

## 🔐 启用 OAuth2 登录（可选）

### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目
3. 启用 "Google+ API"
4. 创建 OAuth 2.0 凭据
5. 添加授权重定向 URI：`http://localhost:5173/auth/callback`
6. 复制客户端 ID 和密钥到 `.env`：

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

### GitHub OAuth

1. 访问 GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers)
2. 点击"New OAuth App"
3. 填写信息：
   - Application name: TechPulse
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:5173/auth/callback
4. 创建后复制 Client ID 和生成 Client Secret
5. 添加到 `.env`：

```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Microsoft OAuth

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 进入 "Azure Active Directory" → "App registrations"
3. 点击"New registration"
4. 添加重定向 URI（Web）：`http://localhost:5173/auth/callback`
5. 创建客户端密钥
6. 复制应用程序（客户端）ID 和密钥值到 `.env`：

```bash
MICROSOFT_CLIENT_ID=your-application-id
MICROSOFT_CLIENT_SECRET=your-client-secret
```

---

## 🧪 测试认证功能

### 1. 用户注册

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123456",
    "display_name": "Test User"
  }'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456"
  }'
```

保存返回的 `access_token` 和 `refresh_token`。

### 3. 获取用户信息

```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 刷新令牌

```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

---

## 🔢 设置 MFA

### 1. 获取 MFA 配置

```bash
curl -X POST http://localhost:8000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

返回的 JSON 包含：
- `secret`: MFA 密钥
- `qr_code`: Base64 编码的二维码图片
- `backup_codes`: 备用验证码列表

### 2. 扫描二维码

使用 Google Authenticator 或 Authy 扫描返回的二维码。

### 3. 启用 MFA

```bash
curl -X POST http://localhost:8000/api/v1/auth/mfa/enable \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totp_code": "123456"
  }'
```

将 `123456` 替换为你的验证器应用显示的 6 位验证码。

### 4. 使用 MFA 登录

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test123456",
    "totp_code": "123456"
  }'
```

---

## 🌐 测试 OAuth 登录

### 浏览器测试

1. 打开浏览器访问：
   - Google: http://localhost:8000/api/v1/oauth/google/login
   - GitHub: http://localhost:8000/api/v1/oauth/github/login
   - Microsoft: http://localhost:8000/api/v1/oauth/microsoft/login

2. 完成授权后，会重定向到前端回调 URL，携带 `access_token` 和 `refresh_token`

---

## 📱 前端集成示例

### React + TypeScript

```typescript
// 用户注册
async function register(data: {
  username: string;
  email: string;
  password: string;
}) {
  const response = await fetch('http://localhost:8000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail);
  }

  return response.json();
}

// 用户登录
async function login(username: string, password: string) {
  const response = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) throw new Error('登录失败');

  const data = await response.json();

  // 保存令牌
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);

  return data.user;
}

// OAuth 登录
function loginWithGoogle() {
  window.location.href = 'http://localhost:8000/api/v1/oauth/google/login';
}

// OAuth 回调处理
function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    // 跳转到主页
    window.location.href = '/dashboard';
  }
}
```

---

## ⚙️ 高级配置

### 自定义令牌有效期

在 `.env` 中：

```bash
ACCESS_TOKEN_EXPIRE_MINUTES=60      # 访问令牌 1 小时
REFRESH_TOKEN_EXPIRE_DAYS=90        # 刷新令牌 90 天
```

### 自定义密码策略

在 `.env` 中：

```bash
PASSWORD_MIN_LENGTH=12              # 最小密码长度
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=12  # 密码重置令牌 12 小时有效
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS=24  # 邮箱验证令牌 24 小时有效
```

### 启用速率限制（建议）

```bash
MAX_LOGIN_ATTEMPTS=3                # 最大登录尝试次数
LOCKOUT_DURATION_MINUTES=15         # 锁定持续时间
```

---

## 🐛 故障排除

### 问题：邮件发送失败

**解决方案**：
1. 检查 SMTP 配置是否正确
2. 确认 Gmail 应用专用密码正确
3. 查看日志：`tail -f logs/backend.log | grep email`

### 问题：OAuth 登录后 404

**解决方案**：
1. 检查前端是否运行在 `http://localhost:5173`
2. 确认 OAuth 应用的回调 URL 配置正确
3. 查看浏览器控制台错误

### 问题：MFA 验证码总是错误

**解决方案**：
1. 检查服务器时间是否正确：`date`
2. 同步服务器时间：`sudo ntpdate -s time.nist.gov`
3. 使用备用验证码

### 问题：Token 验证失败

**解决方案**：
1. 检查 `SECRET_KEY` 和 `JWT_SECRET_KEY` 是否配置
2. 确认令牌未过期
3. 尝试刷新令牌

---

## 📚 更多资源

- **完整文档**: [docs/AUTH_ENHANCED_GUIDE.md](AUTH_ENHANCED_GUIDE.md)
- **实现总结**: [docs/AUTH_IMPLEMENTATION_SUMMARY.md](AUTH_IMPLEMENTATION_SUMMARY.md)
- **API 文档**: http://localhost:8000/docs
- **测试文件**: [backend/tests/test_auth_enhanced.py](../backend/tests/test_auth_enhanced.py)

---

## ✅ 检查清单

在部署到生产环境前，请确认：

- [ ] 已设置强随机密钥（SECRET_KEY 和 JWT_SECRET_KEY）
- [ ] 已配置 SMTP 邮件服务
- [ ] 已配置所需的 OAuth 提供商
- [ ] 已执行数据库迁移
- [ ] 已运行单元测试
- [ ] 已测试所有认证流程
- [ ] 已配置 HTTPS（生产环境）
- [ ] 已设置适当的 CORS 策略
- [ ] 已配置速率限制
- [ ] 已设置日志监控

---

## 🎉 恭喜！

你已经成功设置了 TechPulse 的增强认证系统！

现在你可以：
- ✅ 用户注册和登录
- ✅ 邮箱验证
- ✅ 密码重置
- ✅ 多因素认证
- ✅ OAuth2 第三方登录
- ✅ 安全的令牌管理

如有问题，请查看完整文档或联系开发团队。

---

**最后更新**: 2025-10-14
