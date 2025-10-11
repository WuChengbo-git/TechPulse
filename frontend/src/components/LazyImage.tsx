import { useState, useEffect, useRef } from 'react'
import { Skeleton } from 'antd'

interface LazyImageProps {
  src: string
  alt: string
  placeholder?: string
  className?: string
  style?: React.CSSProperties
}

export function LazyImage({ src, alt, placeholder, className, style }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={imgRef} style={style} className={className}>
      {!isLoaded && <Skeleton.Image active style={{ width: '100%', height: '100%' }} />}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          style={{
            ...style,
            display: isLoaded ? 'block' : 'none',
            transition: 'opacity 0.3s',
            opacity: isLoaded ? 1 : 0,
          }}
          className={`${className} ${isLoaded ? 'loaded' : ''}`}
        />
      )}
    </div>
  )
}

export default LazyImage
