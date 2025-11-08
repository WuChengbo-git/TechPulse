import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';
// 创建上下文
const LanguageContext = createContext(undefined);
// 语言提供者组件
export const LanguageProvider = ({ children }) => {
    // 从 localStorage 读取保存的语言，默认日语
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('techpulse_language');
        return saved || 'ja-JP';
    });
    // 设置语言并保存到 localStorage
    const setLanguage = (newLang) => {
        setLanguageState(newLang);
        localStorage.setItem('techpulse_language', newLang);
        // 更新 HTML lang 属性
        const langMap = {
            'zh-CN': 'zh',
            'en-US': 'en',
            'ja-JP': 'ja',
        };
        document.documentElement.lang = langMap[newLang];
    };
    // 翻译函数 - 支持嵌套路径访问，如 'login.title', 'nav.home'
    const t = (path) => {
        const keys = path.split('.');
        let value = translations[language];
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            }
            else {
                return path; // 如果找不到翻译，返回原路径
            }
        }
        return typeof value === 'string' ? value : path;
    };
    // 初始化时设置 HTML lang 属性
    useEffect(() => {
        const langMap = {
            'zh-CN': 'zh',
            'en-US': 'en',
            'ja-JP': 'ja',
        };
        document.documentElement.lang = langMap[language];
    }, [language]);
    return (_jsx(LanguageContext.Provider, { value: { language, setLanguage, t }, children: children }));
};
// 自定义 Hook
export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
