import type { EntityCustomViewParams } from '@firecms/core'
import { useEffect, useRef } from 'react'

import { attachTrail } from './trail'
import { TrailValues, trailDefaults, trailLimits } from './hero'

// Control panel for the website's cursor trail: change a value and draw in the dark area to feel it.
// "Save" (top right) publishes the settings to the live site.
export function TrailPanel({ formContext }: EntityCustomViewParams<TrailValues>) {
  const values = formContext.values as TrailValues
  const trail = { ...trailDefaults, ...values }
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const latest = useRef(trail)
  latest.current = trail

  useEffect(() => (canvasRef.current ? attachTrail(canvasRef.current, () => latest.current) : undefined), [])

  const set = (key: keyof typeof trailDefaults, value: unknown) => formContext.setFieldValue(key, value)

  const slider = (key: 'width' | 'fadeSeconds' | 'opacity' | 'length', label: string, hint: string) => {
    const { min, max, step, unit } = trailLimits[key]
    return (
      <label className="trail-field" title={hint}>
        <span>
          <strong>{label}</strong>
          <br />
          <small style={{ opacity: 0.65 }}>{hint}</small>
        </span>
        <input type="range" min={min} max={max} step={step} value={trail[key]} onChange={(e) => set(key, Number(e.target.value))} />
        <output style={{ fontVariantNumeric: 'tabular-nums' }}>
          {trail[key]}
          {unit}
        </output>
      </label>
    )
  }

  return (
    <div style={{ padding: '0 24px 24px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
      <h2 style={{ margin: '24px 0 4px', fontSize: 20, fontWeight: 600 }}>Cursor trail</h2>
      <p style={{ margin: '0 0 16px', opacity: 0.7 }}>
        The line that follows the visitor’s mouse on the website. Draw in the dark area below while you move the sliders. Press <strong>Save</strong> to publish.
      </p>

      {/* Stays at the top while you move the sliders, so you can try each change straight away. */}
      <div className="bg-surface-50 dark:bg-surface-900" style={{ position: 'sticky', top: 0, zIndex: 5, padding: '4px 0 16px' }}>
        <div className="trail-pad">
          <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#808080', pointerEvents: 'none' }}>
            Move the mouse here
          </span>
          <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
      </div>

      <label style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0' }}>
        <input type="checkbox" checked={trail.enabled} onChange={(e) => set('enabled', e.target.checked)} />
        <strong>Show the cursor trail on the website</strong>
      </label>

      {slider('width', 'Thickness', 'How thick the line is.')}
      {slider('fadeSeconds', 'Duration', 'How long a part of the line stays before it is erased.')}
      {slider('opacity', 'Opacity', '1 is solid, lower is see-through.')}
      {slider('length', 'Length', 'The longest the line can get, however fast you move.')}

      <label className="trail-field">
        <span>
          <strong>Colour</strong>
        </span>
        <input type="color" value={trail.color} onChange={(e) => set('color', e.target.value)} style={{ width: 56, height: 32, padding: 0, border: 0, background: 'none' }} />
        <output style={{ fontVariantNumeric: 'tabular-nums' }}>{trail.color}</output>
      </label>

      <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
        <button
          type="button"
          onClick={() => Object.entries(trailDefaults).forEach(([k, v]) => set(k as keyof typeof trailDefaults, v))}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid currentColor', background: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          Reset to defaults
        </button>
      </div>

    </div>
  )
}
