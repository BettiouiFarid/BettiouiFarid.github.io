'use client'

import { useEffect, useRef } from 'react'

const ON_YELLOW = '#111111' // over the yellow footer the trail switches to the page's black
const MIN_STEP = 2 // px: ignore tiny movements so the line stays smooth

type Point = { x: number; y: number; t: number; color: string }

// A thin line of constant width drawn behind the mouse, erased from its tail. Mouse only: no trail on touch screens, and none
// when the visitor prefers reduced motion.
// Colour, thickness, opacity, duration and length come from the CMS (Hero animation → Cursor trail).
export function CursorTrail({
  color,
  width,
  opacity,
  fadeSeconds,
  length,
}: {
  color: string
  width: number // px
  opacity: number // 0.1 – 1
  fadeSeconds: number // seconds before a point of the line is erased
  length: number // px, longest the line can get
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!fine.matches || calm.matches) return

    const lifetime = fadeSeconds * 1000
    let points: Point[] = []
    let frame = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Draws one smooth, even line through the points (quadratic curves through the midpoints).
    const stroke = (run: Point[]) => {
      if (run.length < 2) return
      ctx.strokeStyle = run[0].color
      ctx.beginPath()
      ctx.moveTo(run[0].x, run[0].y)
      for (let i = 1; i < run.length - 1; i++) {
        const mx = (run[i].x + run[i + 1].x) / 2
        const my = (run[i].y + run[i + 1].y) / 2
        ctx.quadraticCurveTo(run[i].x, run[i].y, mx, my)
      }
      const last = run[run.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }

    const draw = (now: number) => {
      frame = 0
      points = points.filter((p) => now - p.t < lifetime)
      // Keep only the newest `length` pixels of the line; the older end is erased.
      let total = 0
      for (let i = points.length - 1; i > 0; i--) {
        total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
        if (total > length) {
          points = points.slice(i)
          break
        }
      }
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = opacity
      // The colour changes where the cursor crosses the yellow footer: draw each colour as its own run.
      let run: Point[] = []
      for (const p of points) {
        if (run.length && run[0].color !== p.color) {
          stroke(run)
          run = [run[run.length - 1]]
        }
        run.push(p)
      }
      stroke(run)
      // Keep going until every point has expired (a lone point is kept: the next one joins it).
      if (points.length) frame = requestAnimationFrame(draw)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const overFooter = e.target instanceof Element && e.target.closest('.footer')
      const last = points[points.length - 1]
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < MIN_STEP) return
      points.push({ x: e.clientX, y: e.clientY, t: performance.now(), color: overFooter ? ON_YELLOW : color })
      if (!frame) frame = requestAnimationFrame(draw)
    }
    // Leaving the window: let the trail fade out instead of leaving a stray tail.
    const onLeave = () => {
      points = []
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [color, width, opacity, fadeSeconds, length])

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />
}
