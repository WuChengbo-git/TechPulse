/**
 * 系统配置服务
 * 提供前后端配置同步功能
 */
import axios from 'axios';
const API_BASE_URL = 'http://localhost:8000';
class SystemConfigService {
    constructor() {
        Object.defineProperty(this, "apiUrl", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.apiUrl = `${API_BASE_URL}/api/v1/system-config`;
    }
    /**
     * 获取认证头
     */
    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    /**
     * 获取系统配置
     */
    async getConfig(showSensitive = false) {
        const response = await axios.get(`${this.apiUrl}?show_sensitive=${showSensitive}`, { headers: this.getAuthHeaders() });
        return response.data;
    }
    /**
     * 获取所有配置键
     */
    async getConfigKeys() {
        const response = await axios.get(`${this.apiUrl}/keys`, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    /**
     * 获取单个配置项
     */
    async getConfigItem(key) {
        const response = await axios.get(`${this.apiUrl}/item/${key}`, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    /**
     * 更新系统配置
     */
    async updateConfig(config, applyImmediately = true) {
        const response = await axios.put(this.apiUrl, {
            config,
            apply_immediately: applyImmediately
        }, { headers: this.getAuthHeaders() });
        return response.data;
    }
    /**
     * 重载配置
     */
    async reloadConfig() {
        const response = await axios.post(`${this.apiUrl}/reload`, null, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    /**
     * 验证配置
     */
    async validateConfig() {
        const response = await axios.post(`${this.apiUrl}/validate`, null, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    /**
     * 恢复默认配置
     */
    async restoreDefaults() {
        const response = await axios.post(`${this.apiUrl}/restore/defaults`, null, { headers: this.getAuthHeaders() });
        return response.data;
    }
    /**
     * 列出所有备份
     */
    async listBackups() {
        const response = await axios.get(`${this.apiUrl}/backups`, {
            headers: this.getAuthHeaders()
        });
        return response.data;
    }
    /**
     * 从备份恢复
     */
    async restoreFromBackup(backupFilename) {
        const params = backupFilename ? `?backup_filename=${backupFilename}` : '';
        const response = await axios.post(`${this.apiUrl}/restore/backup${params}`, null, { headers: this.getAuthHeaders() });
        return response.data;
    }
    /**
     * 批量更新配置项
     */
    async batchUpdate(updates, applyImmediately = true) {
        const config = {};
        updates.forEach(({ key, value }) => {
            config[key] = value;
        });
        return this.updateConfig(config, applyImmediately);
    }
    /**
     * 导出配置（JSON格式）
     */
    async exportConfig(showSensitive = false) {
        const { config } = await this.getConfig(showSensitive);
        return JSON.stringify(config, null, 2);
    }
    /**
     * 导入配置
     */
    async importConfig(configJson, applyImmediately = false) {
        try {
            const config = JSON.parse(configJson);
            return await this.updateConfig(config, applyImmediately);
        }
        catch (error) {
            throw new Error('Invalid JSON format');
        }
    }
    /**
     * 检查配置健康状态
     */
    async checkHealth() {
        try {
            const validation = await this.validateConfig();
            const { total_items } = await this.getConfig(false);
            return {
                healthy: validation.valid && validation.errors.length === 0,
                validation,
                total_items
            };
        }
        catch (error) {
            return {
                healthy: false,
                validation: {
                    valid: false,
                    errors: ['Failed to check configuration health'],
                    warnings: []
                },
                total_items: 0
            };
        }
    }
}
export default new SystemConfigService();
