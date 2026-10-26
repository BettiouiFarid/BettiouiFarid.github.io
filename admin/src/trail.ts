// The same cursor-trail drawing as the website (src/components/CursorTrail.tsx), for the CMS control panel.
type Point = { x: number; y: number; t: number }
export type TrailSettings = { color: string; width: number; opacity: number; fadeSeconds: number; length: number }

export function attachTrail(canvas: HTMLCanvasElement, settings: () => TrailSettings) {
  const ctx = canvas.getContext('2d')!
  let points: Point[] = []
  let frame = 0

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const { width, height } = canvas.getBoundingClientRect()
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  const draw = (now: number) => {
    frame = 0
    const s = settings()
    points = points.filter((p) => now - p.t < s.fadeSeconds * 1000)
    let total = 0
    for (let i = points.length - 1; i > 0; i--) {
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
      if (total > s.length) {
        points = points.slice(i)
        break
      }
    }
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    if (points.length > 1) {
      ctx.lineWidth = s.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = s.opacity
      ctx.strokeStyle = s.color
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length - 1; i++) {
        ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + points[i + 1].x) / 2, (points[i].y + points[i + 1].y) / 2)
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
      ctx.stroke()
    }
    if (points.length) frame = requestAnimationFrame(draw)
  }

  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const last = points[points.length - 1]
    if (last && Math.hypot(x - last.x, y - last.y) < 2) return
    points.push({ x, y, t: performance.now() })
    if (!frame) frame = requestAnimationFrame(draw)
  }

  fit()
  window.addEventListener('resize', fit)
  canvas.addEventListener('pointermove', onMove)
  return () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('resize', fit)
    canvas.removeEventListener('pointermove', onMove)
  }
}
