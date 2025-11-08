/**
 * 用户设置服务
 * 处理用户个人设置的获取、更新和验证
 */
import api from '../utils/api';
class UserSettingsService {
    /**
     * 获取用户设置
     */
    async getSettings() {
        const response = await api.get('/api/v1/user-settings');
        return response.data;
    }
    /**
     * 更新用户设置
     */
    async updateSettings(settings) {
        const response = await api.put('/api/v1/user-settings', settings);
        return response.data;
    }
    /**
     * 测试 Azure OpenAI 配置
     */
    async testAzureConfig(config) {
        const response = await api.post('/api/v1/user-settings/test-azure-config', config);
        return response.data;
    }
    /**
     * 获取 AI 配置状态
     */
    async getAIConfigStatus() {
        const response = await api.get('/api/v1/user-settings/ai-config-status');
        return response.data;
    }
}
export default new UserSettingsService();
