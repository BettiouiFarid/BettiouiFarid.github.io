// Shapes of the Firestore documents edited in the FireCMS admin (see admin/src/collections).

export type Project = {
  id: string // document id = URL slug
  title: string
  featured: boolean
  cover: string | null // Storage path, e.g. media/trigocity.jpg
  summary: string | null
  industry: string | null
  client: string | null
  service: string | null
  date: string | null // ISO
  gallery: string[]
}

export type Post = {
  id: string // document id = URL slug
  title: string
  publishedAt: string // ISO
  category: string
  cover: string | null
  content: string // markdown; a "> quote" renders as the large pull quote
}

export type PageHeader = {
  eyebrow?: string
  headingLine1?: string
  headingLine2?: string
  intro?: string
}

// A framed photo in the home page's drifting strip; it flips through its pictures.
export type HeroHolder = {
  shape: 'portrait' | 'landscape' | 'square'
  interval: number // seconds each picture is shown
  images: string[] // Storage paths
}

// Hero animation settings (Firestore hero/settings), edited under "Hero animation" in the CMS.
export type Hero = {
  frames: HeroHolder[]
  tilt: number // degrees; negative tilts up to the right
  speed: number // px per second the strip drifts (0 = still)
  spacing: number // px between frames
}

// Cursor trail settings (Firestore trail/settings), edited under "Cursor trail" in the CMS.
export type Trail = { enabled: boolean; color: string; width: number; opacity: number; fadeSeconds: number; length: number }

export type Highlighted = { lead: string; rest?: string }

export type Site = {
  name: string
  description?: string
  shareImage?: string | null
  email: string
  website?: string
  location?: string
  socials: { label: string; url: string }[]
  copyright?: string
  footerMarquee?: string
}

// Each page has its own Firestore document (pages/home, pages/about, pages/projects, pages/stories),
// edited under "Pages" in the CMS. Every page can set its own browser title, description and share image.
export type PageSeo = {
  metaTitle?: string
  metaDescription?: string
  shareImage?: string | null
}

export type HomePage = PageSeo & {
  role?: string
  headingLine1?: string
  headingLine2?: string
  paragraph?: Highlighted
}

export type AboutPage = PageSeo &
  PageHeader & {
    bio?: Highlighted
    photos: string[]
    stats: { value: string; label: string }[]
    services: { title: string; description?: string }[]
  }

export type ListPage = PageSeo & PageHeader // Projects and Stories

export type ContactPage = PageSeo & PageHeader & { note?: string } // email, location and links come from Site settings

export type Pages = { home: HomePage; about: AboutPage; projects: ListPage; stories: ListPage; contact: ContactPage }
