import React from 'react';
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  size?: 'small' | 'middle' | 'large';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  size = 'middle'
}) => {
  const languages = [
    { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
    { value: 'en-US', label: 'English', flag: '🇺🇸' },
    { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      size={size}
      style={{ width: 160 }}
      suffixIcon={<GlobalOutlined />}
      options={languages.map(lang => ({
        value: lang.value,
        label: (
          <span>
            <span style={{ marginRight: 8, fontSize: 16 }}>{lang.flag}</span>
            <span>{lang.label}</span>
          </span>
        ),
      }))}
    />
  );
};

export default LanguageSelector;
