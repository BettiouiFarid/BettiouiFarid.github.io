import Link from 'next/link'
import type { CSSProperties } from 'react'

import type { Post, Project } from '@/lib/types'

export const formatDate = (iso: string | null | undefined, style: 'long' | 'month-year' = 'long') => {
  if (!iso) return ''
  const d = new Date(iso)
  return style === 'month-year'
    ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
}

const WIDTHS = [320, 640, 1024, 1600, 2400]

// An image from Firebase Storage, resized by /img. `path` is the Storage path saved by the CMS.
export function MediaImage({
  path,
  alt,
  sizes,
  priority,
  className,
  width,
  height,
  style,
  eager,
}: {
  path: string | null | undefined
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  width?: number
  height?: number
  style?: CSSProperties
  eager?: boolean
}) {
  if (!path) return null
  const src = `/img/${path.split('/').map(encodeURIComponent).join('/')}`
  const isGif = path.toLowerCase().endsWith('.gif')
  return (
    // eslint-disable-next-line @next/next/no-img-element -- resized by our own /img route
    <img
      className={className}
      src={isGif ? src : `${src}?w=1024`}
      srcSet={isGif ? undefined : WIDTHS.map((w) => `${src}?w=${w} ${w}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      style={style}
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
    />
  )
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export function ProjectGrid({ projects, columns = 2 }: { projects: Project[]; columns?: 2 | 3 }) {
  return (
    <div className={`project-grid${columns === 3 ? ' three' : ''}`}>
      {projects.map((p, i) => (
        <Link key={p.id} href={`/work/${p.id}`} className="tile reveal">
          <MediaImage
            path={p.cover}
            alt={p.title}
            sizes={columns === 3 ? '(max-width: 809px) 100vw, 30vw' : '(max-width: 809px) 100vw, 45vw'}
            priority={i < 2}
          />
          <span className="tile-caption">
            {p.title}
            <Arrow />
          </span>
        </Link>
      ))}
    </div>
  )
}

export function StoryList({ posts }: { posts: Post[] }) {
  return (
    <div className="stories">
      {posts.map((p) => (
        <Link key={p.id} href={`/blog/${p.id}`} className="story-row reveal">
          <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
          <h3>{p.title}</h3>
          <span className="tag">{p.category}</span>
        </Link>
      ))}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  line1,
  line2,
  intro,
}: {
  eyebrow?: string | null
  line1?: string | null
  line2?: string | null
  intro?: string | null
}) {
  return (
    <header className="page-header container">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display">
        {line1}
        <br />
        {line2}
      </h1>
      {intro && <p className="intro">{intro}</p>}
      <p className="scroll-cue">SCROLL</p>
    </header>
  )
}
