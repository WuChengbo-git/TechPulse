import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, Translations } from '../locales/translations'

// 语言上下文类型
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (path: string) => string
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 从 localStorage 读取保存的语言，默认中文
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('techpulse_language')
    return (saved as Language) || 'zh-CN'
  })

  // 设置语言并保存到 localStorage
  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang)
    localStorage.setItem('techpulse_language', newLang)

    // 更新 HTML lang 属性
    const langMap: Record<Language, string> = {
      'zh-CN': 'zh',
      'en-US': 'en',
      'ja-JP': 'ja',
    }
    document.documentElement.lang = langMap[newLang]
  }

  // 翻译函数 - 支持嵌套路径访问，如 'login.title', 'nav.home'
  const t = (path: string): string => {
    const keys = path.split('.')
    let value: any = translations[language]

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return path // 如果找不到翻译，返回原路径
      }
    }

    return typeof value === 'string' ? value : path
  }

  // 初始化时设置 HTML lang 属性
  useEffect(() => {
    const langMap: Record<Language, string> = {
      'zh-CN': 'zh',
      'en-US': 'en',
      'ja-JP': 'ja',
    }
    document.documentElement.lang = langMap[language]
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

// 自定义 Hook
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
