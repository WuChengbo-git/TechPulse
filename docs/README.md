# 📚 TechPulse 文档中心

> **最后更新**: 2025-10-14
> **当前版本**: v0.2.1

欢迎来到 TechPulse 文档中心！这里汇集了所有项目相关的文档和资料。

---

## 🗂️ 文档结构

文档已按类别组织到不同文件夹中，方便查阅：

```
docs/
├── README.md              # 本文件（文档导航）
├── RELEASE.md            # 版本发布历史
├── planning/             # 规划类文档
├── implementation/       # 功能实现文档
├── system/              # 系统技术文档
└── archived/            # 历史归档文档
```

---

## 📋 规划类文档 (`planning/`)

项目愿景、产品规划和开发进度追踪。

### 核心规划
- **[PRODUCT_ROADMAP.md](planning/PRODUCT_ROADMAP.md)** ⭐
  - 产品愿景和定位
  - 三层架构设计（基础层/进阶层/智能层）
  - 数据源策略
  - 商业化方向
  - 19KB | 产品设计必读

- **[FEATURE_ROADMAP.md](planning/FEATURE_ROADMAP.md)** 🔥
  - 详细的功能规划和优先级（P0-P3）
  - 技术方案和验收标准
  - 技术债务清单
  - 版本发布检查清单
  - 27KB | 开发路线图

- **[IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md)** ⚡
  - 当前开发进度
  - 已完成功能清单
  - 本周/下周任务
  - 数据统计和质量分析
  - 8KB | 实时进度追踪

---

## 🔧 功能实现文档 (`implementation/`)

P0-P3 各阶段功能的设计和实现总结。

### P0 阶段（基础优化）
- **[P0_OPTIMIZATION_SUMMARY.md](implementation/P0_OPTIMIZATION_SUMMARY.md)**
  - 数据质量优化（高质量占比 2.7%→13.4%）
  - 数据源健康监控系统
  - 前端性能优化（React Query）
  - 移动端响应式适配
  - 6KB | 优化成果总结

### P1 阶段（智能推荐）
- **[P1_SMART_SEARCH_DESIGN.md](implementation/P1_SMART_SEARCH_DESIGN.md)**
  - 智能搜索栏设计（关键词+AI问答）
  - 基于标签的推荐算法
  - 用户行为日志系统
  - UI/UX交互设计
  - 9KB | 设计文档

- **[P1_IMPLEMENTATION_SUMMARY.md](implementation/P1_IMPLEMENTATION_SUMMARY.md)**
  - 后端API实现（100%完成）
  - 数据库设计（3个新表）
  - 推荐算法实现
  - 前端组件清单
  - 11KB | 实现总结

---

## 🛠️ 系统技术文档 (`system/`)

系统架构、部署、开发环境和核心功能实现。

### 开发指南
- **[SETUP_GUIDE.md](system/SETUP_GUIDE.md)**
  - 前后端环境配置
  - 依赖安装
  - 数据库初始化
  - 7KB | 新手必读

- **[project-structure.md](system/project-structure.md)**
  - 代码组织结构
  - 模块说明
  - 4KB | 代码导航

- **[DEPLOYMENT_GUIDE.md](system/DEPLOYMENT_GUIDE.md)**
  - 生产环境部署
  - Docker配置
  - 服务器配置
  - 11KB | 部署手册

### 功能实现
- **[AUTH_COMPLETE.md](system/AUTH_COMPLETE.md)**
  - 用户认证系统（JWT + Argon2）
  - 注册/登录流程
  - Token管理
  - 10KB | 认证系统文档

- **[SETTINGS_IMPLEMENTATION.md](system/SETTINGS_IMPLEMENTATION.md)**
  - 系统设置页面
  - AI模型配置
  - 任务管理
  - 系统监控
  - 12KB | 系统管理文档

---

## 📦 归档文档 (`archived/`)

历史技术实现记录，具有参考价值：

- [language-detection.md](archived/language-detection.md) - 多语言自动检测方案
- [simple-language-switch.md](archived/simple-language-switch.md) - 简单语言切换实现
- [personalization-v1.md](archived/personalization-v1.md) - 初版个性化推荐
- [optimization-guide.md](archived/optimization-guide.md) - 性能优化经验
- [version-tools.md](archived/version-tools.md) - 版本号管理工具

---

## 🚀 快速开始

### 我是新手，想要...
1. **开始开发** → 阅读 [SETUP_GUIDE.md](system/SETUP_GUIDE.md)
2. **了解项目** → 阅读 [PRODUCT_ROADMAP.md](planning/PRODUCT_ROADMAP.md)
3. **查看进度** → 阅读 [IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md)

### 我是开发者，想要...
1. **查看功能规划** → [FEATURE_ROADMAP.md](planning/FEATURE_ROADMAP.md)
2. **了解某个功能实现** → 查看 `implementation/` 文件夹
3. **部署到服务器** → [DEPLOYMENT_GUIDE.md](system/DEPLOYMENT_GUIDE.md)

### 我是产品经理，想要...
1. **了解产品愿景** → [PRODUCT_ROADMAP.md](planning/PRODUCT_ROADMAP.md)
2. **查看开发进度** → [IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md)
3. **查看版本历史** → [RELEASE.md](RELEASE.md)

---

## 🔍 按需求查找

### 功能相关
- 🔐 **用户认证** → [AUTH_COMPLETE.md](system/AUTH_COMPLETE.md)
- ⚙️ **系统管理** → [SETTINGS_IMPLEMENTATION.md](system/SETTINGS_IMPLEMENTATION.md)
- 🔍 **智能搜索** → [P1_SMART_SEARCH_DESIGN.md](implementation/P1_SMART_SEARCH_DESIGN.md)
- 💡 **推荐系统** → [P1_IMPLEMENTATION_SUMMARY.md](implementation/P1_IMPLEMENTATION_SUMMARY.md)

### 技术相关
- 📦 **部署指南** → [DEPLOYMENT_GUIDE.md](system/DEPLOYMENT_GUIDE.md)
- 🏗️ **项目结构** → [project-structure.md](system/project-structure.md)
- ⚡ **性能优化** → [P0_OPTIMIZATION_SUMMARY.md](implementation/P0_OPTIMIZATION_SUMMARY.md)

### 规划相关
- 🎯 **产品规划** → [PRODUCT_ROADMAP.md](planning/PRODUCT_ROADMAP.md)
- 📊 **功能路线图** → [FEATURE_ROADMAP.md](planning/FEATURE_ROADMAP.md)
- ✅ **开发进度** → [IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md)

---

## 📊 文档统计

| 分类 | 文件数 | 总大小 | 说明 |
|------|--------|--------|------|
| 规划类 | 3 | ~53KB | 产品和功能规划 |
| 实现类 | 3 | ~26KB | 功能设计和实现 |
| 系统类 | 5 | ~44KB | 技术文档和指南 |
| 归档类 | 5 | ~15KB | 历史参考文档 |
| **总计** | **16** | **~138KB** | 完整文档体系 |

---

## 🎯 当前开发状态

**版本**: v0.2.1
**阶段**: P1 功能开发中
**进度**:
- ✅ P0 基础优化（95%）
- 🔄 P1 智能搜索+推荐（后端100%，前端待集成）
- ⏳ P2 RAG问答系统（规划中）

详细进度请查看 [IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md)

---

## 📝 文档贡献指南

### 添加新文档
1. 确定文档类型（规划/实现/系统/归档）
2. 放入对应的文件夹
3. 更新本 README.md 的索引
4. 更新 IMPLEMENTATION_STATUS.md 记录变更

### 文档命名规范
- 规划类：`XXX_ROADMAP.md` 或 `XXX_STATUS.md`
- 实现类：`P{N}_{FEATURE}_DESIGN.md` 或 `SUMMARY.md`
- 系统类：`{MODULE}_IMPLEMENTATION.md` 或 `{GUIDE}.md`
- 归档类：小写加连字符 `feature-name.md`

### 文档格式模板
```markdown
# 文档标题

> **最后更新**: YYYY-MM-DD
> **版本**: vX.Y.Z
> **维护者**: 姓名

## 目录
...

## 内容
...

---

**最后更新**: YYYY-MM-DD
```

---

## 📌 重要链接

### 项目相关
- **项目主页**: GitHub Repository
- **API文档**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **前端应用**: [http://localhost:5174](http://localhost:5174)
- **后端服务**: [http://localhost:8000](http://localhost:8000)

### 外部资源
- [FastAPI官方文档](https://fastapi.tiangolo.com/)
- [React官方文档](https://react.dev/)
- [Ant Design组件库](https://ant.design/)

---

## 🤝 联系方式

如有任何文档问题或建议，欢迎：
- 提交 GitHub Issue
- 联系项目维护者
- 参与文档贡献

---

## 📚 推荐阅读顺序

### 第一次接触项目
1. [README.md](../README.md) - 项目简介
2. [PRODUCT_ROADMAP.md](planning/PRODUCT_ROADMAP.md) - 产品愿景
3. [SETUP_GUIDE.md](system/SETUP_GUIDE.md) - 环境配置

### 开始开发
1. [project-structure.md](system/project-structure.md) - 代码结构
2. [FEATURE_ROADMAP.md](planning/FEATURE_ROADMAP.md) - 功能规划
3. [IMPLEMENTATION_STATUS.md](planning/IMPLEMENTATION_STATUS.md) - 当前进度

### 深入了解某个功能
1. 查看 `planning/` 中的规划文档
2. 查看 `implementation/` 中的设计和实现文档
3. 查看 `system/` 中的技术实现细节

---

**最后更新**: 2025-10-14
**维护者**: TechPulse Team
**文档版本**: v2.0
