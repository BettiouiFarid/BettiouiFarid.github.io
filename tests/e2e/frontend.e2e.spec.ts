import { expect, test } from '@playwright/test'

const pages = [
  '/',
  '/projects',
  '/about',
  '/stories',
  '/contact',
  '/work/trigocity',
  '/work/buzzline-branding',
  '/work/s412',
  '/work/terminal-Eat-branding',
  '/blog/color-theory-in-design',
  '/blog/abstract-concept-in-design',
]

for (const url of pages) {
  test(`${url} renders with no errors or broken images`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    const failed: string[] = []
    page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))

    const response = await page.goto(url, { waitUntil: 'networkidle' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('footer')).toContainText('Doha, Qatar')

    // Scroll through so lazy images load, then check none are broken.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 50))
      }
    })
    await page.waitForLoadState('networkidle')
    const broken = await page.$$eval('img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    )
    expect(broken).toEqual([])
    expect(failed).toEqual([])
    expect(errors).toEqual([])
  })
}

test('home shows hero, featured projects and stories', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero h1')).toContainText(/make art/i)
  await expect(page.getByRole('link', { name: /TrigoCity/ })).toBeVisible()
  await expect(page.locator('#stories .story-row')).toHaveCount(5)
  await page.getByRole('link', { name: 'View All Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.locator('.project-grid .tile')).toHaveCount(7)
})

test('menu opens, navigates and closes', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: 'Open menu' })
  await button.click()
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav).toBeVisible()
  await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  await nav.getByRole('link', { name: 'Stories' }).click()
  await expect(page).toHaveURL(/\/stories$/)
  await expect(nav).toBeHidden()
})

test('project page shows details and related projects', async ({ page }) => {
  await page.goto('/work/trigocity')
  await expect(page.locator('h1')).toHaveText('TrigoCity')
  await expect(page.locator('.work-meta')).toContainText('October 2023')
  await expect(page.locator('.gallery img')).toHaveCount(4)
  await expect(page.locator('.related .tile')).toHaveCount(3)
})

test('story page renders rich text and pull quote', async ({ page }) => {
  await page.goto('/blog/color-theory-in-design')
  await expect(page.locator('.post-header time')).toHaveText('May 18, 2024')
  await expect(page.locator('.prose blockquote')).toContainText('Primary colors form the basic foundations')
  await expect(page.locator('.recent-card')).toHaveCount(2)
})

test('unknown pages and unpublished drafts return 404', async ({ page }) => {
  for (const url of ['/does-not-exist', '/work/hi', '/blog/nope']) {
    const response = await page.goto(url)
    expect(response?.status(), url).toBe(404)
    await expect(page.getByText('This page doesn’t exist')).toBeVisible()
  }
})

test('images are served resized from Storage, and only from media/', async ({ request }) => {
  const small = await request.get('/img/media/iSMrhE2g4CPvnzsF6dKQZz742oM.jpg?w=320')
  expect(small.status()).toBe(200)
  expect(small.headers()['content-type']).toBe('image/webp')
  const large = await request.get('/img/media/iSMrhE2g4CPvnzsF6dKQZz742oM.jpg?w=1600')
  expect((await large.body()).length).toBeGreaterThan((await small.body()).length)
  expect((await request.get('/img/media/does-not-exist.jpg')).status()).toBe(404)
  expect((await request.get('/img/other/x.jpg')).status()).toBe(404)
})

test('hero: four photo frames, each flipping through its own pictures', async ({ page }) => {
  await page.goto('/')
  // Four frames (3 identical repeats of the strip), with 3, 5, 3 and 3 pictures.
  const firstRepeat = page.locator('.hero-track .holder:nth-child(-n+4) .flip')
  await expect(firstRepeat).toHaveCount(4)
  expect(await firstRepeat.evaluateAll((els) => els.map((e) => e.querySelectorAll('img').length))).toEqual([3, 5, 3, 3])
  await expect(page.locator('.holder.portrait')).toHaveCount(6)
  await expect(page.locator('.holder.landscape')).toHaveCount(6)

  // Over ~2.2s every frame shows each of its pictures (the slowest frame changes every 0.7s).
  const seen = await page.evaluate(async () => {
    const flips = [...document.querySelectorAll('.hero-track .holder:nth-child(-n+4) .flip')]
    const visited = flips.map(() => new Set<number>())
    const end = performance.now() + 2200
    while (performance.now() < end) {
      flips.forEach((f, i) => {
        const index = [...f.querySelectorAll('img')].findIndex((im) => getComputedStyle(im).opacity === '1')
        if (index >= 0) visited[i].add(index)
      })
      await new Promise((r) => setTimeout(r, 30))
    }
    return visited.map((s) => s.size)
  })
  expect(seen).toEqual([3, 5, 3, 3])
})

test('hero: all copies of a frame show the same picture at the same time', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(700)
  const indexes = await page.evaluate(() =>
    [0, 1, 2].map((copy) =>
      [...document.querySelectorAll('.hero-track .holder')]
        .slice(copy * 4, copy * 4 + 4)
        .map((h) => [...h.querySelectorAll('img')].findIndex((im) => getComputedStyle(im).opacity === '1')),
    ),
  )
  expect(indexes[1]).toEqual(indexes[0])
  expect(indexes[2]).toEqual(indexes[0])
})

test('cursor trail is a thin even line in the crown yellow that erases itself', async ({ page, isMobile }) => {
  await page.goto('/', { waitUntil: 'networkidle' }) // the trail listens for the mouse once the page has hydrated
  const canvas = page.locator('canvas.cursor-trail')
  if (isMobile) {
    await expect(canvas).toBeHidden() // touch screens get no trail
    return
  }
  // Draw a straight diagonal 300,300 → 600,444 (slope 0.48) in one instant burst of mouse moves, so the
  // measurements below don't depend on how fast the test runner can move the real mouse.
  await page.evaluate(() => {
    for (let i = 0; i <= 30; i++) {
      window.dispatchEvent(
        new PointerEvent('pointermove', { pointerType: 'mouse', clientX: 300 + i * 10, clientY: 300 + i * 4.8, bubbles: true }),
      )
    }
  })
  await page.waitForTimeout(60)

  const stroke = await canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    const scale = c.width / window.innerWidth
    // Measure the line's thickness straight up and down through the middle of the path (x=450, y≈372).
    const x = Math.round(450 * scale)
    const column = ctx.getImageData(x, 0, 1, c.height).data
    const rows: number[] = []
    for (let y = 0; y < c.height; y++) if (column[y * 4 + 3] > 200) rows.push(y)
    const mid = rows.length ? rows[Math.floor(rows.length / 2)] : 0
    const px = ctx.getImageData(x, mid, 1, 1).data
    return { thickness: rows.length / scale, color: [px[0], px[1], px[2], px[3]] }
  })
  // Opaque, #efb818, and thin: a 3px line is about 3 / cos(slope) ≈ 3.3px tall on this diagonal.
  expect(stroke.color.slice(0, 3)).toEqual([0xef, 0xb8, 0x18])
  expect(stroke.color[3]).toBe(255)
  expect(stroke.thickness).toBeGreaterThan(2)
  expect(stroke.thickness).toBeLessThan(5)

  // The same thickness along the whole line (no taper): compare near the start and near the head.
  const widths = await canvas.evaluate((c: HTMLCanvasElement) => {
    const ctx = c.getContext('2d')!
    const scale = c.width / window.innerWidth
    const thick = (cssX: number) => {
      const col = ctx.getImageData(Math.round(cssX * scale), 0, 1, c.height).data
      let n = 0
      for (let y = 0; y < c.height; y++) if (col[y * 4 + 3] > 200) n++
      return n / scale
    }
    return [thick(340), thick(450), thick(570)]
  })
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1)

  // The tail is erased once the mouse stops, and the canvas never blocks clicks.
  await page.waitForTimeout(900)
  const painted = await canvas.evaluate((c: HTMLCanvasElement) => {
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
    return n
  })
  expect(painted).toBe(0)
  await expect(canvas).toHaveCSS('pointer-events', 'none')

  // With the real (slow) mouse the line builds up too: events arrive one per frame or slower.
  await page.mouse.move(300, 300)
  for (let i = 1; i <= 8; i++) await page.mouse.move(300 + i * 30, 300 + i * 14)
  await page.waitForTimeout(40)
  const live = await canvas.evaluate((c: HTMLCanvasElement) => {
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
    return n
  })
  expect(live).toBeGreaterThan(300)
})

test('contact page shows the email, details and links from the CMS', async ({ page }) => {
  await page.goto('/contact')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/Let’s make/i)
  await expect(page.getByRole('link', { name: 'contact@faridbettioui.art' }).first()).toHaveAttribute('href', 'mailto:contact@faridbettioui.art')
  const details = page.getByLabel('Contact details')
  await expect(details.getByText('Doha, Qatar', { exact: true })).toBeVisible()
  await expect(details.getByRole('link', { name: 'Behance' })).toHaveAttribute('href', /behance\.net/)
  await expect(page).toHaveTitle(/Contact/)
})
