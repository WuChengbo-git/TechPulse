# Electron 安装问题解决方案

## 问题描述

在安装 Electron 时，由于需要下载大约 100MB 的二进制文件，可能会遇到网络连接问题导致安装失败。

## 当前状态

✅ **已成功安装**：
- concurrently
- wait-on
- cross-env
- electron-builder
- electron (包代码，但缺少二进制文件)

❌ **待完成**：
- Electron 二进制文件下载

## 解决方案

### 方案 1: 手动下载 Electron 二进制文件（推荐）

1. 查看需要的 Electron 版本：
```bash
cat package.json | grep electron
```

当前版本: **38.2.0**

2. 手动下载对应平台的 Electron 二进制文件：

**Linux x64:**
```bash
wget https://github.com/electron/electron/releases/download/v38.2.0/electron-v38.2.0-linux-x64.zip
```

**macOS:**
```bash
wget https://github.com/electron/electron/releases/download/v38.2.0/electron-v38.2.0-darwin-x64.zip
```

**Windows:**
```bash
wget https://github.com/electron/electron/releases/download/v38.2.0/electron-v38.2.0-win32-x64.zip
```

3. 解压到正确位置：
```bash
# 创建目标目录
mkdir -p node_modules/electron/dist

# 解压（以 Linux 为例）
unzip electron-v38.2.0-linux-x64.zip -d node_modules/electron/dist/

# 创建 path.txt 文件
echo "electron" > node_modules/electron/path.txt
```

### 方案 2: 使用代理重试

如果您有代理，可以设置后重试：

```bash
# 设置代理（根据您的代理配置）
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

# 重新运行安装脚本
node node_modules/electron/install.js
```

### 方案 3: 稍后网络稳定时重试

```bash
# 多次重试直到成功
for i in {1..10}; do
  echo "Attempt $i..."
  node node_modules/electron/install.js && break || sleep 5
done
```

### 方案 4: 使用 yarn（可能更稳定）

```bash
# 删除 node_modules 中的 electron
rm -rf node_modules/electron

# 使用 yarn 安装
yarn add -D electron
```

## 验证安装

安装成功后，运行以下命令验证：

```bash
npx electron --version
```

应该输出: `v38.2.0`

## 在没有 Electron 二进制的情况下测试前端

即使 Electron 二进制文件未下载，您仍然可以：

1. **测试登录页面和前端功能**（推荐）：
```bash
npm run dev
```
然后访问 http://localhost:5173 查看登录页面效果

2. **构建前端**：
```bash
npm run build
```

## 成功安装后的使用

一旦 Electron 二进制文件安装成功，即可运行：

### 开发模式
```bash
npm run electron:dev
```

### 构建应用
```bash
# Linux
npm run electron:build:linux

# Windows
npm run electron:build:win

# macOS
npm run electron:build:mac
```

## 常见问题

### Q: 为什么会下载失败？
A: Electron 二进制文件约 100MB，托管在 GitHub Releases，可能因为网络波动导致连接中断。

### Q: 可以跳过 Electron 吗？
A: 可以！项目本身是一个 React + Vite 应用，可以作为 Web 应用使用，不一定需要 Electron 桌面版本。

### Q: 下载太慢怎么办？
A: 建议使用方案 1 手动下载，可以使用下载工具（如 wget、curl、浏览器下载器等）断点续传。

## 需要帮助？

如果以上方案都无法解决，可以：
1. 检查网络连接
2. 尝试更换网络环境
3. 使用移动热点
4. 联系网络管理员
