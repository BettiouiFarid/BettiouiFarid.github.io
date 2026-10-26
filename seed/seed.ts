// Imports the content of the old Framer site into Firestore + Storage, and creates the first editor.
//
//   npm run seed                      local emulators (start them with `npm run emulators`)
//   SEED_RESET=1 npm run seed         wipe projects, stories, settings and media first
//   SEED_TARGET=production ADMIN_EMAIL=you@gmail.com npm run seed    the real Firebase project (see DEPLOY.md)
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const production = process.env.SEED_TARGET === 'production'
if (!production) {
  process.env.GCLOUD_PROJECT ??= 'demo-portfolio'
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:9199'
  process.env.FIREBASE_STORAGE_BUCKET ??= 'demo-portfolio.appspot.com'
}
const adminEmail = (process.env.ADMIN_EMAIL ?? (production ? '' : 'admin@example.com')).toLowerCase()
if (!adminEmail) throw new Error('Set ADMIN_EMAIL to the Google account that should be able to edit the site.')

const dir = path.dirname(fileURLToPath(import.meta.url))
const app = initializeApp({ storageBucket: process.env.FIREBASE_STORAGE_BUCKET })
const db = getFirestore(app)
const bucket = getStorage(app).bucket()
const posts: {
  slug: string; title: string; date: string; category: string; cover: string
  intro: string[]; quote: string; body: string[]
}[] = JSON.parse(readFileSync(path.join(dir, 'posts.json'), 'utf8'))

if (process.env.SEED_RESET) {
  for (const name of ['projects', 'posts', 'site', 'hero', 'trail', 'pages']) await db.recursiveDelete(db.collection(name))
  await bucket.deleteFiles({ prefix: 'media/' })
} else if (!(await db.collection('projects').limit(1).get()).empty) {
  console.log('Firestore already has content; run with SEED_RESET=1 to replace it.')
  process.exit(0)
}

// ---- Images: uploaded once each, referenced by Storage path ----
const types: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
}
const uploaded = new Set<string>()
async function image(file: string) {
  const destination = `media/${file}`
  if (!uploaded.has(file)) {
    await bucket.upload(path.join(dir, 'images', file), {
      destination,
      metadata: { contentType: types[path.extname(file).toLowerCase()], cacheControl: 'public, max-age=3600' },
    })
    uploaded.add(file)
  }
  return destination
}

// ---- Projects, in the order of the projects page ----
const projects = [
  { id: 'aademti', title: 'Aademti', industry: 'Associations', client: 'Gouverment', service: 'Branding', date: '2022-09' },
  {
    id: 'trigocity', title: 'TrigoCity', featured: true, industry: 'App', client: 'Trigo', date: '2023-10',
    images: ['iSMrhE2g4CPvnzsF6dKQZz742oM.jpg', 'L92yhhlRixbRRPOez9MXHpejqC8.jpg', 'KWh8AdR9IufMlXE0cElEfbIxJQ.jpg', 'xHO6GRsMnAgOjH1i5esUbFPTpdc.jpg'],
  },
  { id: 'express-box', title: 'Express Box', summary: 'des', industry: 'Delivery', client: 'Express Box', service: 'Branding', date: '2022-11' },
  { id: 'ictalks', title: 'IcTalks', industry: 'Web Show', client: 'ICT Maghreb', service: 'Branding', date: '2023-03' },
  {
    id: 'buzzline-branding', title: 'Buzzline', featured: true,
    summary: 'A logo serves as a graphic symbol, badge, or insignia executed to elevate and foster public appreciation and recognition. It could take on a symbolic or artistic form or may include the term it represents, as seen in a logotype.',
    industry: 'StartUp', client: 'Buzzline', service: 'Branding', date: '2024-06',
    images: ['t4P6d3JFkT491RJK13Htg0O9xTE.jpg', 'D6Gt64CxlbVF9VkUErDwoyTUv6Q.jpg', 'LLwpic8FrKv4kZQR0WKfYTYf8.jpg', 'QWOq5XwIxs4Vi6zwTqO0csc64f4.jpg', '9c2f1uS71G2RL1hKAKCxRzQag.jpg', 'DofSm9H8h87IAGT1yqA2hVvV2Io.jpg'],
  },
  { id: 'terminal-Eat-branding', title: 'Terminal Eat', summary: 'des', industry: 'Food', client: 'Backechi', service: 'Branding', date: '2023-07' },
  { id: 's412', title: 'Studio 412', featured: true, industry: 'Agency', client: 'Studio 412', service: 'Branding', date: '2024-01' },
  // Empty test entry from Framer: kept as a draft, so it isn't shown on the site.
  { id: 'hi', title: 'test', draft: true },
]

for (const [order, { id, images = [], draft, date, featured, ...p }] of projects.entries()) {
  const gallery = await Promise.all(images.map(image))
  await db.doc(`projects/${id}`).set({
    ...p,
    status: draft ? 'draft' : 'published',
    featured: Boolean(featured),
    order: (order + 1) * 10,
    date: date ? Timestamp.fromDate(new Date(`${date}-01T00:00:00Z`)) : null,
    cover: gallery[0] ?? null,
    gallery,
  })
}

// ---- Stories: the pull quote becomes a markdown blockquote between the paragraphs ----
for (const post of posts) {
  const content = [...post.intro, ...(post.quote ? [`> ${post.quote}`] : []), ...post.body].join('\n\n')
  await db.doc(`posts/${post.slug}`).set({
    title: post.title,
    status: 'published',
    category: post.category,
    publishedAt: Timestamp.fromDate(new Date(`${post.date} UTC`)),
    cover: await image(post.cover),
    content,
  })
}

// ---- Hero animation: the four frames of the Framer hero (in drift order) ----
await db.doc('hero/settings').set({
  frames: await Promise.all(
    [
      { shape: 'portrait', interval: 0.5, images: ['yRH6oBWvtBHJTtncx8vyd5fro.webp', 'QbxX35gdJRi56o6AWt6rKAOgos.webp', 'xdD0A8Lxe4JM5xJwSoCeUbxqAjk.webp'] },
      { shape: 'landscape', interval: 0.4, images: ['HItUQ3Xx6TJNYgmIK1JWTLOQRuI.webp', 'R7TLjFiziPaZuz34pqGYhSeCoGM.webp', 'FlpAnHVvB6O9mRWFHedBfafw92Q.webp', 'AF7Ixf2mKjdrOyrivRuShEI2fGs.webp', '81zZLMCvBdeBgIBVesCIoZI5g3I.webp'] },
      { shape: 'portrait', interval: 0.7, images: ['kyQ250CFjKljZ0VVtafeSw5YPc.webp', '6EnKAdFmwRIhcEohVRqczyXArfk.webp', 'yRH6oBWvtBHJTtncx8vyd5fro.webp'] },
      { shape: 'landscape', interval: 0.5, images: ['AlcmjN1iNybnpYBk45H52op6DW8.webp', '81zZLMCvBdeBgIBVesCIoZI5g3I.webp', 'KLHbWjcdZhMgyE0umzoh3mng.webp'] },
    ].map(async (frame) => ({ ...frame, images: await Promise.all(frame.images.map(image)) })),
  ),
  tilt: -30,
  speed: 40,
  spacing: 370,
})

// ---- Cursor trail: its own settings ----
await db.doc('trail/settings').set({ enabled: true, color: '#efb818', width: 3, opacity: 1, fadeSeconds: 0.5, length: 600 })

// ---- Site settings: global details (each page's own texts are in pages/*) ----
await db.doc('site/settings').set({
  name: 'Farid Bettioui',
  description: 'Farid Bettioui — art director and multidisciplinary designer in Doha, Qatar. Branding, campaigns and visual systems across the GCC, Europe and North Africa.',
  email: 'contact@faridbettioui.art',
  website: 'Faridbettioui.art',
  location: 'Doha, Qatar',
  socials: [
    { label: 'Behance', url: 'https://www.behance.net/faridbettioui' },
    { label: 'Instagram', url: 'https://www.instagram.com/faridbettioui.art/' },
    { label: 'Linkedin', url: 'https://www.linkedin.com/in/faridbettioui/' },
  ],
  copyright: 'Make Art Not Content',
  footerMarquee: 'Less But More',
})

// ---- Pages: one document per page, each controlled on its own ----
await db.doc('pages/home').set({
  metaTitle: 'Farid Bettioui — Make Art Not Content',
  metaDescription: 'Art director and multidisciplinary designer in Doha, Qatar. Selected branding, campaigns and visual systems.',
  role: 'A R T Director — Multidisciplinary Designer',
  headingLine1: 'Make Art',
  headingLine2: 'Not Content',
  paragraph: {
    lead: "Senior graphic designer moving into creative direction — currently leading visual communication for Qatar's Ministry of Commerce and Industry with Grey Doha.",
    rest: 'Eight years across the GCC, Europe and North Africa turning business and communication problems into concepts, campaigns and visual systems, with teams and multi-brand portfolios under my direction.',
  },
})

await db.doc('pages/about').set({
  metaTitle: 'About',
  metaDescription: 'Brand designer and artistic director in the theatre and film industry — branding, brand management and visual design.',
  eyebrow: 'Since — Y:2015',
  headingLine1: 'Hi, I’m',
  headingLine2: 'Farid Bettioui',
  intro: 'My name is Farid and I’m brand designer with over five years of experience in creative industry',
  bio: {
    lead: 'An experienced senior designer specializing in branding, brand management, and visual designs, including design for social media and print.',
    rest: 'Accomplished painter and artistic director in the theatre and film industry. Passionate about creating impactful brand identities and memorable visual experiences.',
  },
  photos: await Promise.all(['gb4dzKQFfb1teHosp7csSVPQCo.gif', 'wobKv2ybJvvc4ZXn0tzQM5VVM.jpg', 'M803vUHvUWpl0sCxLcxrd842czo.jpg'].map(image)),
  stats: [
    { value: '5+', label: 'Years of Experience' },
    { value: '1M+', label: 'Hours of Work' },
    { value: '100+', label: 'Projects Done' },
    { value: '4K+', label: 'Cups of Coffee' },
  ],
  services: [
    { title: 'Brand Identity', description: 'Our primary aim is to enhance your brand through polished design and meticulous attention to detail.' },
    { title: 'Print Design', description: "We'll ensure the development of top-notch user interfaces, striving to meet all customer requirements." },
    { title: 'Social Media Design', description: "Our developers will ensure to refine your project's code and design to meet the highest requirements." },
    { title: 'Art Work', description: 'Our customer project support and problem resolution will be accessible round-the-clock, including weekends.' },
  ],
})

await db.doc('pages/projects').set({
  metaTitle: 'Projects',
  metaDescription: 'Selected branding and design projects.',
  eyebrow: 'Since — Y:2010',
  headingLine1: 'Selected',
  headingLine2: 'Projects',
  intro: 'Selection of experienced product design solutions and innovative digital concepts',
})

await db.doc('pages/stories').set({
  metaTitle: 'Stories',
  metaDescription: 'Stories about design, art and lifestyle.',
  eyebrow: 'Since — Y:2010',
  headingLine1: 'Inspiring',
  headingLine2: 'Stories',
  intro: 'Read our stories about design, art and lifestyle',
})

await db.doc('pages/contact').set({
  metaTitle: 'Contact',
  metaDescription: 'Get in touch with Farid Bettioui for branding, campaigns and visual systems.',
  eyebrow: 'Get in touch',
  headingLine1: 'Let’s make',
  headingLine2: 'Something',
  intro: 'Tell me about your project, a brand or an idea you want to bring to life',
  note: 'Based in Doha, Qatar, working with clients across the GCC, Europe and North Africa.',
})

// ---- Editor: Firestore + Storage rules let in only emails listed under /admins ----
await db.doc(`admins/${adminEmail}`).set({ email: adminEmail, createdAt: Timestamp.now() })
if (!production) {
  const password = process.env.ADMIN_PASSWORD ?? 'localpassword'
  const auth = getAuth(app)
  await auth.getUserByEmail(adminEmail).catch(() => auth.createUser({ email: adminEmail, password, emailVerified: true }))
  console.log(`Local editor: ${adminEmail} / ${password}`)
} else {
  console.log(`Editor allowed: ${adminEmail} (sign in with Google at /admin).`)
}

console.log(`Seeded ${projects.length} projects, ${posts.length} stories, ${uploaded.size} images.`)
