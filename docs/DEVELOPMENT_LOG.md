# TechPulse 开发日志

本文档记录 TechPulse 项目的开发历程和重要技术决策。

## 2025-10-07

### 用户账号管理
- 删除了测试用户账号 `w357771580` (ID: 2, Email: wuchengbo999@gmail.com)
- 通过 Python 脚本直接操作 SQLAlchemy 数据库完成删除

### 功能讨论
- 讨论了"忘记密码"功能的实现方案
- 确定技术方案：邮箱验证码 + 密码重置流程
- 预计工作量：2-4 小时

### 项目结构整理
- 创建了 `docs/FUTURE_FEATURES.md` 记录待开发功能
- 整理根目录文件结构，符合开源项目规范
- 文档整理：
  - 将 10 个 Markdown 文档移至 `docs/` 目录
  - 包括：认证集成指南、部署指南、优化指南、设置指南等
- 脚本整理：
  - 将 11 个脚本文件移至 `scripts/` 目录
  - 包括：翻译生成脚本、Mock API、版本管理脚本、Shell 脚本等
- 配置整理：
  - 将版本配置文件移至 `scripts/` 目录

---

## 2025-10-04

### Version 0.1.8 发布
- 全面升级多语言系统，完整支持中、英、日三语言
- 实现 AI 驱动的实时标签翻译功能（OpenAI GPT-3.5-turbo）
- 添加用户认证系统（JWT + bcrypt）
- 完成所有页面的国际化翻译（180+ 翻译键值）

### 技术亮点
- 双层缓存机制（后端 + 前端）优化翻译性能
- RESTful API 翻译服务 `/api/v1/translate`
- TypeScript 类型安全的翻译系统

---

## 2025-09-24

### Version 0.1.7 发布
- 新增趋势分析页面
- 编程语言活跃度分析功能
- AI 领域趋势追踪
- LLM 模型对比可视化

### 数据可视化
- 集成 @ant-design/charts
- 支持多种图表类型（柱状图、折线图、饼图、雷达图）
- 实现交互式图表操作

---

## 2025-09-16

### Version 0.1.6 发布
- 系统性能优化
- 加载速度提升
- 实现智能数据缓存机制
- 改进移动端响应式设计

### 代码质量改进
- 完善 TypeScript 类型定义
- 添加性能监控
- 优化内存使用

---

## 2025-09-09

### Version 0.1.5 发布
- 简化语言系统，统一使用中文界面
- 修复所有数据源页面功能问题
- 统一 TechCard 数据结构

### 页面修复
- arXiv 页面：修复 PDF 链接生成和按钮功能
- GitHub 页面：修复查看按钮点击问题
- HuggingFace 页面：修复 TypeScript 错误
- Zenn 页面：完善文章链接和数据适配

---

## 2025-09-02

### Version 0.1.4 发布
- 完善国际化体验
- 修复中日文混用问题
- Timeline 组件布局优化
- Antd 组件升级到 5.x

---

## 2025-09-01

### Version 0.1.3 发布
- 新增专门的数据源管理页面（GitHub、arXiv、HuggingFace、Zenn）
- 完善 API 配置管理
- 实现中日双语完整支持
- 优化组件架构

### 开发工具
- 实现自动化版本管理系统
- 添加代码质量检查（ESLint + TypeScript）

---

## 技术栈

### 前端
- React 18 + TypeScript
- Ant Design 5.x
- @ant-design/charts (数据可视化)
- React Router
- i18n (多语言支持)

### 后端
- FastAPI (Python)
- SQLAlchemy (ORM)
- JWT (认证)
- bcrypt (密码加密)
- OpenAI API (AI 翻译)

### 数据库
- SQLite (开发环境)
- 支持 PostgreSQL/MySQL (生产环境)

### 工具
- Python 脚本自动化
- Shell 脚本部署
- Git 版本控制

---

## 架构决策

### 多语言系统
- **v0.1.3-0.1.4**: 中日双语支持
- **v0.1.5**: 简化为纯中文（降低复杂度）
- **v0.1.8**: 全面升级为中英日三语言 + AI 翻译

### 数据结构
- 统一使用 TechCard 接口
- 规范化字段映射（original_url, summary, chinese_tags）
- 确保新老数据格式兼容

### 按钮交互
- 从 `href` 属性迁移到 `onClick` 事件
- 使用 `window.open()` 确保新窗口打开
- 完善错误提示和用户反馈

---

## 未来规划

详见 [FUTURE_FEATURES.md](./FUTURE_FEATURES.md)

### 高优先级
1. 忘记密码功能（邮箱验证码重置）
2. 多语言翻译完善

### 中优先级
1. 数据源管理优化
2. 批量导入/导出功能

### 低优先级
1. 通知系统（WebSocket + 邮件）
2. 数据分析仪表板

---

## 贡献者

- **开发团队**: TechPulse Team
- **技术支持**: Claude AI Assistant

---

**最后更新**: 2025-10-07
