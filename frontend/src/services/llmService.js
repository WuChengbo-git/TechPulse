/**
 * LLM Provider 管理服务
 * 处理 LLM 提供商和模型的 CRUD 操作
 */
import api from '../utils/api';
// ==================== 类型定义 ====================
export var ProviderType;
(function (ProviderType) {
    ProviderType["CLOUD"] = "cloud";
    ProviderType["LOCAL"] = "local";
})(ProviderType || (ProviderType = {}));
export var ProviderCategory;
(function (ProviderCategory) {
    // 云端
    ProviderCategory["OPENAI"] = "openai";
    ProviderCategory["AZURE_OPENAI"] = "azure_openai";
    ProviderCategory["ANTHROPIC"] = "anthropic";
    ProviderCategory["GOOGLE"] = "google";
    ProviderCategory["COHERE"] = "cohere";
    ProviderCategory["MISTRAL"] = "mistral";
    // 本地
    ProviderCategory["OLLAMA"] = "ollama";
    ProviderCategory["LM_STUDIO"] = "lm_studio";
    ProviderCategory["LOCAL_AI"] = "local_ai";
    ProviderCategory["CUSTOM"] = "custom";
})(ProviderCategory || (ProviderCategory = {}));
export var ModelType;
(function (ModelType) {
    ModelType["CHAT"] = "chat";
    ModelType["COMPLETION"] = "completion";
    ModelType["EMBEDDING"] = "embedding";
})(ModelType || (ModelType = {}));
// ==================== Service ====================
class LLMService {
    /**
     * 获取提供商模板
     */
    async getTemplates() {
        const response = await api.get('/api/v1/llm/templates');
        return response.data;
    }
    /**
     * 获取提供商列表
     */
    async listProviders() {
        const response = await api.get('/api/v1/llm/providers');
        return response.data;
    }
    /**
     * 创建提供商
     */
    async createProvider(data) {
        const response = await api.post('/api/v1/llm/providers', data);
        return response.data;
    }
    /**
     * 获取单个提供商
     */
    async getProvider(providerId) {
        const response = await api.get(`/api/v1/llm/providers/${providerId}`);
        return response.data;
    }
    /**
     * 更新提供商
     */
    async updateProvider(providerId, data) {
        const response = await api.put(`/api/v1/llm/providers/${providerId}`, data);
        return response.data;
    }
    /**
     * 删除提供商
     */
    async deleteProvider(providerId) {
        await api.delete(`/api/v1/llm/providers/${providerId}`);
    }
    /**
     * 获取提供商的模型列表
     */
    async listModels(providerId) {
        const response = await api.get(`/api/v1/llm/providers/${providerId}/models`);
        return response.data;
    }
    /**
     * 为提供商添加模型
     */
    async createModel(data) {
        const response = await api.post(`/api/v1/llm/providers/${data.provider_id}/models`, data);
        return response.data;
    }
    /**
     * 更新模型
     */
    async updateModel(modelId, data) {
        const response = await api.put(`/api/v1/llm/models/${modelId}`, data);
        return response.data;
    }
    /**
     * 删除模型
     */
    async deleteModel(modelId) {
        await api.delete(`/api/v1/llm/models/${modelId}`);
    }
    /**
     * 测试提供商连接
     */
    async testConnection(data) {
        const response = await api.post('/api/v1/llm/test-connection', data);
        return response.data;
    }
}
export default new LLMService();
