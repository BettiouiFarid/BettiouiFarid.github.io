import { useStorageSource } from '@firecms/core'
import type { EntityCustomViewParams } from '@firecms/core'
import { CSSProperties, useEffect, useRef, useState } from 'react'

import type { HeroValues } from './hero'

const width = (shape?: string) => (shape === 'landscape' ? 400 : shape === 'square' ? 312 : 232)

// Same layout and timing as the website's hero (see src/app/(frontend)/styles.css), scaled to fit.
const css = `
.hp-track { position:absolute; left:calc(2116 * var(--u)); top:0; display:flex; align-items:flex-start; animation: hp-drift var(--dur) linear infinite }
.hp-still .hp-track { animation:none }
@keyframes hp-drift { to { transform: translateX(calc(var(--loop) * -1 * var(--u))) } }
.hp-holder { position:relative; flex:none; margin-left: calc(var(--gap) * var(--u)) }
.hp-flip { position:absolute; inset:0; overflow:hidden; border-radius:4px }
.hp-landscape .hp-flip { inset: calc(120 * var(--u)) 0 auto; height: calc(256 * var(--u)) }
.hp-flip img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0; animation-duration: calc(var(--n) * var(--s)); animation-timing-function: step-end; animation-iteration-count: infinite; animation-delay: calc((var(--i) - var(--n)) * var(--s)) }
.hp-flip img:first-child { opacity:1 }
.hp-flip[data-n='1'] img { animation:none }
.hp-flip[data-n='2'] img { animation-name: hp-2 } .hp-flip[data-n='3'] img { animation-name: hp-3 }
.hp-flip[data-n='4'] img { animation-name: hp-4 } .hp-flip[data-n='5'] img { animation-name: hp-5 } .hp-flip[data-n='6'] img { animation-name: hp-6 }
@keyframes hp-2 { 0% {opacity:1} 50% {opacity:0} 100% {opacity:0} }
@keyframes hp-3 { 0% {opacity:1} 33.333% {opacity:0} 100% {opacity:0} }
@keyframes hp-4 { 0% {opacity:1} 25% {opacity:0} 100% {opacity:0} }
@keyframes hp-5 { 0% {opacity:1} 20% {opacity:0} 100% {opacity:0} }
@keyframes hp-6 { 0% {opacity:1} 16.666% {opacity:0} 100% {opacity:0} }
`

export function HeroPreview({ formContext }: EntityCustomViewParams<HeroValues>) {
  const values = formContext.values as HeroValues
  const frames = (values.frames ?? []).filter((f) => f.images?.length)
  const tilt = values.tilt ?? -30
  const speed = values.speed ?? 40
  const spacing = values.spacing ?? 370
  const storage = useStorageSource()
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [urls, setUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(() => setScale(el.clientWidth / 1440))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const paths = [...new Set(frames.flatMap((f) => f.images ?? []))].filter((p) => !(p in urls))
  const wanted = paths.join('|')
  useEffect(() => {
    paths.forEach((path) =>
      storage.getDownloadURL(path).then(({ url }) => url && setUrls((current) => ({ ...current, [path]: url })), () => undefined),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted])

  const loop = frames.reduce((sum, f) => sum + width(f.shape) + spacing, 0)
  const copies = loop > 0 ? Math.ceil(4000 / loop) + 1 : 0
  const style = {
    '--u': `${scale}px`,
    '--tilt': `${tilt}deg`,
    '--gap': spacing,
    '--loop': loop,
    '--dur': `${speed > 0 ? loop / speed : 0}s`,
  } as CSSProperties

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto', width: '100%' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 600 }}>Preview</h2>
      <p style={{ margin: '0 0 16px', opacity: 0.7 }}>
        The hero animation with your current (unsaved) settings. Changes you make in the other tabs show up here straight away.
      </p>
      <div
        ref={box}
        className={speed > 0 ? '' : 'hp-still'}
        style={{ ...style, position: 'relative', width: '100%', aspectRatio: '1440 / 900', overflow: 'hidden', background: '#111111', borderRadius: 8 }}
      >
        <style>{css}</style>
        <div style={{ position: 'absolute', left: '50%', top: '45%', width: 0, height: 0 }}>
          <div
            style={{
              position: 'absolute',
              left: `calc(-4116 * var(--u))`,
              top: `calc(-250 * var(--u))`,
              width: `calc(8232 * var(--u))`,
              height: `calc(500 * var(--u))`,
              transform: 'rotate(var(--tilt))',
            }}
          >
            <div className="hp-track">
              {Array.from({ length: copies }).flatMap((_, copy) =>
                frames.map((frame, i) => (
                  <div
                    key={`${copy}-${i}`}
                    className={`hp-holder hp-${frame.shape ?? 'portrait'}`}
                    style={{
                      width: `calc(${width(frame.shape)} * var(--u))`,
                      height: `calc(${frame.shape === 'landscape' ? 496 : 312} * var(--u))`,
                    }}
                  >
                    <div className="hp-flip" data-n={frame.images!.length} style={{ '--n': frame.images!.length, '--s': `${frame.interval ?? 0.5}s` } as CSSProperties}>
                      {frame.images!.map((path, j) => (
                        <img key={path + j} src={urls[path]} alt="" style={{ '--i': j } as CSSProperties} />
                      ))}
                    </div>
                  </div>
                )),
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            fontSize: `calc(108 * var(--u))`,
            lineHeight: 0.96,
            textAlign: 'center',
            color: '#ebebeb',
            mixBlendMode: 'difference',
            textTransform: 'uppercase',
            pointerEvents: 'none',
          }}
        >
          <span>
            Make Art
            <br />
            Not Content
          </span>
        </div>
      </div>
    </div>
  )
}
