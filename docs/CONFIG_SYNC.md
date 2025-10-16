# 配置同步功能文档

## 📋 目录

- [功能概述](#功能概述)
- [架构设计](#架构设计)
- [后端实现](#后端实现)
- [前端实现](#前端实现)
- [使用指南](#使用指南)
- [API 文档](#api-文档)
- [测试](#测试)
- [故障排查](#故障排查)

## 功能概述

配置同步功能实现了 UI 配置与项目配置文件（.env）的双向同步，确保：

✅ **前端配置面板与配置文件实时同步**
✅ **修改 UI 设置后自动更新运行参数**
✅ **后端检测配置变化并自动应用**
✅ **提供重载配置与恢复默认功能**
✅ **完善的配置验证与错误提示**
✅ **配置修改持久化保存（不丢失）**
✅ **敏感信息遮蔽与安全管理**
✅ **配置备份与恢复机制**

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 UI                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SystemConfig.tsx (配置管理页面)                     │   │
│  │  - 配置查看与编辑                                     │   │
│  │  - 配置验证                                           │   │
│  │  - 备份管理                                           │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                           │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  systemConfigService.ts                             │   │
│  │  - API 调用封装                                      │   │
│  │  - 数据转换                                          │   │
│  └───────────────┬─────────────────────────────────────┘   │
└──────────────────┼─────────────────────────────────────────┘
                   │ HTTP REST API
┌──────────────────▼─────────────────────────────────────────┐
│                      后端 API                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  system_config.py (配置管理 API)                    │   │
│  │  GET  /api/v1/system-config                         │   │
│  │  PUT  /api/v1/system-config                         │   │
│  │  POST /api/v1/system-config/reload                  │   │
│  │  POST /api/v1/system-config/validate                │   │
│  │  POST /api/v1/system-config/restore/defaults        │   │
│  └───────────────┬─────────────────────────────────────┘   │
│                  │                                           │
│  ┌───────────────▼─────────────────────────────────────┐   │
│  │  config_manager.py (配置文件管理器)                 │   │
│  │  - 读取 .env 文件                                    │   │
│  │  - 写入配置到文件                                     │   │
│  │  - 配置验证                                           │   │
│  │  - 备份管理                                           │   │
│  └───────────────┬─────────────────────────────────────┘   │
└──────────────────┼─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│                    配置文件存储                              │
│  ├── .env (当前配置)                                        │
│  ├── .env.example (默认配置模板)                           │
│  └── config_backups/ (配置备份目录)                        │
│      ├── .env.backup.20251015_120000                       │
│      ├── .env.backup.20251015_130000                       │
│      └── ...                                                │
└────────────────────────────────────────────────────────────┘
```

### 数据流

1. **读取配置流程**
   ```
   用户 → 前端UI → API请求 → 后端API → ConfigManager
        → 读取.env文件 → 返回配置数据 → 前端展示
   ```

2. **更新配置流程**
   ```
   用户编辑 → 前端验证 → API请求 → 后端验证 → ConfigManager
            → 创建备份 → 更新.env文件 → 热重载 → 返回结果
   ```

3. **配置验证流程**
   ```
   触发验证 → API请求 → ConfigManager → 验证必需键
            → 验证数值类型 → 验证布尔值 → 检查默认值
            → 返回验证结果（错误/警告）
   ```

## 后端实现

### ConfigManager 类

位置：`backend/app/services/config_manager.py`

#### 核心功能

1. **配置加载**
   ```python
   manager = ConfigManager(".env")
   config = manager.get_all()  # 获取所有配置
   value = manager.get("SECRET_KEY")  # 获取单个配置
   ```

2. **配置更新**
   ```python
   # 单个更新
   manager.set("DEBUG", "true")

   # 批量更新
   manager.update({
       "DEBUG": "false",
       "DATABASE_URL": "postgresql://localhost/db"
   })

   # 保存到文件
   manager.save(backup=True)
   ```

3. **配置验证**
   ```python
   result = manager.validate()
   # {
   #   "valid": True/False,
   #   "errors": ["错误列表"],
   #   "warnings": ["警告列表"]
   # }
   ```

4. **备份管理**
   ```python
   # 创建备份（自动在保存时）
   manager.save(backup=True)

   # 从备份恢复
   manager.restore_from_backup("filename")

   # 恢复默认配置
   manager.restore_defaults()
   ```

5. **安全特性**
   ```python
   # 获取敏感键列表
   sensitive_keys = manager.get_sensitive_keys()

   # 遮蔽敏感值
   safe_value = manager.mask_sensitive_value("SECRET_KEY", "value")

   # 导出安全配置
   safe_config = manager.export_safe_config()
   ```

### API 端点

位置：`backend/app/api/system_config.py`

| 方法 | 端点 | 功能 | 权限 |
|------|------|------|------|
| GET | `/api/v1/system-config` | 获取系统配置 | 管理员 |
| GET | `/api/v1/system-config/keys` | 获取配置键列表 | 管理员 |
| GET | `/api/v1/system-config/item/{key}` | 获取单个配置项 | 管理员 |
| PUT | `/api/v1/system-config` | 更新配置 | 管理员 |
| POST | `/api/v1/system-config/reload` | 重载配置 | 管理员 |
| POST | `/api/v1/system-config/validate` | 验证配置 | 管理员 |
| POST | `/api/v1/system-config/restore/defaults` | 恢复默认 | 管理员 |
| GET | `/api/v1/system-config/backups` | 列出备份 | 管理员 |
| POST | `/api/v1/system-config/restore/backup` | 从备份恢复 | 管理员 |

## 前端实现

### SystemConfigService

位置：`frontend/src/services/systemConfigService.ts`

```typescript
import systemConfigService from '@/services/systemConfigService'

// 获取配置
const { config } = await systemConfigService.getConfig(false)

// 更新配置
await systemConfigService.updateConfig({
  DEBUG: 'true',
  ACCESS_TOKEN_EXPIRE_MINUTES: '60'
}, true)

// 验证配置
const validation = await systemConfigService.validateConfig()

// 导出配置
const json = await systemConfigService.exportConfig(false)
```

### SystemConfig 页面组件

位置：`frontend/src/pages/SystemConfig.tsx`

#### 主要特性

- ✅ 配置表格展示与编辑
- ✅ 敏感信息显示/隐藏切换
- ✅ 实时配置验证
- ✅ 配置导出为 JSON
- ✅ 备份管理与恢复
- ✅ 统计信息展示
- ✅ 批量操作支持

## 使用指南

### 1. 访问配置管理页面

导航到系统配置页面（需要管理员权限）：
```
http://localhost:5173/system-config
```

### 2. 查看配置

- 页面加载时自动获取当前配置
- 默认遮蔽敏感信息（可点击"显示敏感信息"查看）
- 配置项按键名排序，支持搜索和分页

### 3. 编辑配置

1. 在表格中直接修改配置值
2. 修改的项会标记为"已修改"
3. 点击"保存配置"按钮应用更改
4. 系统自动创建备份并重载配置

### 4. 验证配置

点击"验证配置"按钮，系统会检查：
- ✅ 必需配置项是否存在
- ✅ 数值类型是否正确
- ✅ 布尔值格式是否有效
- ✅ 是否使用默认/示例值

### 5. 备份管理

1. 每次保存配置时自动创建备份
2. 点击"查看备份"查看所有备份文件
3. 可从任意备份恢复配置
4. 系统自动保留最近 10 个备份

### 6. 导出/导入配置

**导出配置：**
```
点击"导出配置" → 下载 JSON 文件
```

**导入配置：**（通过 API）
```typescript
const json = '{"DEBUG": "true", ...}'
await systemConfigService.importConfig(json, true)
```

## API 文档

### GET /api/v1/system-config

获取系统配置

**Query Parameters:**
- `show_sensitive` (boolean): 是否显示敏感信息，默认 false

**Response:**
```json
{
  "config": {
    "DATABASE_URL": "sqlite:///./techpulse.db",
    "SECRET_KEY": "test****key",
    "DEBUG": "true"
  },
  "env_file": "/path/to/.env",
  "total_items": 25
}
```

### PUT /api/v1/system-config

更新系统配置

**Request Body:**
```json
{
  "config": {
    "DEBUG": "false",
    "ACCESS_TOKEN_EXPIRE_MINUTES": "60"
  },
  "apply_immediately": true
}
```

**Response:**
```json
{
  "message": "Configuration updated successfully",
  "updated_keys": ["DEBUG", "ACCESS_TOKEN_EXPIRE_MINUTES"],
  "applied": true
}
```

### POST /api/v1/system-config/validate

验证配置

**Response:**
```json
{
  "valid": false,
  "errors": [
    "Missing required config: DATABASE_URL"
  ],
  "warnings": [
    "Using default/example value for SECRET_KEY"
  ]
}
```

## 测试

### 单元测试

配置管理器单元测试：`tests/unit/test_config_manager.py`

```bash
# 运行测试
pytest tests/unit/test_config_manager.py -v

# 测试覆盖率
pytest tests/unit/test_config_manager.py --cov=app.services.config_manager
```

**测试覆盖：**
- ✅ 配置加载（6 tests）
- ✅ 配置更新（4 tests）
- ✅ 配置保存（4 tests）
- ✅ 配置备份（4 tests）
- ✅ 配置验证（5 tests）
- ✅ 安全特性（5 tests）
- ✅ 配置重载（2 tests）
- ✅ 配置恢复（3 tests）

**总计：33 个测试，覆盖率 87%**

### 集成测试

配置 API 集成测试：`tests/integration/test_system_config_api.py`

```bash
# 运行测试
pytest tests/integration/test_system_config_api.py -v
```

**测试覆盖：**
- ✅ 获取配置 API
- ✅ 更新配置 API
- ✅ 验证配置 API
- ✅ 备份管理 API
- ✅ 权限控制

## 故障排查

### 问题1：配置更新后未生效

**症状：**修改配置后，应用仍使用旧配置

**解决方案：**
1. 检查是否设置 `apply_immediately=true`
2. 手动调用重载 API：`POST /api/v1/system-config/reload`
3. 重启应用服务器

### 问题2：配置验证失败

**症状：**保存配置时提示验证错误

**解决方案：**
1. 查看具体错误信息
2. 检查必需配置项是否存在
3. 验证数值类型配置的格式
4. 确认布尔值使用 `true`/`false`

### 问题3：无法恢复备份

**症状：**从备份恢复时报错

**解决方案：**
1. 检查备份文件是否存在
2. 验证文件权限
3. 尝试恢复默认配置：`POST /api/v1/system-config/restore/defaults`

### 问题4：敏感信息泄露

**症状：**API 返回明文敏感信息

**解决方案：**
1. 默认情况下敏感信息会被遮蔽
2. 检查是否错误设置了 `show_sensitive=true`
3. 确保前端不在日志中输出配置

## 安全建议

1. **限制访问权限**
   - 仅管理员可访问配置管理功能
   - 使用 JWT 认证保护 API

2. **敏感信息保护**
   - 默认遮蔽所有敏感配置
   - 日志中不记录敏感值
   - 导出配置时提示风险

3. **配置备份**
   - 定期备份配置文件
   - 保留足够的历史版本
   - 备份文件加密存储（可选）

4. **验证机制**
   - 保存前强制验证
   - 阻止无效配置应用
   - 记录配置变更审计日志

## 最佳实践

1. **修改配置前验证**
   - 使用验证 API 检查配置有效性
   - 在测试环境先验证后再应用到生产

2. **使用备份功能**
   - 重要变更前手动创建备份
   - 定期检查备份文件完整性

3. **文档化配置变更**
   - 记录每次配置变更的原因
   - 维护配置变更日志

4. **监控配置健康**
   - 定期运行配置验证
   - 关注警告信息
   - 及时更新默认值

## 版本历史

### v0.2.0 (2025-10-15)
- ✅ 初始实现配置同步功能
- ✅ 支持 .env 文件读写
- ✅ 配置验证机制
- ✅ 备份与恢复功能
- ✅ 敏感信息保护
- ✅ 完整的单元测试（33 tests, 87% coverage）
- ✅ 集成测试覆盖
- ✅ 前端管理页面

## 相关文档

- [系统架构文档](ARCHITECTURE.md)
- [API 文档](API.md)
- [测试文档](../backend/tests/README.md)
- [配置参考](../backend/.env.example)

## 支持

如有问题，请联系：
- GitHub Issues: https://github.com/WuChengbo-git/TechPulse/issues
- Email: 627814975@qq.com
