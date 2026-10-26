import { expect, test } from '@playwright/test'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

import { idToken, loginToAdmin } from '../helpers'

// These write to the local emulators, so they never run against the live site.
test.skip(!!process.env.BASE_URL, 'admin tests run against the local emulators only')
test.describe.configure({ mode: 'serial' })

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099'
const app = initializeApp({ projectId: 'demo-portfolio' }, 'tests')
const db = getFirestore(app)
const auth = getAuth(app)

test('editor can sign in and sees the content collections', async ({ page }) => {
  await loginToAdmin(page)
  for (const card of [/The work shown on the Projects page/, /Blog posts/, /Contact details/]) {
    await expect(page.getByText(card)).toBeVisible()
  }
  await page.goto('/admin/c/projects')
  await expect(page.getByText('TrigoCity').first()).toBeVisible()
  await expect(page.getByText('Buzzline').first()).toBeVisible()
})

test('someone who is not an editor cannot get in', async ({ page }) => {
  const email = 'stranger@example.com'
  await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: 'strangerpass', emailVerified: true }))

  await page.goto('/admin')
  await page.getByText('Email/password').click()
  await page.locator('input').first().fill(email)
  await page.getByRole('button', { name: /next|continue|login|sign/i }).first().click()
  await page.locator('input[type=password]').fill('strangerpass')
  await page.getByRole('button', { name: /login|sign in|log in/i }).first().click()
  await expect(page.getByText(/not allowed to edit/i)).toBeVisible()
  await expect(page.getByText(/Contact details/)).toHaveCount(0)
})

test('a text edited in the CMS appears on the site straight away', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  await loginToAdmin(page)
  await page.goto('/admin/c/site/settings')
  const field = page.locator('input[value="Less But More"]')
  await field.fill('Edited In Admin')
  await page.getByRole('button', { name: /^save/i }).first().click()

  try {
    await expect
      .poll(async () => (await (await request.get('/')).text()).includes('Edited In Admin'), { timeout: 15_000 })
      .toBe(true)
  } finally {
    // Always put the original text back, whatever happened above.
    await db.doc('site/settings').update({ footerMarquee: 'Less But More' })
    await request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  }
})

test('publishing a draft makes it public, unpublishing hides it again', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const revalidate = () => request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })

  expect((await page.request.get('/work/hi')).status()).toBe(404)
  try {
    await db.doc('projects/hi').update({ status: 'published' })
    expect((await revalidate()).status()).toBe(204)
    expect((await page.request.get('/work/hi')).status()).toBe(200)
  } finally {
    await db.doc('projects/hi').update({ status: 'draft' })
    await revalidate()
  }
  expect((await page.request.get('/work/hi')).status()).toBe(404)
})

test('the revalidate endpoint only accepts editors', async ({ request }) => {
  expect((await request.post('/api/revalidate')).status()).toBe(401)
  expect((await request.post('/api/revalidate', { headers: { Authorization: 'Bearer nonsense' } })).status()).toBe(401)

  const email = 'stranger@example.com'
  await auth.getUserByEmail(email).catch(() => auth.createUser({ email, password: 'strangerpass', emailVerified: true }))
  const stranger = await idToken(email, 'strangerpass')
  expect((await request.post('/api/revalidate', { headers: { Authorization: `Bearer ${stranger}` } })).status()).toBe(403)
})

test('Firestore and Storage are closed to the public', async ({ request }) => {
  const docs = await request.get('http://127.0.0.1:8080/v1/projects/demo-portfolio/databases/(default)/documents/projects')
  expect(docs.status()).toBe(403)
  const write = await request.patch('http://127.0.0.1:8080/v1/projects/demo-portfolio/databases/(default)/documents/projects/hack', {
    data: { fields: { title: { stringValue: 'x' } } },
  })
  expect(write.status()).toBe(403)
  const file = await request.get(
    'http://127.0.0.1:9199/v0/b/demo-portfolio.appspot.com/o/media%2FiSMrhE2g4CPvnzsF6dKQZz742oM.jpg?alt=media',
  )
  expect(file.status()).toBe(403)
})

// ---- Pages: each page is its own entry with its own ID and fields ----

test('each page has its own entry, showing only its own fields', async ({ page }) => {
  await loginToAdmin(page)
  await page.goto('/admin/c/pages')
  for (const id of ['home', 'about', 'projects', 'stories', 'contact']) await expect(page.getByText(id, { exact: true }).first()).toBeVisible()

  await page.goto('/admin/c/pages/about')
  await expect(page.getByText('Services', { exact: true }).first()).toBeAttached()
  await expect(page.getByText('Role line', { exact: true })).toHaveCount(0)

  await page.goto('/admin/c/pages/home')
  await expect(page.getByText('Role line', { exact: true }).first()).toBeAttached()
  await expect(page.getByText('Services', { exact: true })).toHaveCount(0)

  await page.goto('/admin/c/pages/projects')
  await expect(page.getByText('Heading, line 1', { exact: true }).first()).toBeAttached()
  await expect(page.getByText('Services', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Role line', { exact: true })).toHaveCount(0)
})

test('editing one page changes only that page', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  await loginToAdmin(page)
  await page.goto('/admin/c/pages/projects')
  const intro = page.locator('textarea').nth(1) // Search description is the first text area, Intro the second
  await expect(intro).toHaveValue(/Selection of experienced/)
  await intro.fill('Edited intro of the projects page')
  await page.getByRole('button', { name: /^save/i }).first().click()

  try {
    await expect
      .poll(async () => (await (await request.get('/projects')).text()).includes('Edited intro of the projects page'), { timeout: 15_000 })
      .toBe(true)
    // The other pages keep their own texts.
    expect(await (await request.get('/stories')).text()).toContain('Read our stories about design')
    expect(await (await request.get('/stories')).text()).not.toContain('Edited intro of the projects page')
  } finally {
    await db.doc('pages/projects').update({ intro: 'Selection of experienced product design solutions and innovative digital concepts' })
    await request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  }
})

test('each page can set its own browser title, description and share image', async ({ request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const refresh = () => request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  try {
    await db.doc('pages/about').update({ metaTitle: 'Meet Farid', metaDescription: 'A custom description for the about page.', shareImage: 'media/iSMrhE2g4CPvnzsF6dKQZz742oM.jpg' })
    await refresh()
    const about = await (await request.get('/about')).text()
    expect(about).toContain('<title>Meet Farid — Farid Bettioui</title>')
    expect(about).toContain('A custom description for the about page.')
    expect(about).toMatch(/og:image" content="[^"]*\/img\/media\/iSMrhE2g4CPvnzsF6dKQZz742oM\.jpg/)
    // Other pages are untouched.
    expect(await (await request.get('/projects')).text()).toContain('<title>Projects — Farid Bettioui</title>')
  } finally {
    await db.doc('pages/about').update({ metaTitle: 'About', metaDescription: 'Brand designer and artistic director in the theatre and film industry — branding, brand management and visual design.', shareImage: null })
    await refresh()
  }
})

// ---- Hero animation and cursor trail settings drive the live site ----

test('hero animation settings change the site: tilt, speed, spacing, trail', async ({ page, request, isMobile }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const refresh = () => request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  const original = (await db.doc('hero/settings').get()).data()!
  const originalTrail = (await db.doc('trail/settings').get()).data()!
  try {
    await db.doc('hero/settings').update({ tilt: -15, speed: 80, spacing: 200 })
    await db.doc('trail/settings').update({ width: 9, opacity: 0.5, length: 100, color: '#ff0000' })
    await refresh()
    await page.goto('/', { waitUntil: 'networkidle' })
    const strip = page.locator('.hero-strip')
    await expect(strip).toHaveCSS('--tilt', '-15deg')
    const loop = await strip.evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--loop')))
    expect(loop).toBe(232 + 400 + 232 + 400 + 4 * 200) // four frames + four gaps
    expect(await strip.evaluate((el) => getComputedStyle(el).getPropertyValue('--dur').trim())).toBe(`${loop / 80}s`)

    if (isMobile) return // touch screens have no cursor trail

    // The trail: red, half see-through, thick, and cut off at 100px of length.
    await page.evaluate(() => {
      for (let i = 0; i <= 60; i++) {
        window.dispatchEvent(new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 200 + i * 10, clientY: 500, bubbles: true }))
      }
    })
    await page.waitForTimeout(60)
    const trail = await page.locator('canvas.cursor-trail').evaluate((c: HTMLCanvasElement) => {
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
      let minX = Infinity, maxX = -1, thickness = 0, color: number[] = []
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 0) { minX = Math.min(minX, x); maxX = Math.max(maxX, x) }
      }
      const midX = Math.round((minX + maxX) / 2)
      for (let y = 0; y < c.height; y++) {
        const i = (y * c.width + midX) * 4
        if (d[i + 3] > 0) thickness++
        if (d[i + 3] > (color[3] ?? 0)) color = [d[i], d[i + 1], d[i + 2], d[i + 3]] // the line's core, not its soft edge
      }
      return { length: maxX - minX, thickness, color }
    })
    expect(trail.length).toBeLessThan(130) // 100px of line plus the round ends
    expect(trail.length).toBeGreaterThan(60)
    expect(trail.thickness).toBeGreaterThanOrEqual(8)
    expect(trail.color.slice(0, 3)).toEqual([255, 0, 0])
    expect(Math.abs(trail.color[3] - 128)).toBeLessThan(6) // opacity 0.5
  } finally {
    await db.doc('hero/settings').set(original)
    await db.doc('trail/settings').set(originalTrail)
    await refresh()
  }
})

test('the cursor trail can be switched off', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const refresh = () => request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  try {
    await db.doc('trail/settings').update({ enabled: false })
    await refresh()
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('canvas.cursor-trail')).toHaveCount(0)
  } finally {
    await db.doc('trail/settings').update({ enabled: true })
    await refresh()
  }
})

test('the cursor trail control panel saves its sliders', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const original = (await db.doc('trail/settings').get()).data()!
  await loginToAdmin(page)
  await page.goto('/admin/c/trail/settings')
  await page.getByText('Control panel', { exact: true }).first().click()
  const sliders = page.locator('input[type=range]') // thickness, duration, opacity, length
  await expect(sliders).toHaveCount(4)
  await sliders.nth(0).fill('7')
  await sliders.nth(1).fill('1.5')
  await sliders.nth(2).fill('0.6')
  await sliders.nth(3).fill('900')
  await expect(page.getByText('7px', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^save/i }).first().click()

  try {
    await expect
      .poll(async () => (await db.doc('trail/settings').get()).data()!, { timeout: 15_000 })
      .toMatchObject({ width: 7, fadeSeconds: 1.5, opacity: 0.6, length: 900 })
  } finally {
    await db.doc('trail/settings').set(original)
    await request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  }
})

test('the hero preview tab plays the frames', async ({ page }) => {
  await loginToAdmin(page)
  await page.goto('/admin/c/hero/settings')
  await page.getByText('Preview', { exact: true }).first().click()
  await expect(page.locator('.hp-holder').first()).toBeAttached()
  await expect.poll(async () => page.locator('.hp-flip img[src]').count()).toBeGreaterThan(10) // pictures resolved from Storage
})

test('a frame can be square', async ({ page, request }) => {
  const token = await idToken('admin@example.com', 'localpassword')
  const refresh = () => request.post('/api/revalidate', { headers: { Authorization: `Bearer ${token}` } })
  const original = (await db.doc('hero/settings').get()).data()!.frames
  try {
    await db.doc('hero/settings').update({ frames: original.map((f: object, i: number) => (i === 0 ? { ...f, shape: 'square' } : f)) })
    await refresh()
    await page.goto('/', { waitUntil: 'networkidle' })
    const holder = page.locator('.holder.square').first()
    await expect(holder).toBeAttached()
    const box = await holder.evaluate((el) => ({ w: el.clientWidth, h: el.clientHeight }))
    expect(box.w).toBe(box.h)
    const loop = await page.locator('.hero-strip').evaluate((el) => Number(getComputedStyle(el).getPropertyValue('--loop')))
    expect(loop).toBe(312 + 400 + 232 + 400 + 4 * 370)
  } finally {
    await db.doc('hero/settings').update({ frames: original })
    await refresh()
  }
})
