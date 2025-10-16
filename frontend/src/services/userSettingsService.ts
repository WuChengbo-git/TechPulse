/**
 * 用户设置服务
 * 处理用户个人设置的获取、更新和验证
 */
import api from '../utils/api'

// 类型定义
export interface OpenAIConfig {
  api_key?: string
  model?: string
  base_url?: string
  organization?: string
}

export interface AzureOpenAIConfig {
  api_key?: string
  endpoint?: string
  deployment?: string
  api_version?: string
}

export interface OllamaConfig {
  server_url?: string
  model?: string
}

export interface NotionConfig {
  api_token?: string
  database_id?: string
  sync_frequency?: string
}

export interface PersonalizationConfig {
  enable_recommendation?: boolean
  recommendation_algorithm?: string
  enable_behavior_tracking?: boolean
  show_recommendation_reason?: boolean
  anonymous_mode?: boolean
}

export interface UserPreferences {
  preferred_language?: string
  theme_mode?: string
  items_per_page?: number
}

export interface UserSettings {
  openai?: OpenAIConfig
  azure?: AzureOpenAIConfig
  ollama?: OllamaConfig
  notion?: NotionConfig
  personalization?: PersonalizationConfig
  preferences?: UserPreferences
}

export interface ValidationResult {
  success: boolean
  message: string
  model?: string
  error?: string
}

export interface UserSettingsUpdate {
  openai?: OpenAIConfig
  azure?: AzureOpenAIConfig
  ollama?: OllamaConfig
  notion?: NotionConfig
  personalization?: PersonalizationConfig
  preferences?: UserPreferences
}

class UserSettingsService {
  /**
   * 获取用户设置
   */
  async getSettings(): Promise<UserSettings> {
    const response = await api.get('/api/v1/user-settings')
    return response.data
  }

  /**
   * 更新用户设置
   */
  async updateSettings(settings: UserSettingsUpdate): Promise<{
    message: string
    validation?: ValidationResult
  }> {
    const response = await api.put('/api/v1/user-settings', settings)
    return response.data
  }

  /**
   * 测试 Azure OpenAI 配置
   */
  async testAzureConfig(config: AzureOpenAIConfig): Promise<ValidationResult> {
    const response = await api.post('/api/v1/user-settings/test-azure-config', config)
    return response.data
  }

  /**
   * 获取 AI 配置状态
   */
  async getAIConfigStatus(): Promise<{
    status: {
      user_config_exists: boolean
      global_config_exists: boolean
      env_config_exists: boolean
      active_source: string | null
      is_configured: boolean
    }
    active_config: {
      source: string
      endpoint: string
      deployment: string
      api_version: string
      has_api_key: boolean
    } | null
    message: string
  }> {
    const response = await api.get('/api/v1/user-settings/ai-config-status')
    return response.data
  }
}

export default new UserSettingsService()
