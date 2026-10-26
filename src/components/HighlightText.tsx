'use client'

import { useEffect, useRef } from 'react'

// White lead text, then grey text whose words turn white as the paragraph scrolls through the viewport.
export function HighlightText({ lead, rest, className = '' }: { lead: string; rest?: string | null; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = [...el.querySelectorAll<HTMLSpanElement>('.rest span')]
    let frame = 0
    const update = () => {
      frame = 0
      const { top, height } = el.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when the paragraph's top reaches 75% of the viewport, 1 when its bottom reaches 40%.
      const progress = Math.min(1, Math.max(0, (vh * 0.75 - top) / (height + vh * 0.35)))
      const lit = Math.round(progress * words.length)
      words.forEach((w, i) => w.classList.toggle('lit', i < lit))
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [rest])

  return (
    <p ref={ref} className={`highlight-text ${className}`}>
      {lead}{' '}
      {rest && (
        <span className="rest">
          {rest.split(/\s+/).map((word, i) => (
            <span key={i}>{word} </span>
          ))}
        </span>
      )}
    </p>
  )
}
