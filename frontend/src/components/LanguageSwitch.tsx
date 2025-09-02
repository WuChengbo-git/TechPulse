import React from 'react'
import { Select } from 'antd'
import { useLanguage, languages, Language } from '../contexts/LanguageContext'

const { Option } = Select

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage()

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage)
  }

  return (
    <Select
      value={language}
      onChange={handleLanguageChange}
      size="small"
      style={{ width: 100 }}
      variant="borderless"
    >
      {Object.entries(languages).map(([code, config]) => (
        <Option key={code} value={code}>
          <span style={{ marginRight: 4 }}>{config.flag}</span>
          {config.name}
        </Option>
      ))}
    </Select>
  )
}

export default LanguageSwitch