/**
 * 标签翻译工具
 * 用于将中文标签翻译成其他语言
 */
import api from './api';
// 翻译缓存
const cache = {};
/**
 * 翻译标签列表
 * @param tags 要翻译的标签数组
 * @param targetLanguage 目标语言 ('en-US' | 'ja-JP')
 * @returns 翻译后的标签数组
 */
export async function translateTags(tags, targetLanguage) {
    // 如果是中文，直接返回
    if (targetLanguage === 'zh-CN') {
        return tags;
    }
    // 转换为API需要的格式
    const langCode = targetLanguage === 'en-US' ? 'en' : 'ja';
    // 检查缓存
    const uncachedTags = [];
    const results = tags.map(tag => {
        const cacheKey = `${tag}_${langCode}`;
        if (cache[cacheKey]) {
            return cache[cacheKey];
        }
        uncachedTags.push(tag);
        return null;
    });
    // 如果全部在缓存中，直接返回
    if (uncachedTags.length === 0) {
        return results;
    }
    try {
        // 调用翻译API
        const response = await api.post('/api/v1/translate', {
            texts: uncachedTags,
            target_language: langCode
        });
        const translations = response.data.translations;
        // 更新缓存和结果
        let uncachedIndex = 0;
        for (let i = 0; i < results.length; i++) {
            if (results[i] === null) {
                const translation = translations[uncachedIndex] || tags[i];
                const cacheKey = `${tags[i]}_${langCode}`;
                cache[cacheKey] = translation;
                results[i] = translation;
                uncachedIndex++;
            }
        }
        return results;
    }
    catch (error) {
        console.error('翻译失败:', error);
        // 翻译失败时返回原文
        return tags;
    }
}
/**
 * 清空翻译缓存
 */
export function clearTranslationCache() {
    Object.keys(cache).forEach(key => delete cache[key]);
}
