import type { Metadata, Viewport } from 'next'
import { Manrope, Montserrat } from 'next/font/google'
import React from 'react'

import { Footer, Header } from '@/components/Chrome'
import { CursorTrail } from '@/components/CursorTrail'
import { getSite, getTrail } from '@/lib/cms'
import './styles.css'

// Pages render on request from the (cached) CMS data, so the build never needs Firestore.
export const dynamic = 'force-dynamic'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['800'], variable: '--font-montserrat' })

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite()
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
    title: { default: `${site.name} — ${site.copyright}`, template: `%s — ${site.name}` },
    description: site.description,
    openGraph: {
      siteName: site.name,
      type: 'website',
      images: site.shareImage ? [`/img/${site.shareImage}?w=1600`] : undefined,
    },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.png' },
  }
}

export const viewport: Viewport = { themeColor: '#111111' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, trail] = await Promise.all([getSite(), getTrail()])
  return (
    <html lang="en" className={`${manrope.variable} ${montserrat.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="page">
          <Header site={site} />
          <main id="main">{children}</main>
        </div>
        <Footer site={site} />
        {trail.enabled && <CursorTrail {...trail} />}
      </body>
    </html>
  )
}
