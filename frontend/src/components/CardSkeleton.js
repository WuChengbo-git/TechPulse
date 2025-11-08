import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 卡片骨架屏组件
 * 用于显示卡片加载时的占位符，提升用户体验
 */
import { Card, Skeleton, Space, Row, Col } from 'antd';
export function CardSkeleton({ count = 6, size = 'small', grid = true }) {
    const skeletonCard = (index) => (_jsx(Card, { size: size, style: { marginBottom: grid ? 0 : 16 }, children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, size: "small", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }, children: [_jsx(Skeleton.Input, { active: true, size: "small", style: { width: 180, height: 20 } }), _jsx(Skeleton.Button, { active: true, size: "small", style: { width: 60, height: 20 } })] }), _jsxs("div", { style: { display: 'flex', gap: 12, marginBottom: 8 }, children: [_jsx(Skeleton.Button, { active: true, size: "small", style: { width: 60, height: 18 } }), _jsx(Skeleton.Button, { active: true, size: "small", style: { width: 60, height: 18 } }), _jsx(Skeleton.Button, { active: true, size: "small", style: { width: 80, height: 18 } })] }), _jsx(Skeleton, { active: true, paragraph: { rows: 3, width: ['100%', '100%', '60%'] }, title: false, style: { marginBottom: 8 } }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }, children: [_jsx(Skeleton.Button, { active: true, size: "small", style: { width: 60, height: 22 } }), _jsx(Skeleton.Button, { active: true, size: "small", style: { width: 80, height: 22 } }), _jsx(Skeleton.Button, { active: true, size: "small", style: { width: 70, height: 22 } })] }), _jsx(Skeleton.Input, { active: true, size: "small", style: { width: 100, height: 14 } })] }) }, index));
    // 网格布局（适用于Dashboard两栏布局）
    if (grid) {
        return (_jsx(Row, { gutter: [16, 16], children: Array.from({ length: count }).map((_, index) => (_jsx(Col, { xs: 24, sm: 12, children: skeletonCard(index) }, index))) }));
    }
    // 垂直布局（适用于列表页面）
    return (_jsx(Space, { direction: "vertical", size: "middle", style: { width: '100%' }, children: Array.from({ length: count }).map((_, index) => skeletonCard(index)) }));
}
export default CardSkeleton;
