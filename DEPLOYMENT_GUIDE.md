# TechPulse 部署和构建指南

## 📋 目录

- [开发环境设置](#开发环境设置)
- [Ubuntu 服务器开发流程](#ubuntu-服务器开发流程)
- [Windows 打包流程](#windows-打包流程)
- [自动化构建（GitHub Actions）](#自动化构建github-actions)
- [常见问题](#常见问题)

---

## 🛠️ 开发环境设置

### Ubuntu 服务器（开发前端）

#### 1. 项目结构
```
TechPulse/
├── frontend/
│   ├── electron/          # Electron 配置
│   │   ├── main.js       # 主进程
│   │   └── preload.js    # 预加载脚本
│   ├── src/
│   │   ├── components/
│   │   │   └── Logo.tsx  # 动态 Logo 组件
│   │   ├── pages/
│   │   │   └── Login.tsx # 登录页面
│   │   └── App.tsx       # 主应用（已集成登录）
│   ├── public/
│   │   └── icon.svg      # 应用图标
│   └── package.json      # 已配置 Electron 脚本
└── backend/              # 后端服务
```

#### 2. 已安装的依赖
```json
{
  "devDependencies": {
    "concurrently": "^8.x",      // ✅ 已安装
    "wait-on": "^7.x",           // ✅ 已安装
    "cross-env": "^7.x",         // ✅ 已安装
    "electron-builder": "^24.x", // ✅ 已安装
    "electron": "^38.2.0"        // ✅ 已安装（包代码）
  }
}
```

#### 3. 可用的 npm 脚本
```json
{
  "scripts": {
    "dev": "vite",                                    // Web 开发模式
    "build": "tsc && vite build",                     // 构建前端
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  }
}
```

---

## 🖥️ Ubuntu 服务器开发流程

### 步骤 1: 启动开发服务器

```bash
cd /home/AI/TechPulse/frontend
npm run dev
```

**访问**: http://localhost:5175 （如果 5173 被占用会自动切换端口）

### 步骤 2: 开发前端功能

开发服务器运行时，可以：
- ✅ 实时预览登录页面
- ✅ 查看 Logo 动画效果
- ✅ 测试登录/注册功能
- ✅ 开发新功能
- ✅ 热更新（代码保存后自动刷新）

### 步骤 3: 构建前端静态文件

开发完成后：
```bash
npm run build
```

生成文件位置: `frontend/dist/`

### 步骤 4: 提交代码

```bash
cd /home/AI/TechPulse

# 查看修改
git status

# 添加文件
git add frontend/

# 提交
git commit -m "Update: 添加 Electron 支持和登录页面"

# 推送到远程仓库
git push origin main
```

---

## 💻 Windows 打包流程

### 准备工作

#### 方式 1: 从 Git 获取代码（推荐）

```cmd
# 克隆或拉取最新代码
git clone https://github.com/your-username/TechPulse.git
cd TechPulse\frontend

# 或者如果已经克隆
cd TechPulse
git pull origin main
cd frontend
```

#### 方式 2: 从 Ubuntu 复制文件

1. 在 Ubuntu 上打包:
```bash
cd /home/AI/TechPulse
tar -czf TechPulse.tar.gz frontend/
```

2. 使用 WinSCP、FileZilla 或其他工具下载到 Windows

3. 在 Windows 上解压

### Windows 构建步骤

#### 步骤 1: 安装依赖

```cmd
cd frontend
npm install
```

**重要**:
- ✅ 会自动下载 Windows 版本的 Electron 二进制文件
- ✅ 安装所有必需的构建工具
- ⏱️ 首次安装约需 5-10 分钟

#### 步骤 2: 测试 Electron 应用

```cmd
npm run electron:dev
```

这会：
1. 启动 Vite 开发服务器
2. 等待服务器就绪
3. 启动 Electron 窗口

#### 步骤 3: 打包 Windows 安装程序

```cmd
npm run electron:build:win
```

构建过程：
1. ✅ TypeScript 编译
2. ✅ Vite 构建前端
3. ✅ Electron Builder 打包
4. ✅ 生成 NSIS 安装程序

#### 步骤 4: 获取安装包

生成的文件：
```
frontend/release/
├── TechPulse Setup 0.1.7.exe     # NSIS 安装程序
└── win-unpacked/                  # 未打包的应用文件
```

安装程序大小: 约 150-200 MB

---

## 🤖 自动化构建（GitHub Actions）

### 配置自动构建

创建文件: `.github/workflows/electron-build.yml`

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Build Windows App
        run: |
          cd frontend
          npm run electron:build:win

      - name: Upload Windows Installer
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: frontend/release/*.exe

  build-linux:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Build Linux App
        run: |
          cd frontend
          npm run electron:build:linux

      - name: Upload Linux AppImage
        uses: actions/upload-artifact@v3
        with:
          name: linux-appimage
          path: frontend/release/*.AppImage

  build-mac:
    runs-on: macos-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm install

      - name: Build macOS App
        run: |
          cd frontend
          npm run electron:build:mac

      - name: Upload macOS DMG
        uses: actions/upload-artifact@v3
        with:
          name: macos-dmg
          path: frontend/release/*.dmg
```

### 使用自动构建

#### 方式 1: 通过 Git Tag 触发

```bash
# 创建版本标签
git tag v0.1.7
git push origin v0.1.7

# GitHub Actions 会自动：
# 1. 在 Windows 上构建 .exe
# 2. 在 Linux 上构建 .AppImage
# 3. 在 macOS 上构建 .dmg
```

#### 方式 2: 手动触发

1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Build Electron App"
4. 点击 "Run workflow"

#### 下载构建产物

1. 进入 Actions 运行记录
2. 滚动到底部的 "Artifacts"
3. 下载对应平台的安装包

---

## 📦 发布流程

### 版本发布清单

- [ ] 在 Ubuntu 上完成所有功能开发
- [ ] 更新版本号 (frontend/package.json)
- [ ] 更新 CHANGELOG.md
- [ ] 提交并推送代码
- [ ] 创建 Git Tag
- [ ] 等待 GitHub Actions 构建完成
- [ ] 从 Artifacts 下载安装包
- [ ] 测试安装包
- [ ] 创建 GitHub Release
- [ ] 上传安装包到 Release
- [ ] 发布更新说明

### 版本号管理

```json
// frontend/package.json
{
  "version": "0.1.7"  // 主版本.次版本.修订号
}
```

修改后：
```bash
git add frontend/package.json
git commit -m "Bump version to 0.1.8"
git tag v0.1.8
git push origin main --tags
```

---

## 🔧 开发工具和命令

### 在 Ubuntu 上

```bash
# 开发模式
npm run dev              # 启动 Vite 开发服务器

# 构建
npm run build            # 构建前端静态文件

# 代码检查
npm run lint             # ESLint 检查

# 查看端口
lsof -i :5173            # 检查 Vite 端口占用
```

### 在 Windows 上

```cmd
# Electron 开发
npm run electron:dev     # 启动 Electron 应用

# 打包
npm run electron:build:win   # 打包 Windows 版本

# 清理
rmdir /s /q dist         # 删除构建文件
rmdir /s /q release      # 删除发布文件
```

---

## 🎨 登录系统功能

### 登录页面特性

1. **动态 Logo**
   - 核心字母 "T" 代表 TechPulse
   - 双层旋转圆环（20秒 + 15秒周期）
   - 脉冲波形律动（2秒周期）
   - 数据点呼吸效果
   - 渐变色：蓝(#1890ff) → 绿(#52c41a) → 紫(#722ed1)

2. **登录功能**
   - 用户名/密码登录
   - "记住我" 功能（LocalStorage）
   - 忘记密码链接
   - 第三方登录入口（GitHub/Twitter/Google）

3. **注册功能**
   - 用户名、邮箱、密码输入
   - 密码确认验证
   - 一键切换登录/注册

4. **状态管理**
   - LocalStorage: 持久化登录
   - SessionStorage: 临时登录
   - 用户头像显示首字母
   - 退出登录功能

---

## ❓ 常见问题

### Q1: Ubuntu 上需要安装 Electron 吗？

**A**: 不需要！在 Ubuntu 上只需要开发前端，Electron 二进制文件只在 Windows 打包时需要。

### Q2: 如何在 Ubuntu 上预览 Electron 效果？

**A**: 无法完全预览，但可以：
- 使用 `npm run dev` 查看 Web 版本
- 所有 UI 和功能在 Web 版本中都能测试

### Q3: Windows 打包失败怎么办？

**A**: 检查：
1. Node.js 版本（推荐 16.x 或 20.x）
2. 网络连接（下载 Electron 需要）
3. 磁盘空间（至少 2GB）
4. 运行 `npm cache clean --force` 清理缓存

### Q4: 如何更新应用图标？

**A**: 替换 `frontend/public/icon.svg`，推荐尺寸：
- Windows: 256x256 或 512x512 PNG
- macOS: 512x512 或 1024x1024 PNG/ICNS
- Linux: 512x512 PNG

### Q5: 如何修改应用名称？

**A**: 修改 `frontend/package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "您的应用名称"
  }
}
```

### Q6: 构建的安装包太大怎么办？

**A**: 优化方案：
1. 移除未使用的依赖
2. 配置 `asarUnpack` 排除大文件
3. 使用 `files` 配置指定打包文件
4. 启用代码压缩和混淆

---

## 📞 技术支持

### 文档参考

- [ELECTRON_README.md](frontend/ELECTRON_README.md) - Electron 基础说明
- [ELECTRON_INSTALL_GUIDE.md](frontend/ELECTRON_INSTALL_GUIDE.md) - 安装问题解决
- [WINDOWS_BUILD_GUIDE.md](frontend/WINDOWS_BUILD_GUIDE.md) - Windows 构建详解

### 相关资源

- [Electron 官方文档](https://www.electronjs.org/docs)
- [Electron Builder 文档](https://www.electron.build/)
- [Vite 官方文档](https://vitejs.dev/)
- [React 官方文档](https://react.dev/)

---

## 📝 快速参考卡片

### Ubuntu 开发快速命令

```bash
cd /home/AI/TechPulse/frontend
npm run dev          # 启动开发
npm run build        # 构建前端
git add .            # 添加文件
git commit -m "msg"  # 提交
git push             # 推送
```

### Windows 打包快速命令

```cmd
cd frontend
npm install                  # 安装依赖
npm run electron:dev        # 测试
npm run electron:build:win  # 打包
```

### 版本发布快速命令

```bash
# 更新版本
npm version patch   # 0.1.7 -> 0.1.8
npm version minor   # 0.1.7 -> 0.2.0
npm version major   # 0.1.7 -> 1.0.0

# 发布
git push origin main --tags
```

---

**最后更新**: 2025-10-02
**维护者**: TechPulse Team
