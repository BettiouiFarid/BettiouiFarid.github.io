// Shape of the Firestore document hero/settings.
export type HeroValues = {
  frames?: { shape?: 'portrait' | 'landscape' | 'square'; interval?: number; images?: string[] }[]
  tilt?: number
  speed?: number
  spacing?: number
}

// Shape of the Firestore document trail/settings.
export type TrailValues = { enabled?: boolean; color?: string; width?: number; opacity?: number; fadeSeconds?: number; length?: number }

export const trailDefaults = { enabled: true, color: '#efb818', width: 3, opacity: 1, fadeSeconds: 0.5, length: 600 }
export const trailLimits = {
  width: { min: 1, max: 20, step: 0.5, unit: 'px' },
  fadeSeconds: { min: 0.1, max: 3, step: 0.1, unit: 's' },
  opacity: { min: 0.1, max: 1, step: 0.05, unit: '' },
  length: { min: 50, max: 3000, step: 50, unit: 'px' },
}
