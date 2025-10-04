# TechPulse Electron 桌面应用

## 概述

TechPulse 现已支持 Electron 桌面应用，可以直接在 Windows、Mac 和 Linux 平台上安装使用。

## 功能特性

✅ **用户登录系统** - 完整的登录/注册功能
✅ **精美 Logo 设计** - 带动画效果的科技感 Logo
✅ **跨平台支持** - 支持 Windows、Mac、Linux
✅ **原生体验** - 桌面应用的原生体验
✅ **自动更新** - 支持应用自动更新（需配置）

## Logo 设计说明

登录页面的 Logo 采用了现代科技风格设计：

- **核心元素**: 大写字母 "T" 代表 TechPulse
- **动态圆环**: 表示数据流动和技术脉搏
- **脉冲波形**: 象征科技的律动和创新
- **渐变配色**: 蓝色(#1890ff) → 绿色(#52c41a) → 紫色(#722ed1)
- **动画效果**:
  - 外圈旋转动画（20秒周期）
  - 中圈反向旋转（15秒周期）
  - 脉冲波形律动（2秒周期）
  - 数据点呼吸效果

## 安装依赖

由于网络原因，如果 npm install 失败，可以尝试以下方法：

### 方法 1: 使用国内镜像

```bash
cd frontend

# 设置 npm 淘宝镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

### 方法 2: 使用 cnpm

```bash
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install --save-dev electron electron-builder concurrently wait-on cross-env
```

### 方法 3: 使用 yarn

```bash
yarn add -D electron electron-builder concurrently wait-on cross-env
```

## 开发模式运行

```bash
cd frontend

# 启动 Electron 开发模式（同时启动 Vite 和 Electron）
npm run electron:dev
```

## 构建安装包

### Windows 平台

```bash
npm run electron:build:win
```

生成的安装包位于 `frontend/release/` 目录

### Mac 平台

```bash
npm run electron:build:mac
```

生成的 DMG 文件位于 `frontend/release/` 目录

### Linux 平台

```bash
npm run electron:build:linux
```

生成的 AppImage 文件位于 `frontend/release/` 目录

### 全平台构建

```bash
npm run electron:build
```

## 项目结构

```
frontend/
├── electron/              # Electron 相关文件
│   ├── main.js           # Electron 主进程
│   └── preload.js        # 预加载脚本
├── src/
│   ├── components/
│   │   └── Logo.tsx      # Logo 组件
│   └── pages/
│       └── Login.tsx     # 登录页面
├── public/
│   └── icon.svg          # 应用图标
└── package.json          # 已配置 Electron 脚本
```

## 登录功能说明

### 用户登录

1. 输入用户名和密码
2. 可选择"记住我"保持登录状态
3. 登录成功后进入主应用

### 用户注册

1. 点击"立即注册"切换到注册页面
2. 填写用户名、邮箱和密码
3. 确认密码匹配后提交注册

### 第三方登录

支持以下第三方登录方式（需后端配置）：
- GitHub
- Twitter
- Google

### 退出登录

点击右上角的退出按钮即可登出

## 配置说明

### package.json 配置

已在 `package.json` 中添加以下配置：

- `main`: 指向 Electron 主进程文件
- `scripts`: 添加了 Electron 相关脚本
- `build`: Electron Builder 构建配置

### 图标配置

应用图标使用 SVG 格式，位于 `public/icon.svg`

如需使用 PNG 图标，建议尺寸：
- Windows: 256x256 或 512x512
- Mac: 512x512 或 1024x1024
- Linux: 512x512

## 注意事项

1. **首次运行**: 第一次运行 `electron:dev` 时，Electron 会下载必要的二进制文件，可能需要较长时间
2. **端口占用**: 确保 5173 端口未被占用（Vite 默认端口）
3. **构建环境**:
   - Windows 构建需要在 Windows 系统上进行
   - Mac 构建需要在 Mac 系统上进行
   - Linux 构建可以在 Linux 或 Mac 上进行

## 开发建议

1. **调试**: 开发模式下会自动打开 DevTools，方便调试
2. **热更新**: 前端代码修改后会自动热更新
3. **主进程修改**: 修改 `electron/main.js` 需要重启应用

## 下一步计划

- [ ] 集成真实的后端 API
- [ ] 实现用户认证和授权
- [ ] 添加应用自动更新功能
- [ ] 优化应用性能和体积
- [ ] 添加系统托盘功能
- [ ] 支持多窗口管理

## 问题反馈

如遇到问题，请检查：
1. Node.js 版本（建议 16.x 或更高）
2. npm/yarn 版本
3. 网络连接状态
4. 防火墙设置

## 许可证

与主项目保持一致
