# TechPulse 文档中心

> TechPulse - AI技術情報の可視化ダッシュボード

## 📚 文档导航

### 核心文档
- [开发路线图 (ROADMAP.md)](./ROADMAP.md) - 功能规划和开发计划
- [变更日志 (CHANGELOG_v0.5.0.md)](./CHANGELOG_v0.5.0.md) - 版本更新记录
- [版本管理 (VERSION_MANAGEMENT.md)](./VERSION_MANAGEMENT.md) - 版本发布指南
- [发布指南 (RELEASE.md)](./RELEASE.md) - 正式发布流程

### 功能文档
- [新功能总结 (NEW_FEATURES_SUMMARY.md)](./NEW_FEATURES_SUMMARY.md) - 最新功能说明
- [加载更多功能 (LOAD_MORE_FEATURE_SUMMARY.md)](./LOAD_MORE_FEATURE_SUMMARY.md) - 分页加载说明

### 技术文档
- [项目文件结构 (项目文件结构说明.md)](./项目文件结构说明.md) - 代码组织结构

### 规划文档
- [功能路线图 (planning/FEATURE_ROADMAP.md)](./planning/FEATURE_ROADMAP.md)
- [产品路线图 (planning/PRODUCT_ROADMAP.md)](./planning/PRODUCT_ROADMAP.md)
- [实现状态 (planning/IMPLEMENTATION_STATUS.md)](./planning/IMPLEMENTATION_STATUS.md)

### 实现文档
- [P0性能优化 (implementation/P0_PERFORMANCE_OPTIMIZATION.md)](./implementation/P0_PERFORMANCE_OPTIMIZATION.md)
- [P1智能搜索设计 (implementation/P1_SMART_SEARCH_DESIGN.md)](./implementation/P1_SMART_SEARCH_DESIGN.md)

### 归档文档
- [历史文档 (archived/)](./archived/) - 旧版本文档
- [已完成功能 (archived_old/)](./archived_old/) - 已归档的功能文档

---

## 🚀 快速开始

如果你是新贡献者，建议按以下顺序阅读：

1. 📖 [项目文件结构说明](./项目文件结构说明.md) - 了解代码组织
2. 🗺️ [开发路线图](./ROADMAP.md) - 了解当前状态和未来规划
3. 📋 [功能路线图](./planning/FEATURE_ROADMAP.md) - 了解具体功能计划
4. 📝 [变更日志](./CHANGELOG_v0.5.0.md) - 了解最新变更

---

## 📂 目录结构

```
docs/
├── README.md                          # 本文件
├── ROADMAP.md                         # 开发路线图
├── CHANGELOG_v0.5.0.md               # 变更日志
├── VERSION_MANAGEMENT.md             # 版本管理
├── RELEASE.md                        # 发布指南
├── NEW_FEATURES_SUMMARY.md           # 新功能总结
├── LOAD_MORE_FEATURE_SUMMARY.md      # 加载更多功能
├── 项目文件结构说明.md                # 项目结构
├── planning/                          # 规划文档
│   ├── FEATURE_ROADMAP.md
│   ├── PRODUCT_ROADMAP.md
│   └── IMPLEMENTATION_STATUS.md
├── implementation/                    # 实现文档
│   ├── P0_PERFORMANCE_OPTIMIZATION.md
│   └── P1_SMART_SEARCH_DESIGN.md
├── archived/                          # 归档文档
│   └── ...
└── archived_old/                      # 旧版本归档
    └── ...
```

---

## 🔄 文档更新规范

### 何时更新文档
- 添加新功能时
- 修复重要Bug时
- 版本发布时
- API变更时

### 如何更新文档
1. 在对应的文档中添加说明
2. 更新 `CHANGELOG_v0.5.0.md`
3. 如果是重大变更，更新 `ROADMAP.md`
4. 提交时在commit message中注明 `docs: 更新XXX文档`

---

## 📝 文档编写建议

1. **清晰明了**: 使用简洁的语言，避免歧义
2. **结构化**: 使用标题、列表、代码块等组织内容
3. **示例丰富**: 提供代码示例和截图
4. **保持更新**: 代码变更时同步更新文档
5. **中英文**: 核心文档提供中英文版本

---

## 🤝 贡献

欢迎贡献文档！如果你发现文档有误或需要补充，请：

1. 提交Issue说明问题
2. 或者直接提交PR修改

---

**最后更新**: 2025-11-10
**维护者**: WuChengbo-git
