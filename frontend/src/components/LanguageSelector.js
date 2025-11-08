import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
const LanguageSelector = ({ value, onChange, size = 'middle' }) => {
    const languages = [
        { value: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
        { value: 'en-US', label: 'English', flag: '🇺🇸' },
        { value: 'ja-JP', label: '日本語', flag: '🇯🇵' },
    ];
    return (_jsx(Select, { value: value, onChange: onChange, size: size, style: { width: 160 }, suffixIcon: _jsx(GlobalOutlined, {}), options: languages.map(lang => ({
            value: lang.value,
            label: (_jsxs("span", { children: [_jsx("span", { style: { marginRight: 8, fontSize: 16 }, children: lang.flag }), _jsx("span", { children: lang.label })] })),
        })) }));
};
export default LanguageSelector;
