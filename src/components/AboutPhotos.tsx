'use client'

import { useEffect, useRef, useState } from 'react'

// Cross-fades through the photos as the block scrolls past.
export function AboutPhotos({ photos, alt }: { photos: string[]; alt: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el || photos.length < 2) return
    const onScroll = () => {
      const { top, height } = el.getBoundingClientRect()
      const progress = Math.min(0.999, Math.max(0, (window.innerHeight - top) / (window.innerHeight + height)))
      setActive(Math.floor(progress * photos.length))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [photos.length])

  return (
    <div ref={ref} className="about-photos">
      {photos.map((path, i) => {
        const src = `/img/${path.split('/').map(encodeURIComponent).join('/')}`
        const gif = path.toLowerCase().endsWith('.gif')
        return (
          // eslint-disable-next-line @next/next/no-img-element -- resized by our own /img route
          <img
            key={path}
            src={gif ? src : `${src}?w=1024`}
            srcSet={gif ? undefined : [640, 1024, 1600].map((w) => `${src}?w=${w} ${w}w`).join(', ')}
            sizes="(max-width: 809px) 100vw, 34vw"
            alt={alt}
            data-active={i === active}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
        )
      })}
    </div>
  )
}
