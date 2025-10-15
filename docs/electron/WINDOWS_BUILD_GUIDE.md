# 在 Ubuntu 服务器上为 Windows 构建 Electron 应用

## 重要说明

您的情况：
- **开发环境**: Ubuntu 服务器
- **目标平台**: Windows 用户使用

## 两种方案

### 方案 1: 直接在 Windows 上开发和打包（推荐）

这是最简单的方案：

1. **将代码传输到 Windows 机器**：
```bash
# 在 Ubuntu 上打包代码
cd /home/AI/TechPulse
tar -czf techpulse.tar.gz frontend/

# 然后通过 scp、U盘或其他方式传输到 Windows
```

2. **在 Windows 上安装依赖**：
```cmd
cd frontend
npm install
```

3. **在 Windows 上运行和打包**：
```cmd
# 开发模式
npm run electron:dev

# 打包 Windows 安装程序
npm run electron:build:win
```

### 方案 2: 在 Ubuntu 上交叉编译 Windows 应用

虽然可以在 Linux 上构建 Windows 应用，但**需要额外配置**：

#### 步骤 1: 安装 Wine（Windows 兼容层）

```bash
# 安装 Wine
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine wine32 wine64

# 验证安装
wine --version
```

#### 步骤 2: 下载 Windows 版本的 Electron

```bash
# 查看需要的版本
cd /home/AI/TechPulse/frontend
cat package.json | grep '"electron"'

# 下载 Windows 版本（64位）
wget https://github.com/electron/electron/releases/download/v38.2.0/electron-v38.2.0-win32-x64.zip

# 解压到正确位置
mkdir -p node_modules/electron/dist
unzip electron-v38.2.0-win32-x64.zip -d node_modules/electron/dist/

# 创建 path.txt
echo "electron.exe" > node_modules/electron/path.txt
```

#### 步骤 3: 构建 Windows 安装包

```bash
npm run electron:build:win
```

⚠️ **注意**: 交叉编译可能遇到问题，如：
- Wine 配置复杂
- 某些 Windows 特定功能可能无法正常工作
- 签名和证书问题

## 推荐的开发流程

### 最佳实践：

```
Ubuntu 服务器 (开发前端)
    ↓
    1. 开发 React 前端
    2. 测试 Web 版本: npm run dev
    3. 构建前端: npm run build
    ↓
传输到 Windows
    ↓
Windows 机器 (打包桌面应用)
    ↓
    1. 安装依赖: npm install
    2. 测试 Electron: npm run electron:dev
    3. 打包应用: npm run electron:build:win
    ↓
生成 Windows 安装程序
```

## 当前可以做的（在 Ubuntu 上）

### 1. 开发和测试前端功能 ✅

您的开发服务器已经在运行：
```
http://localhost:5175
```

可以：
- 完善登录页面
- 开发其他功能
- 测试 UI/UX
- 调试业务逻辑

### 2. 构建前端静态文件 ✅

```bash
npm run build
```

这会生成 `dist/` 目录，包含所有前端文件。

### 3. 准备 Electron 配置 ✅

所有 Electron 配置已经完成：
- ✅ electron/main.js
- ✅ electron/preload.js
- ✅ package.json 配置
- ✅ 构建脚本

## 如果必须在 Ubuntu 上打包 Windows 版本

### 方案 A: 下载 Windows 版 Electron 二进制

```bash
cd /home/AI/TechPulse/frontend

# 下载 Windows 版本
wget https://github.com/electron/electron/releases/download/v38.2.0/electron-v38.2.0-win32-x64.zip

# 解压
mkdir -p node_modules/electron/dist
unzip electron-v38.2.0-win32-x64.zip -d node_modules/electron/dist/

# 配置路径
echo "electron.exe" > node_modules/electron/path.txt
```

### 方案 B: 使用 Docker

创建 `Dockerfile.windows-build`:
```dockerfile
FROM electronuserland/builder:wine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run electron:build:win
```

构建：
```bash
docker build -f Dockerfile.windows-build -t techpulse-builder .
docker run -v $(pwd)/release:/app/release techpulse-builder
```

## 我的建议

**对于您的情况，推荐：**

1. **现在（Ubuntu 上）**：
   - 继续开发前端功能
   - 使用 `npm run dev` 测试
   - 完善所有功能

2. **准备打包时**：
   - 将代码复制到 Windows 机器
   - 在 Windows 上运行 `npm install`
   - 在 Windows 上运行 `npm run electron:build:win`

3. **或者使用 CI/CD**：
   - 使用 GitHub Actions
   - 自动在 Windows 环境中构建

## GitHub Actions 自动构建（推荐）

创建 `.github/workflows/build.yml`:

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v3

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

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installer
          path: frontend/release/*.exe
```

这样每次打 tag 时，GitHub 会自动在 Windows 环境构建安装包！

## 总结

| 方案 | 难度 | 可靠性 | 推荐度 |
|------|------|--------|--------|
| 在 Windows 上构建 | ⭐ 简单 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| GitHub Actions | ⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| Ubuntu 交叉编译 | ⭐⭐⭐⭐ 复杂 | ⭐⭐ 一般 | ⭐⭐ 不太推荐 |
| Docker 构建 | ⭐⭐⭐ 较复杂 | ⭐⭐⭐⭐ 较高 | ⭐⭐⭐ 可以考虑 |

**结论**: 在 Ubuntu 上开发前端，在 Windows 上打包 Electron 应用是最简单可靠的方案。
