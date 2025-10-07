# 🌍 TechPulse 多语言自动切换方案

## 📋 概述

根据用户操作系统语言自动切换应用界面语言，提供更好的用户体验。

---

## 🎯 实现方案

### 方案 1: 浏览器语言检测（Web 版本）✅ 推荐

适用于 Web 应用，检测用户浏览器语言设置。

### 方案 2: Electron 系统语言检测（桌面版本）

适用于 Electron 桌面应用，检测操作系统语言。

### 方案 3: 用户手动选择 + 记忆

允许用户手动切换，并记住选择。

---

## 🌐 方案 1: 浏览器语言检测（Web 版本）

### 1. 工作原理

```
浏览器启动
    ↓
读取 navigator.language
    ↓
判断语言 (zh-CN, en-US, ja-JP等)
    ↓
设置对应语言
    ↓
用户可手动切换
```

### 2. 实现代码

#### 创建语言检测工具 `src/utils/language.ts`

```typescript
/**
 * 语言检测和管理工具
 */

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en-US': 'English',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * 获取浏览器语言
 */
export function getBrowserLanguage(): SupportedLanguage {
  // 方法1: navigator.language (用户首选语言)
  const browserLang = navigator.language;

  // 方法2: navigator.languages (用户语言偏好列表)
  const browserLangs = navigator.languages || [browserLang];

  console.log('浏览器语言:', browserLang);
  console.log('语言列表:', browserLangs);

  // 精确匹配
  for (const lang of browserLangs) {
    if (lang in SUPPORTED_LANGUAGES) {
      return lang as SupportedLanguage;
    }
  }

  // 模糊匹配（只匹配语言代码，忽略地区）
  for (const lang of browserLangs) {
    const langCode = lang.split('-')[0]; // 'zh-CN' -> 'zh'

    // 查找匹配的语言
    for (const supportedLang of Object.keys(SUPPORTED_LANGUAGES)) {
      if (supportedLang.startsWith(langCode)) {
        return supportedLang as SupportedLanguage;
      }
    }
  }

  // 默认返回英语
  return 'en-US';
}

/**
 * 获取存储的语言设置
 */
export function getStoredLanguage(): SupportedLanguage | null {
  const stored = localStorage.getItem('techpulse_language');
  if (stored && stored in SUPPORTED_LANGUAGES) {
    return stored as SupportedLanguage;
  }
  return null;
}

/**
 * 保存语言设置
 */
export function saveLanguage(language: SupportedLanguage): void {
  localStorage.setItem('techpulse_language', language);
}

/**
 * 自动检测并设置语言
 * 优先级: 1. 用户手动设置 > 2. 浏览器语言 > 3. 默认语言
 */
export function detectLanguage(): SupportedLanguage {
  // 1. 检查是否有用户手动设置
  const storedLang = getStoredLanguage();
  if (storedLang) {
    console.log('使用存储的语言:', storedLang);
    return storedLang;
  }

  // 2. 检测浏览器语言
  const browserLang = getBrowserLanguage();
  console.log('检测到浏览器语言:', browserLang);

  // 自动保存检测到的语言
  saveLanguage(browserLang);

  return browserLang;
}

/**
 * 获取操作系统类型（用于显示）
 */
export function getOSInfo(): {
  os: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'Unknown';
  language: string;
} {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  let os: 'Windows' | 'macOS' | 'Linux' | 'iOS' | 'Android' | 'Unknown' = 'Unknown';

  if (platform.includes('Win')) {
    os = 'Windows';
  } else if (platform.includes('Mac')) {
    os = 'macOS';
  } else if (platform.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  }

  return {
    os,
    language: navigator.language,
  };
}
```

#### 更新 LanguageContext `src/contexts/LanguageContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectLanguage, saveLanguage, SupportedLanguage, getOSInfo } from '../utils/language';

// ... 保持现有的翻译内容 ...

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  osInfo: ReturnType<typeof getOSInfo>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 自动检测语言
  const [language, setLanguageState] = useState<SupportedLanguage>(() => detectLanguage());
  const [osInfo] = useState(() => getOSInfo());

  // 语言变化时保存
  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    saveLanguage(lang);
  };

  // 首次加载时显示检测信息
  useEffect(() => {
    console.log('🌍 语言自动检测:');
    console.log('  操作系统:', osInfo.os);
    console.log('  系统语言:', osInfo.language);
    console.log('  应用语言:', language);
  }, []);

  const t = (key: string) => {
    // 翻译逻辑保持不变
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, osInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
```

#### 创建语言切换组件 `src/components/LanguageSwitcher.tsx`

```typescript
import React from 'react';
import { Select, Space, Tag } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../utils/language';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, osInfo } = useLanguage();

  const options = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    label: name,
    value: code,
  }));

  return (
    <Space>
      <GlobalOutlined style={{ fontSize: 16, color: '#1890ff' }} />
      <Select
        value={language}
        onChange={(value) => setLanguage(value as SupportedLanguage)}
        options={options}
        style={{ width: 150 }}
        size="small"
      />
      <Tag color="blue" style={{ fontSize: 11 }}>
        {osInfo.os}
      </Tag>
    </Space>
  );
};

export default LanguageSwitcher;
```

---

## 🖥️ 方案 2: Electron 系统语言检测（桌面版本）

### 1. 工作原理

```
Electron 应用启动
    ↓
主进程获取系统语言 (app.getLocale())
    ↓
通过 IPC 传递给渲染进程
    ↓
设置应用语言
```

### 2. 实现代码

#### 更新 Electron 主进程 `electron/main.js`

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // 获取系统语言
  const systemLocale = app.getLocale(); // 例如: 'zh-CN', 'en-US', 'ja'
  console.log('系统语言:', systemLocale);

  // 将语言信息传递给渲染进程
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('system-locale', systemLocale);
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// 监听渲染进程请求系统语言
ipcMain.handle('get-system-locale', () => {
  return app.getLocale();
});

app.whenReady().then(createWindow);
```

#### 更新 Preload 脚本 `electron/preload.js`

```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,

  // 获取系统语言
  getSystemLocale: () => ipcRenderer.invoke('get-system-locale'),

  // 监听系统语言变化
  onSystemLocale: (callback) => {
    ipcRenderer.on('system-locale', (event, locale) => callback(locale));
  },

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});
```

#### Electron 环境下的语言检测 `src/utils/language.ts`

```typescript
/**
 * Electron 环境语言检测
 */
export async function getElectronLanguage(): Promise<SupportedLanguage> {
  // 检查是否在 Electron 环境
  if (window.electronAPI && window.electronAPI.getSystemLocale) {
    try {
      const systemLocale = await window.electronAPI.getSystemLocale();
      console.log('Electron 系统语言:', systemLocale);

      // 转换为标准格式
      const normalized = normalizeLocale(systemLocale);

      if (normalized in SUPPORTED_LANGUAGES) {
        return normalized as SupportedLanguage;
      }

      // 模糊匹配
      const langCode = normalized.split('-')[0];
      for (const lang of Object.keys(SUPPORTED_LANGUAGES)) {
        if (lang.startsWith(langCode)) {
          return lang as SupportedLanguage;
        }
      }
    } catch (error) {
      console.error('获取 Electron 语言失败:', error);
    }
  }

  // 回退到浏览器检测
  return getBrowserLanguage();
}

/**
 * 标准化语言代码
 * 'zh' -> 'zh-CN'
 * 'en' -> 'en-US'
 */
function normalizeLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'zh': 'zh-CN',
    'en': 'en-US',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
  };

  // 如果已经是完整格式，直接返回
  if (locale.includes('-')) {
    return locale;
  }

  return localeMap[locale] || locale;
}

/**
 * 统一的语言检测入口
 */
export async function detectLanguageUnified(): Promise<SupportedLanguage> {
  // 1. 检查用户手动设置
  const storedLang = getStoredLanguage();
  if (storedLang) {
    return storedLang;
  }

  // 2. Electron 环境
  if (window.electronAPI) {
    return await getElectronLanguage();
  }

  // 3. Web 环境
  return getBrowserLanguage();
}
```

#### TypeScript 类型定义 `src/types/electron.d.ts`

```typescript
interface ElectronAPI {
  platform: string;
  getSystemLocale: () => Promise<string>;
  onSystemLocale: (callback: (locale: string) => void) => void;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
```

---

## 🎨 方案 3: 智能语言选择器

### 完整的语言管理组件

```typescript
import React, { useState, useEffect } from 'react';
import { Select, Button, Space, Card, Divider, Typography } from 'antd';
import { GlobalOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

const LanguageManager: React.FC = () => {
  const { language, setLanguage, osInfo } = useLanguage();
  const [detectedLang, setDetectedLang] = useState<SupportedLanguage>('en-US');

  useEffect(() => {
    // 检测语言（不自动应用）
    detectLanguageUnified().then(setDetectedLang);
  }, []);

  const isAutoDetected = language === detectedLang;

  return (
    <Card title="语言设置" style={{ maxWidth: 500 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 当前设置 */}
        <div>
          <Text strong>当前语言: </Text>
          <Text>{SUPPORTED_LANGUAGES[language]}</Text>
          {isAutoDetected && (
            <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 8 }} />
          )}
        </div>

        {/* 系统信息 */}
        <div>
          <Text type="secondary">
            操作系统: {osInfo.os} | 系统语言: {osInfo.language}
          </Text>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 语言选择器 */}
        <Space>
          <GlobalOutlined />
          <Select
            value={language}
            onChange={setLanguage}
            style={{ width: 200 }}
            options={Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
              label: name,
              value: code,
            }))}
          />
        </Space>

        {/* 自动检测按钮 */}
        {!isAutoDetected && (
          <Button
            type="dashed"
            size="small"
            onClick={() => setLanguage(detectedLang)}
          >
            使用系统语言 ({SUPPORTED_LANGUAGES[detectedLang]})
          </Button>
        )}
      </Space>
    </Card>
  );
};
```

---

## 📱 实现步骤总结

### Web 版本（最简单）

```bash
# 1. 创建语言检测工具
frontend/src/utils/language.ts

# 2. 更新语言上下文
frontend/src/contexts/LanguageContext.tsx

# 3. 添加语言切换器
frontend/src/components/LanguageSwitcher.tsx

# 4. 集成到应用
在 Header 或 Settings 中添加 <LanguageSwitcher />
```

### Electron 版本

```bash
# 1. 完成 Web 版本的所有步骤
# 2. 更新 Electron 主进程
electron/main.js

# 3. 更新 Preload 脚本
electron/preload.js

# 4. 添加类型定义
frontend/src/types/electron.d.ts

# 5. 更新语言检测逻辑
使用 detectLanguageUnified()
```

---

## 🧪 测试方法

### 测试浏览器语言检测

```javascript
// 在浏览器控制台测试
console.log('浏览器语言:', navigator.language);
console.log('语言列表:', navigator.languages);

// 修改浏览器语言设置
// Chrome: Settings -> Languages -> 调整顺序
// Firefox: Preferences -> Language -> 调整顺序
```

### 测试 Windows 语言

```
Windows 设置
  ↓
时间和语言
  ↓
语言
  ↓
添加首选语言
  ↓
重启浏览器/应用
```

---

## 🌟 高级功能

### 1. 语言切换动画

```typescript
const [transitioning, setTransitioning] = useState(false);

const handleLanguageChange = async (newLang: SupportedLanguage) => {
  setTransitioning(true);
  await new Promise(resolve => setTimeout(resolve, 300)); // 淡出
  setLanguage(newLang);
  await new Promise(resolve => setTimeout(resolve, 300)); // 淡入
  setTransitioning(false);
};
```

### 2. 语言包懒加载

```typescript
const translations = {
  'zh-CN': () => import('./locales/zh-CN.json'),
  'en-US': () => import('./locales/en-US.json'),
  // ...
};

async function loadLanguage(lang: SupportedLanguage) {
  const translations = await translations[lang]();
  return translations.default;
}
```

### 3. 实时语言检测

```typescript
// 监听系统语言变化（Electron）
window.electronAPI?.onSystemLocale((newLocale) => {
  console.log('系统语言已更改:', newLocale);
  // 提示用户是否切换
  Modal.confirm({
    title: '检测到系统语言变化',
    content: `是否切换到 ${newLocale}？`,
    onOk: () => setLanguage(normalizeLocale(newLocale))
  });
});
```

---

## 📊 支持的语言检测方式

| 方式 | 精确度 | 适用场景 | 优先级 |
|------|--------|----------|--------|
| 用户手动设置 | ⭐⭐⭐⭐⭐ | 所有 | 1 |
| Electron app.getLocale() | ⭐⭐⭐⭐⭐ | 桌面应用 | 2 |
| navigator.language | ⭐⭐⭐⭐ | Web 应用 | 3 |
| navigator.languages | ⭐⭐⭐⭐ | Web 应用 | 3 |
| 默认语言 | ⭐⭐⭐ | 降级方案 | 4 |

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **优先使用用户设置**: 尊重用户选择
2. **自动检测作为默认**: 首次启动时自动检测
3. **明确的切换入口**: 提供显眼的语言切换按钮
4. **保存用户选择**: 记住用户的语言偏好
5. **降级策略**: 检测失败时使用默认语言

### ❌ 避免做法

1. ❌ 强制使用检测到的语言（无法切换）
2. ❌ 每次启动都重新检测（忽略用户设置）
3. ❌ 隐藏语言切换选项
4. ❌ 不保存用户选择

---

## 📚 参考资料

- **Navigator API**: https://developer.mozilla.org/en-US/docs/Web/API/Navigator
- **Electron i18n**: https://www.electronjs.org/docs/api/app#appgetlocale
- **i18next**: https://www.i18next.com/
- **React-intl**: https://formatjs.io/docs/react-intl/

---

## 🚀 快速开始

### 最简单的实现（5分钟）

```typescript
// 1. 获取浏览器语言
const lang = navigator.language; // 'zh-CN', 'en-US', etc.

// 2. 映射到支持的语言
const langMap = {
  'zh': 'zh-CN',
  'en': 'en-US',
  'ja': 'ja-JP'
};

const appLang = langMap[lang.split('-')[0]] || 'en-US';

// 3. 设置应用语言
setLanguage(appLang);

// 完成！
```

---

**总结**:
- **Web 版**: 使用 `navigator.language` ✅ 简单有效
- **Electron 版**: 使用 `app.getLocale()` ✅ 最准确
- **最佳实践**: 用户设置 > 自动检测 > 默认值

需要我帮您实现这个功能吗？我可以直接创建这些文件并集成到您的项目中！
