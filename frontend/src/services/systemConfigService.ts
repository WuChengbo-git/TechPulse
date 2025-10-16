/**
 * 系统配置服务
 * 提供前后端配置同步功能
 */
import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

export interface SystemConfig {
  [key: string]: string
}

export interface ConfigValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ConfigBackup {
  filename: string
  path: string
  created_at: number
  size: number
}

export interface ConfigUpdateRequest {
  config: SystemConfig
  apply_immediately?: boolean
}

class SystemConfigService {
  private apiUrl: string

  constructor() {
    this.apiUrl = `${API_BASE_URL}/api/v1/system-config`
  }

  /**
   * 获取认证头
   */
  private getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * 获取系统配置
   */
  async getConfig(showSensitive: boolean = false): Promise<{
    config: SystemConfig
    env_file: string
    total_items: number
  }> {
    const response = await axios.get(
      `${this.apiUrl}?show_sensitive=${showSensitive}`,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * 获取所有配置键
   */
  async getConfigKeys(): Promise<{
    keys: string[]
    sensitive_keys: string[]
  }> {
    const response = await axios.get(`${this.apiUrl}/keys`, {
      headers: this.getAuthHeaders()
    })
    return response.data
  }

  /**
   * 获取单个配置项
   */
  async getConfigItem(key: string): Promise<{
    key: string
    value: string
    is_sensitive: boolean
  }> {
    const response = await axios.get(`${this.apiUrl}/item/${key}`, {
      headers: this.getAuthHeaders()
    })
    return response.data
  }

  /**
   * 更新系统配置
   */
  async updateConfig(
    config: SystemConfig,
    applyImmediately: boolean = true
  ): Promise<{
    message: string
    updated_keys: string[]
    applied: boolean
  }> {
    const response = await axios.put(
      this.apiUrl,
      {
        config,
        apply_immediately: applyImmediately
      } as ConfigUpdateRequest,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * 重载配置
   */
  async reloadConfig(): Promise<{
    message: string
    total_items: number
  }> {
    const response = await axios.post(`${this.apiUrl}/reload`, null, {
      headers: this.getAuthHeaders()
    })
    return response.data
  }

  /**
   * 验证配置
   */
  async validateConfig(): Promise<ConfigValidation> {
    const response = await axios.post(`${this.apiUrl}/validate`, null, {
      headers: this.getAuthHeaders()
    })
    return response.data
  }

  /**
   * 恢复默认配置
   */
  async restoreDefaults(): Promise<{
    message: string
    total_items: number
  }> {
    const response = await axios.post(
      `${this.apiUrl}/restore/defaults`,
      null,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * 列出所有备份
   */
  async listBackups(): Promise<{
    backups: ConfigBackup[]
  }> {
    const response = await axios.get(`${this.apiUrl}/backups`, {
      headers: this.getAuthHeaders()
    })
    return response.data
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup(backupFilename?: string): Promise<{
    message: string
    total_items: number
  }> {
    const params = backupFilename ? `?backup_filename=${backupFilename}` : ''
    const response = await axios.post(
      `${this.apiUrl}/restore/backup${params}`,
      null,
      { headers: this.getAuthHeaders() }
    )
    return response.data
  }

  /**
   * 批量更新配置项
   */
  async batchUpdate(
    updates: Array<{ key: string; value: string }>,
    applyImmediately: boolean = true
  ): Promise<{
    message: string
    updated_keys: string[]
    applied: boolean
  }> {
    const config: SystemConfig = {}
    updates.forEach(({ key, value }) => {
      config[key] = value
    })
    return this.updateConfig(config, applyImmediately)
  }

  /**
   * 导出配置（JSON格式）
   */
  async exportConfig(showSensitive: boolean = false): Promise<string> {
    const { config } = await this.getConfig(showSensitive)
    return JSON.stringify(config, null, 2)
  }

  /**
   * 导入配置
   */
  async importConfig(
    configJson: string,
    applyImmediately: boolean = false
  ): Promise<{
    message: string
    updated_keys: string[]
    applied: boolean
  }> {
    try {
      const config: SystemConfig = JSON.parse(configJson)
      return await this.updateConfig(config, applyImmediately)
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  }

  /**
   * 检查配置健康状态
   */
  async checkHealth(): Promise<{
    healthy: boolean
    validation: ConfigValidation
    total_items: number
  }> {
    try {
      const validation = await this.validateConfig()
      const { total_items } = await this.getConfig(false)

      return {
        healthy: validation.valid && validation.errors.length === 0,
        validation,
        total_items
      }
    } catch (error) {
      return {
        healthy: false,
        validation: {
          valid: false,
          errors: ['Failed to check configuration health'],
          warnings: []
        },
        total_items: 0
      }
    }
  }
}

export default new SystemConfigService()
