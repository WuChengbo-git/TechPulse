import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Typography, Space } from 'antd';
import { APP_VERSION, BUILD_DATE } from '../config/version';
const { Text } = Typography;
const VersionInfo = ({ style }) => {
    return (_jsxs(Space, { style: style, split: _jsx(Text, { type: "secondary", children: "|" }), children: [_jsxs(Text, { type: "secondary", style: { fontSize: '11px' }, children: ["Version ", APP_VERSION] }), _jsxs(Text, { type: "secondary", style: { fontSize: '11px' }, children: ["Build ", BUILD_DATE] })] }));
};
export default VersionInfo;
