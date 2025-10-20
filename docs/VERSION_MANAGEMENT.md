# TechPulse 版本号统一管理

## 📋 概述

TechPulse 采用统一的版本号管理机制，确保前后端版本号完全同步。所有版本信息都从 `frontend/package.json` 中的 `version` 字段读取，无需在多处手动更新。

## 🎯 设计原则

**单一数据源（Single Source of Truth）**：
- `frontend/package.json` 是版本号的唯一数据源
- 所有其他文件都从这个源读取或引用版本号
- 更新版本号时，只需修改 `package.json`，其他文件自动同步

## 📁 架构设计

### 版本号流向

```
frontend/package.json (version: "0.2.1")
         ↓
         ├─→ frontend/src/config/version.ts
         │         ↓
         │         └─→ frontend/src/components/VersionInfo.tsx
         │                    ↓
         │                    └─→ 页面页脚显示
         │
         └─→ backend/app/core/version.py
                   ↓
                   └─→ backend/app/main.py
                          ↓
                          ├─→ FastAPI app version
                          └─→ API root endpoint
```

### 核心文件

#### 1. **frontend/package.json** - 版本号源头
```json
{
  "name": "techpulse-frontend",
  "version": "0.2.1",  ← 唯一需要手动更新的版本号
  ...
}
```

#### 2. **frontend/src/config/version.ts** - 前端配置
```typescript
import packageJson from '../../package.json'

export const APP_VERSION = packageJson.version  // 自动读取
export const BUILD_DATE = new Date().toISOString()...  // 自动生成
```

#### 3. **backend/app/core/version.py** - 后端配置
```python
def read_package_version() -> str:
    """从 package.json 读取版本号"""
    package_json_path = PROJECT_ROOT / "frontend" / "package.json"
    ...
    return package_data.get('version', '0.0.0')

APP_VERSION = read_package_version()  # 自动读取
```

#### 4. **使用版本号的文件**
- `frontend/src/components/VersionInfo.tsx` - 页脚显示
- `backend/app/main.py` - FastAPI 应用版本

## 🚀 使用方法

### 方法一：使用更新脚本（推荐）

```bash
# 更新到新版本
./scripts/update_version.sh 0.2.2

# 脚本会自动：
# 1. 更新 frontend/package.json
# 2. 在 docs/RELEASE.md 添加新版本占位符
# 3. 提示下一步操作
```

### 方法二：手动更新

1. 修改 `frontend/package.json` 中的 `version` 字段：
   ```json
   "version": "0.2.2"
   ```

2. 在 `docs/RELEASE.md` 顶部添加新版本记录

3. 提交更改：
   ```bash
   git add frontend/package.json docs/RELEASE.md
   git commit -m "release: Version 0.2.2"
   ```

**注意**：其他文件会在运行时自动读取新版本号，无需手动修改！

## 📊 版本号显示位置

### 前端
1. **页脚** - 通过 `VersionInfo` 组件显示
   - 显示格式：`Version 0.2.1 | Build 20251020`
   - 位置：所有页面底部

2. **开发工具**
   - 可以在浏览器控制台查看：
   ```javascript
   import { VERSION_INFO } from '@/config/version'
   console.log(VERSION_INFO)
   ```

### 后端
1. **FastAPI 文档** - `/docs` 或 `/redoc`
   - 在 API 文档标题处显示版本号

2. **Root 端点** - `GET /`
   ```json
   {
     "message": "Welcome to TechPulse API",
     "version": "0.2.1"
   }
   ```

3. **健康检查** - `GET /health`
   ```json
   {
     "status": "healthy",
     "version": "0.2.1"
   }
   ```

## 🔧 技术实现

### 前端实现

**版本配置文件** (`frontend/src/config/version.ts`):
```typescript
import packageJson from '../../package.json'

export const APP_VERSION = packageJson.version
export const BUILD_DATE = new Date().toISOString().slice(0, 10).replace(/-/g, '')
export const VERSION_CODENAME = import.meta.env.VITE_VERSION_CODENAME || 'TechPulse'

export const VERSION_INFO = {
  version: APP_VERSION,
  build: BUILD_DATE,
  codename: VERSION_CODENAME,
  fullVersion: `${APP_VERSION} (${BUILD_DATE})`
} as const
```

**使用示例** (`frontend/src/components/VersionInfo.tsx`):
```typescript
import { APP_VERSION, BUILD_DATE } from '../config/version'

const VersionInfo: React.FC = () => {
  return (
    <Space>
      <Text>Version {APP_VERSION}</Text>
      <Text>Build {BUILD_DATE}</Text>
    </Space>
  )
}
```

### 后端实现

**版本配置文件** (`backend/app/core/version.py`):
```python
import json
from pathlib import Path

def read_package_version() -> str:
    """从 package.json 读取版本号"""
    package_json_path = PROJECT_ROOT / "frontend" / "package.json"
    with open(package_json_path, 'r', encoding='utf-8') as f:
        package_data = json.load(f)
        return package_data.get('version', '0.0.0')

APP_VERSION = read_package_version()
BUILD_DATE = datetime.now().strftime('%Y%m%d')
```

**使用示例** (`backend/app/main.py`):
```python
from .core.version import APP_VERSION

app = FastAPI(
    title=settings.app_name,
    version=APP_VERSION,  # 使用统一版本号
    ...
)

@app.get("/")
async def root():
    return {"message": "Welcome to TechPulse API", "version": APP_VERSION}
```

## ✅ 优势

1. **单一数据源** - 只需修改一个地方（package.json）
2. **自动同步** - 所有文件自动读取最新版本号
3. **减少错误** - 避免手动更新多处时的遗漏或不一致
4. **易于维护** - 版本号管理变得简单直观
5. **构建日期自动** - BUILD_DATE 自动生成，无需手动更新

## 🔄 版本号规范

遵循 [Semantic Versioning 2.0.0](https://semver.org/) 规范：

```
MAJOR.MINOR.PATCH

例如: 0.2.1
     │ │ │
     │ │ └─ PATCH: 修复bug，向后兼容
     │ └─── MINOR: 新增功能，向后兼容
     └───── MAJOR: 重大变更，可能不兼容
```

### 版本号递增规则

- **PATCH** (0.2.1 → 0.2.2): Bug修复、小优化
- **MINOR** (0.2.1 → 0.3.0): 新功能、功能增强
- **MAJOR** (0.2.1 → 1.0.0): 重大架构变更、API不兼容

## 📝 版本发布流程

1. **确定版本号**
   ```bash
   # 根据变更类型确定新版本号
   # Bug修复: 0.2.1 → 0.2.2
   # 新功能: 0.2.1 → 0.3.0
   # 重大变更: 0.2.1 → 1.0.0
   ```

2. **运行更新脚本**
   ```bash
   ./scripts/update_version.sh 0.3.0
   ```

3. **完善 RELEASE.md**
   - 填写更新概览
   - 列出新功能
   - 记录问题修复
   - 添加升级指南

4. **测试验证**
   ```bash
   # 启动前端，检查页脚版本号
   cd frontend && npm run dev

   # 启动后端，检查API版本号
   cd backend && uvicorn app.main:app --reload
   curl http://localhost:8000/
   ```

5. **提交代码**
   ```bash
   git add .
   git commit -m "release: Version 0.3.0 - [版本代号]"
   git tag v0.3.0
   git push origin dev
   git push origin v0.3.0
   ```

## ⚠️ 注意事项

1. **构建时间**
   - BUILD_DATE 在每次构建时自动生成
   - 开发环境和生产环境的构建日期可能不同

2. **环境变量**
   - 可通过 `VITE_VERSION_CODENAME` 环境变量自定义版本代号
   - 示例: `VITE_VERSION_CODENAME="TechPulse Refined" npm run build`

3. **TypeScript编译**
   - 确保 `tsconfig.json` 中启用了 `resolveJsonModule: true`
   - 这样才能正确导入 `package.json`

4. **Python路径**
   - 后端版本读取依赖正确的项目结构
   - 确保 `backend/` 和 `frontend/` 在同一层级

## 🐛 故障排除

### 问题1：前端页脚版本号不更新

**原因**: 可能是缓存问题

**解决**:
```bash
# 清除构建缓存
cd frontend
rm -rf node_modules/.vite
npm run build
```

### 问题2：后端API返回旧版本号

**原因**: Python缓存了旧的模块

**解决**:
```bash
# 重启后端服务
# 或清除Python缓存
find . -type d -name __pycache__ -exec rm -rf {} +
```

### 问题3：无法导入 package.json

**原因**: TypeScript配置问题

**解决**: 检查 `tsconfig.json`:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true,
    ...
  }
}
```

## 📚 相关文档

- [RELEASE.md](./RELEASE.md) - 版本发布记录
- [package.json](../frontend/package.json) - 版本号源文件
- [version.ts](../frontend/src/config/version.ts) - 前端版本配置
- [version.py](../backend/app/core/version.py) - 后端版本配置

---

**最后更新**: 2025-10-20
**当前版本**: 0.2.1
**维护者**: TechPulse Team
