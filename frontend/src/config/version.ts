/**
 * 统一版本号管理
 *
 * 该文件从 package.json 读取版本号，确保全项目版本号统一。
 *
 * 使用方法:
 * import { APP_VERSION, BUILD_DATE, VERSION_INFO } from '@/config/version'
 *
 * 更新版本号时，只需要修改 package.json 中的 version 字段即可。
 */

import packageJson from '../../package.json'

// 从 package.json 读取版本号
export const APP_VERSION = packageJson.version

// 自动生成构建日期（格式：YYYYMMDD）
export const BUILD_DATE = new Date().toISOString().slice(0, 10).replace(/-/g, '')

// 版本代号（可以手动维护，或从环境变量读取）
export const VERSION_CODENAME = import.meta.env.VITE_VERSION_CODENAME || 'TechPulse'

// 完整的版本信息对象
export const VERSION_INFO = {
  version: APP_VERSION,
  build: BUILD_DATE,
  codename: VERSION_CODENAME,
  fullVersion: `${APP_VERSION} (${BUILD_DATE})`
} as const

// 默认导出
export default VERSION_INFO
