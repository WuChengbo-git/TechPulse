import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Logo = ({ size = 80, showText = true }) => {
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
        }, children: [_jsxs("svg", { width: size, height: size, viewBox: "0 0 200 200", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "techGradient", x1: "0%", y1: "0%", x2: "100%", y2: "100%", children: [_jsx("stop", { offset: "0%", stopColor: "#1890ff" }), _jsx("stop", { offset: "50%", stopColor: "#52c41a" }), _jsx("stop", { offset: "100%", stopColor: "#722ed1" })] }), _jsxs("linearGradient", { id: "pulseGradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [_jsx("stop", { offset: "0%", stopColor: "#1890ff", stopOpacity: "0.2" }), _jsx("stop", { offset: "50%", stopColor: "#52c41a", stopOpacity: "0.8" }), _jsx("stop", { offset: "100%", stopColor: "#722ed1", stopOpacity: "0.2" })] }), _jsxs("filter", { id: "glow", children: [_jsx("feGaussianBlur", { stdDeviation: "3", result: "coloredBlur" }), _jsxs("feMerge", { children: [_jsx("feMergeNode", { in: "coloredBlur" }), _jsx("feMergeNode", { in: "SourceGraphic" })] })] })] }), _jsx("circle", { cx: "100", cy: "100", r: "90", stroke: "url(#techGradient)", strokeWidth: "4", fill: "none", strokeDasharray: "10 5", children: _jsx("animateTransform", { attributeName: "transform", type: "rotate", from: "0 100 100", to: "360 100 100", dur: "20s", repeatCount: "indefinite" }) }), _jsx("circle", { cx: "100", cy: "100", r: "70", stroke: "url(#techGradient)", strokeWidth: "2", fill: "none", strokeDasharray: "5 10", opacity: "0.6", children: _jsx("animateTransform", { attributeName: "transform", type: "rotate", from: "360 100 100", to: "0 100 100", dur: "15s", repeatCount: "indefinite" }) }), _jsx("g", { filter: "url(#glow)", children: _jsx("path", { d: "M 70 60 L 130 60 L 130 70 L 105 70 L 105 140 L 95 140 L 95 70 L 70 70 Z", fill: "url(#techGradient)" }) }), _jsx("path", { d: "M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100", stroke: "url(#pulseGradient)", strokeWidth: "3", fill: "none", strokeLinecap: "round", opacity: "0.7", children: _jsx("animate", { attributeName: "d", values: "\n              M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100;\n              M 40 100 L 50 100 L 60 120 L 70 80 L 80 110 L 90 90 L 100 100;\n              M 40 100 L 50 100 L 60 80 L 70 120 L 80 90 L 90 110 L 100 100\n            ", dur: "2s", repeatCount: "indefinite" }) }), _jsx("path", { d: "M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100", stroke: "url(#pulseGradient)", strokeWidth: "3", fill: "none", strokeLinecap: "round", opacity: "0.7", children: _jsx("animate", { attributeName: "d", values: "\n              M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100;\n              M 100 100 L 110 90 L 120 110 L 130 80 L 140 120 L 150 100 L 160 100;\n              M 100 100 L 110 110 L 120 90 L 130 120 L 140 80 L 150 100 L 160 100\n            ", dur: "2s", repeatCount: "indefinite" }) }), [45, 135, 225, 315].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const x = 100 + 60 * Math.cos(rad);
                        const y = 100 + 60 * Math.sin(rad);
                        return (_jsxs("circle", { cx: x, cy: y, r: "4", fill: "url(#techGradient)", children: [_jsx("animate", { attributeName: "r", values: "4;6;4", dur: "2s", begin: `${i * 0.5}s`, repeatCount: "indefinite" }), _jsx("animate", { attributeName: "opacity", values: "0.6;1;0.6", dur: "2s", begin: `${i * 0.5}s`, repeatCount: "indefinite" })] }, i));
                    })] }), showText && (_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("h1", { style: {
                            margin: 0,
                            fontSize: size * 0.4,
                            fontWeight: 'bold',
                            background: 'linear-gradient(90deg, #1890ff, #52c41a, #722ed1)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '2px'
                        }, children: "TechPulse" }), _jsx("p", { style: {
                            margin: '8px 0 0 0',
                            fontSize: size * 0.15,
                            color: '#8c8c8c',
                            letterSpacing: '1px'
                        }, children: "\u79D1\u6280\u8109\u640F \u00B7 \u6D1E\u5BDF\u672A\u6765" })] }))] }));
};
export default Logo;
