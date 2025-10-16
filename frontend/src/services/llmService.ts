/**
 * LLM Provider 管理服务
 * 处理 LLM 提供商和模型的 CRUD 操作
 */
import api from '../utils/api'

// ==================== 类型定义 ====================

export enum ProviderType {
  CLOUD = 'cloud',
  LOCAL = 'local'
}

export enum ProviderCategory {
  // 云端
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure_openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  // 本地
  OLLAMA = 'ollama',
  LM_STUDIO = 'lm_studio',
  LOCAL_AI = 'local_ai',
  CUSTOM = 'custom'
}

export enum ModelType {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding'
}

export interface LLMProvider {
  id: number
  user_id: number
  provider_name: string
  provider_type: ProviderType
  provider_category: ProviderCategory
  config: Record<string, any>
  is_enabled: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  last_validated_at?: string
  validation_status?: string
}

export interface LLMModel {
  id: number
  provider_id: number
  user_id: number
  model_name: string
  display_name?: string
  model_type: ModelType
  max_tokens: number
  context_window: number
  default_temperature: string
  default_top_p: string
  pricing?: {
    input_price_per_1k: number
    output_price_per_1k: number
    currency: string
  }
  is_enabled: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ProviderTemplate {
  category: ProviderCategory
  name: string
  type: ProviderType
  description: string
  config_fields: Array<{
    name: string
    type: string
    required: boolean
    label: string
    default?: string
  }>
  default_models: Array<{
    model_name: string
    display_name: string
    max_tokens: number
    context_window: number
  }>
}

export interface ProviderTemplates {
  cloud_providers: ProviderTemplate[]
  local_providers: ProviderTemplate[]
}

export interface CreateProviderData {
  provider_name: string
  provider_type: ProviderType
  provider_category: ProviderCategory
  config: Record<string, any>
  is_enabled?: boolean
  is_default?: boolean
}

export interface UpdateProviderData {
  provider_name?: string
  config?: Record<string, any>
  is_enabled?: boolean
  is_default?: boolean
}

export interface CreateModelData {
  provider_id: number
  model_name: string
  display_name?: string
  model_type?: ModelType
  max_tokens?: number
  context_window?: number
  default_temperature?: string
  default_top_p?: string
  pricing?: {
    input_price_per_1k: number
    output_price_per_1k: number
    currency: string
  }
  is_enabled?: boolean
  is_default?: boolean
}

export interface UpdateModelData {
  model_name?: string
  display_name?: string
  model_type?: ModelType
  max_tokens?: number
  context_window?: number
  default_temperature?: string
  default_top_p?: string
  pricing?: {
    input_price_per_1k: number
    output_price_per_1k: number
    currency: string
  }
  is_enabled?: boolean
  is_default?: boolean
}

export interface TestConnectionRequest {
  provider_category: ProviderCategory
  config: Record<string, any>
  test_model?: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  details?: Record<string, any>
}

// ==================== Service ====================

class LLMService {
  /**
   * 获取提供商模板
   */
  async getTemplates(): Promise<ProviderTemplates> {
    const response = await api.get('/api/v1/llm/templates')
    return response.data
  }

  /**
   * 获取提供商列表
   */
  async listProviders(): Promise<LLMProvider[]> {
    const response = await api.get('/api/v1/llm/providers')
    return response.data
  }

  /**
   * 创建提供商
   */
  async createProvider(data: CreateProviderData): Promise<LLMProvider> {
    const response = await api.post('/api/v1/llm/providers', data)
    return response.data
  }

  /**
   * 获取单个提供商
   */
  async getProvider(providerId: number): Promise<LLMProvider> {
    const response = await api.get(`/api/v1/llm/providers/${providerId}`)
    return response.data
  }

  /**
   * 更新提供商
   */
  async updateProvider(providerId: number, data: UpdateProviderData): Promise<LLMProvider> {
    const response = await api.put(`/api/v1/llm/providers/${providerId}`, data)
    return response.data
  }

  /**
   * 删除提供商
   */
  async deleteProvider(providerId: number): Promise<void> {
    await api.delete(`/api/v1/llm/providers/${providerId}`)
  }

  /**
   * 获取提供商的模型列表
   */
  async listModels(providerId: number): Promise<LLMModel[]> {
    const response = await api.get(`/api/v1/llm/providers/${providerId}/models`)
    return response.data
  }

  /**
   * 为提供商添加模型
   */
  async createModel(data: CreateModelData): Promise<LLMModel> {
    const response = await api.post(`/api/v1/llm/providers/${data.provider_id}/models`, data)
    return response.data
  }

  /**
   * 更新模型
   */
  async updateModel(modelId: number, data: UpdateModelData): Promise<LLMModel> {
    const response = await api.put(`/api/v1/llm/models/${modelId}`, data)
    return response.data
  }

  /**
   * 删除模型
   */
  async deleteModel(modelId: number): Promise<void> {
    await api.delete(`/api/v1/llm/models/${modelId}`)
  }

  /**
   * 测试提供商连接
   */
  async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    const response = await api.post('/api/v1/llm/test-connection', data)
    return response.data
  }
}

export default new LLMService()
