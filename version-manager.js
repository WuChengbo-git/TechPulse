#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

/**
 * TechPulse 版本管理工具
 * 用于统一管理项目中所有文件的版本号
 */

class VersionManager {
  constructor() {
    this.projectRoot = process.cwd()
    this.currentVersion = '0.1.3'
    this.buildDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    // 需要更新版本号的文件配置
    this.files = [
      {
        path: 'version.json',
        type: 'json',
        fields: ['version']
      },
      {
        path: 'frontend/package.json', 
        type: 'json',
        fields: ['version']
      },
      {
        path: 'frontend/src/components/VersionInfo.tsx',
        type: 'typescript',
        pattern: /const version = '[^']*'/g,
        replacement: `const version = '${this.currentVersion}'`
      },
      {
        path: 'frontend/src/components/VersionInfo.tsx',
        type: 'typescript', 
        pattern: /const build = '[^']*'/g,
        replacement: `const build = '${this.buildDate}'`
      }
    ]
  }

  /**
   * 更新 JSON 文件中的版本号
   */
  updateJsonFile(filePath, fields) {
    const fullPath = path.join(this.projectRoot, filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  文件不存在: ${filePath}`)
      return false
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      const data = JSON.parse(content)
      
      let updated = false
      fields.forEach(field => {
        if (data[field] !== this.currentVersion) {
          const oldVersion = data[field]
          data[field] = this.currentVersion
          console.log(`📝 更新 ${filePath}: ${field} ${oldVersion} -> ${this.currentVersion}`)
          updated = true
        }
      })

      if (updated) {
        fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + '\n')
        return true
      }
      
      console.log(`✓ ${filePath} 版本号已是最新`)
      return true
    } catch (error) {
      console.error(`❌ 更新 ${filePath} 失败:`, error.message)
      return false
    }
  }

  /**
   * 更新 TypeScript/JavaScript 文件中的版本号
   */
  updateTextFile(filePath, pattern, replacement) {
    const fullPath = path.join(this.projectRoot, filePath)
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  文件不存在: ${filePath}`)
      return false
    }

    try {
      let content = fs.readFileSync(fullPath, 'utf8')
      const originalContent = content
      
      content = content.replace(pattern, replacement)
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content)
        console.log(`📝 更新 ${filePath} 中的版本信息`)
        return true
      }
      
      console.log(`✓ ${filePath} 版本信息已是最新`)
      return true
    } catch (error) {
      console.error(`❌ 更新 ${filePath} 失败:`, error.message)
      return false
    }
  }

  /**
   * 更新主版本配置文件
   */
  updateVersionJson() {
    const versionData = {
      version: this.currentVersion,
      build: this.buildDate,
      codename: 'TechPulse Enhanced',
      releaseDate: new Date().toISOString().slice(0, 10),
      description: 'Enhanced UI improvements with multi-language support and API configuration management'
    }

    const fullPath = path.join(this.projectRoot, 'version.json')
    
    try {
      fs.writeFileSync(fullPath, JSON.stringify(versionData, null, 2) + '\n')
      console.log(`📝 更新主版本文件: version.json`)
      return true
    } catch (error) {
      console.error('❌ 更新 version.json 失败:', error.message)
      return false
    }
  }

  /**
   * 更新 RELEASE.md 文件
   */
  updateReleaseNotes() {
    const releaseContent = `# TechPulse Release Notes

## Version ${this.currentVersion} - Enhanced UI & Language Support
**发布日期**: ${new Date().toISOString().slice(0, 10)}

### 🎯 本版本更新概览
TechPulse 持续改进，本版本主要聚焦于用户界面优化和多语言支持完善。

### 🚀 新增功能

#### 1. 专门的数据源管理页面
- **GitHub 页面**: 专门的 GitHub 仓库管理界面
  - 仓库列表展示和筛选
  - 语言分布统计
  - Trending 预览功能
  - 更新历史记录

- **arXiv 页面**: 学术论文管理界面
  - 论文分类展示
  - 研究领域统计
  - 关键词搜索
  - 作者信息展示

- **Hugging Face 页面**: AI模型管理界面
  - 模型任务分类
  - 下载量统计
  - 流行度趋势
  - 标签云展示

- **Zenn 页面**: 日本技术社区内容管理
  - 文章类型分类
  - 作者排行榜
  - 热门标签统计
  - 点赞数排序

#### 2. 完善的 API 配置管理
- **数据源配置**: 每个数据源独立的详细配置
- **GitHub 设置**: 编程语言、主题、过滤条件配置
- **arXiv 设置**: 研究分野、关键词、获取设置
- **Hugging Face 设置**: Pipeline任务、模型类型、语言支持
- **Zenn 设置**: 兴趣主题、质量过滤、内容类型
- **自动调度**: 定时任务配置和时区设置

#### 3. 多语言支持完善
- **完整的中日双语**: 所有界面文本支持中文和日语
- **一致的语言体验**: 解决了语言切换时的混乱问题
- **翻译覆盖**: 页面标题、按钮、标签、提示信息全覆盖
- **动态切换**: 实时语言切换不需要刷新页面

### 🛠 技术改进

#### 1. 组件架构优化
- **模块化页面**: 每个数据源独立的页面组件
- **统一的翻译系统**: 扩展 LanguageContext 支持更多翻译项
- **类型安全**: 完善的 TypeScript 类型定义
- **组件复用**: 通用组件的抽取和复用

#### 2. 用户体验提升
- **响应式设计**: 更好的移动端和桌面端适配
- **加载状态**: 完善的加载和错误状态处理
- **交互反馈**: 更流畅的用户交互体验
- **视觉统一**: 统一的设计语言和视觉风格

### 📱 界面改进

#### 1. 侧边栏导航
- **清晰的层级结构**: 主菜单和子菜单分级明确
- **图标标识**: 每个数据源都有专属图标
- **状态指示**: 当前选中页面的高亮显示
- **折叠支持**: 支持侧边栏折叠和展开

#### 2. 数据展示
- **卡片式布局**: 统一的卡片式内容展示
- **筛选功能**: 多维度的数据筛选和搜索
- **分页处理**: 大量数据的分页展示
- **排序功能**: 多种排序方式支持

#### 3. 配置界面
- **选项卡设计**: 清晰的配置分类
- **表单验证**: 完善的输入验证和错误提示
- **实时预览**: 配置更改的实时预览效果
- **保存状态**: 配置保存状态的明确反馈

### 🔧 开发工具

#### 1. 版本管理系统
- **自动化版本管理**: 统一管理项目版本号
- **批量更新**: 一键更新所有相关文件的版本信息
- **构建信息**: 自动生成构建日期和版本描述
- **发布记录**: 自动维护版本发布记录

#### 2. 代码质量
- **ESLint 规则**: 严格的代码规范检查
- **TypeScript**: 完整的类型安全保障
- **组件测试**: 重要组件的单元测试
- **错误边界**: 完善的错误处理机制

### 🐛 问题修复
- 修复了多语言切换时的文本混乱问题
- 解决了 Ant Design 图标导入错误
- 修复了 Tag 组件的属性使用错误
- 优化了 TypeScript 类型定义错误
- 改进了页面路由配置

### ⚡ 性能优化
- **代码分割**: 按页面进行代码分割加载
- **懒加载**: 图片和组件的懒加载优化
- **缓存策略**: 更好的浏览器缓存利用
- **包大小**: 优化了前端资源包大小

### 📊 数据统计
- **用户行为**: 增加了页面访问和功能使用统计
- **性能监控**: 前端性能指标监控
- **错误跟踪**: 前端错误自动收集和报告
- **使用分析**: 功能使用频率分析

### 🔐 安全性
- **输入过滤**: 更严格的用户输入过滤
- **XSS 防护**: 跨站脚本攻击防护
- **API 安全**: 接口调用安全验证
- **数据脱敏**: 敏感数据显示脱敏处理

### 🌐 国际化
- **多语言扩展**: 为支持更多语言做准备
- **本地化**: 日期、数字格式的本地化显示
- **RTL 支持**: 为未来支持阿拉伯语等 RTL 语言预留
- **时区处理**: 更好的时区转换和显示

### 📝 文档完善
- **API 文档**: 完善的接口文档
- **组件文档**: 前端组件使用文档
- **部署指南**: 详细的部署和配置指南
- **开发指南**: 开发环境搭建和代码贡献指南

### 🔄 版本兼容
- **向后兼容**: 保持与旧版本的接口兼容
- **平滑升级**: 支持从旧版本平滑升级
- **数据迁移**: 自动处理数据结构变更
- **配置兼容**: 旧版本配置文件的自动转换

---

**TechPulse Team**  
持续改进，让技术洞察更加精准 🎯`

    const fullPath = path.join(this.projectRoot, 'RELEASE.md')
    
    try {
      fs.writeFileSync(fullPath, releaseContent)
      console.log(`📝 更新发布说明: RELEASE.md`)
      return true
    } catch (error) {
      console.error('❌ 更新 RELEASE.md 失败:', error.message)
      return false
    }
  }

  /**
   * 执行版本更新
   */
  async updateVersion() {
    console.log(`🚀 开始更新版本到 ${this.currentVersion}`)
    console.log(`📅 构建日期: ${this.buildDate}`)
    console.log('━'.repeat(50))

    let successCount = 0
    let totalCount = 0

    // 更新主版本文件
    if (this.updateVersionJson()) {
      successCount++
    }
    totalCount++

    // 更新发布说明
    if (this.updateReleaseNotes()) {
      successCount++
    }
    totalCount++

    // 更新各个配置文件
    for (const file of this.files) {
      totalCount++
      
      if (file.type === 'json') {
        if (this.updateJsonFile(file.path, file.fields)) {
          successCount++
        }
      } else if (file.type === 'typescript') {
        if (this.updateTextFile(file.path, file.pattern, file.replacement)) {
          successCount++
        }
      }
    }

    console.log('━'.repeat(50))
    console.log(`✅ 版本更新完成: ${successCount}/${totalCount} 个文件更新成功`)
    
    if (successCount === totalCount) {
      console.log(`🎉 所有文件已成功更新到版本 ${this.currentVersion}`)
      this.showVersionInfo()
    } else {
      console.log(`⚠️  部分文件更新失败，请检查上述错误信息`)
    }
  }

  /**
   * 显示当前版本信息
   */
  showVersionInfo() {
    console.log('\n📋 当前版本信息:')
    console.log(`   版本号: ${this.currentVersion}`)
    console.log(`   构建日期: ${this.buildDate}`)
    console.log(`   发布日期: ${new Date().toISOString().slice(0, 10)}`)
    console.log('   代号: TechPulse Enhanced')
  }

  /**
   * 验证版本格式
   */
  validateVersion(version) {
    const semverRegex = /^\d+\.\d+\.\d+$/
    return semverRegex.test(version)
  }
}

// CLI 使用
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0]

  if (command === '--version' || command === '-v') {
    console.log('TechPulse 版本管理工具 v1.0.0')
    process.exit(0)
  }

  if (command === '--help' || command === '-h') {
    console.log(`
TechPulse 版本管理工具

使用方法:
  node version-manager.js [选项]

选项:
  -h, --help     显示帮助信息
  -v, --version  显示工具版本
  
示例:
  node version-manager.js              # 更新到默认版本 0.1.3
`)
    process.exit(0)
  }

  const manager = new VersionManager()
  
  if (args[0]) {
    if (manager.validateVersion(args[0])) {
      manager.currentVersion = args[0]
    } else {
      console.error('❌ 无效的版本号格式，请使用 x.y.z 格式')
      process.exit(1)
    }
  }

  manager.updateVersion()
}

module.exports = VersionManager