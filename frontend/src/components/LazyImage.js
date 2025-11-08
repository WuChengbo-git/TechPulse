import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Skeleton } from 'antd';
export function LazyImage({ src, alt, placeholder, className, style }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef(null);
    useEffect(() => {
        if (!imgRef.current)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        }, { rootMargin: '50px' });
        observer.observe(imgRef.current);
        return () => {
            observer.disconnect();
        };
    }, []);
    return (_jsxs("div", { ref: imgRef, style: style, className: className, children: [!isLoaded && _jsx(Skeleton.Image, { active: true, style: { width: '100%', height: '100%' } }), isInView && (_jsx("img", { src: src, alt: alt, loading: "lazy", onLoad: () => setIsLoaded(true), style: {
                    ...style,
                    display: isLoaded ? 'block' : 'none',
                    transition: 'opacity 0.3s',
                    opacity: isLoaded ? 1 : 0,
                }, className: `${className} ${isLoaded ? 'loaded' : ''}` }))] }));
}
export default LazyImage;
