import { unstable_cache } from 'next/cache'
import { Timestamp } from 'firebase-admin/firestore'
import sharp from 'sharp'

import { db, download } from './firebase'
import { CMS_TAG } from './tags'
import type { Hero, HeroHolder, Pages, Post, Project, Site, Trail } from './types'

// Every read is cached under CMS_TAG and expired by the admin after each save
// (/api/revalidate). The timed revalidate is a backstop in case that call is missed.
const cached = <A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string, revalidate = 300) =>
  unstable_cache(fn, [key], { tags: [CMS_TAG], revalidate })

const iso = (v: unknown): string | null => (v instanceof Timestamp ? v.toDate().toISOString() : null)
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null)
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

const clamp = (v: unknown, fallback: number, min: number, max: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(max, Math.max(min, n))
}

const toHolders = (v: unknown): HeroHolder[] =>
  (Array.isArray(v) ? v : []).flatMap((h) => {
    const images = strings(h?.images)
    if (!images.length) return []
    const interval = Number(h.interval)
    return [{ shape: h.shape === 'landscape' || h.shape === 'square' ? h.shape : 'portrait', interval: interval >= 0.1 ? interval : 0.5, images }]
  })

export const getHero = cached(async (): Promise<Hero> => {
  const d = (await db.doc('hero/settings').get()).data() ?? {}
  return {
    frames: toHolders(d.frames),
    tilt: clamp(d.tilt, -30, -89, 89),
    speed: clamp(d.speed, 40, 0, 400),
    spacing: clamp(d.spacing, 370, 0, 2000),
  }
}, 'hero')

export const getTrail = cached(async (): Promise<Trail> => {
  const d = (await db.doc('trail/settings').get()).data() ?? {}
  return {
    enabled: d.enabled !== false,
    color: typeof d.color === 'string' && /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#efb818',
    width: clamp(d.width, 3, 1, 20),
    opacity: clamp(d.opacity, 1, 0.1, 1),
    fadeSeconds: clamp(d.fadeSeconds, 0.5, 0.1, 3),
    length: clamp(d.length, 600, 50, 3000),
  }
}, 'trail')

export const getSite = cached(async (): Promise<Site> => {
  const d = ((await db.doc('site/settings').get()).data() ?? {}) as Partial<Site>
  return { name: 'Farid Bettioui', email: '', socials: [], ...d } as Site
}, 'site')

export const getPages = cached(async (): Promise<Pages> => {
  const snap = await db.collection('pages').get()
  const doc = (id: string) => (snap.docs.find((s) => s.id === id)?.data() ?? {}) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  const about = doc('about')
  return {
    home: doc('home'),
    about: { ...about, photos: strings(about.photos), stats: about.stats ?? [], services: about.services ?? [] },
    projects: doc('projects'),
    stories: doc('stories'),
    contact: doc('contact'),
  }
}, 'pages')

const toProject = (id: string, d: FirebaseFirestore.DocumentData): Project => ({
  id,
  title: d.title ?? id,
  featured: Boolean(d.featured),
  cover: str(d.cover),
  summary: str(d.summary),
  industry: str(d.industry),
  client: str(d.client),
  service: str(d.service),
  date: iso(d.date),
  gallery: strings(d.gallery),
})

const toPost = (id: string, d: FirebaseFirestore.DocumentData): Post => ({
  id,
  title: d.title ?? id,
  publishedAt: iso(d.publishedAt) ?? new Date(0).toISOString(),
  category: d.category ?? '',
  cover: str(d.cover),
  content: d.content ?? '',
})

// Only published documents are public; status is filtered here (the collections are small).
export const getProjects = cached(async (): Promise<Project[]> => {
  const snap = await db.collection('projects').orderBy('order').get()
  return snap.docs.filter((s) => s.get('status') === 'published').map((s) => toProject(s.id, s.data()))
}, 'projects')

export const getPosts = cached(async (): Promise<Post[]> => {
  const snap = await db.collection('posts').orderBy('publishedAt', 'desc').get()
  return snap.docs.filter((s) => s.get('status') === 'published').map((s) => toPost(s.id, s.data()))
}, 'posts')

export const getProject = async (id: string) => (await getProjects()).find((p) => p.id === id) ?? null
export const getPost = async (id: string) => (await getPosts()).find((p) => p.id === id) ?? null

// Pixel size of a Storage image, so gallery images reserve their space before loading.
// Only the first 256 KB are fetched: image headers (with their dimensions) come first.
export const getImageSize = cached(
  async (path: string): Promise<{ width: number; height: number }> => {
    try {
      const { buffer: head } = await download(path, { start: 0, end: 256 * 1024 - 1 })
      const { width = 4, height = 3, orientation = 1 } = await sharp(head).metadata()
      return orientation >= 5 ? { width: height, height: width } : { width, height }
    } catch {
      return { width: 4, height: 3 }
    }
  },
  'image-size',
  86400,
)
