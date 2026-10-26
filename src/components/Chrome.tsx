import Link from 'next/link'

import type { Site } from '@/lib/types'
import { Menu } from './Menu'

export function Header({ site }: { site: Site }) {
  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          {site.name}
        </Link>
        <Menu name={site.name} email={site.email} website={site.website} location={site.location} />
      </div>
    </header>
  )
}

export function Footer({ site }: { site: Site }) {
  const marquee = site.footerMarquee || ''
  return (
    <footer className="footer" id="contact">
      <div className="container footer-inner">
        <p>CONTACT</p>
        <div className="footer-grid">
          <p>{site.location}</p>
          <div className="stack">
            <a className="underline-link" href={`mailto:${site.email}`}>
              {site.email}
            </a>
            {site.website && (
              <a className="underline-link" href={`https://${site.website}`}>
                {site.website}
              </a>
            )}
          </div>
          <div className="footer-socials">
            {site.socials.map((s) => (
              <a key={s.url} className="underline-link" href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} — {site.copyright}
        </p>
      </div>
      {marquee && (
        <div className="marquee" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i}>{marquee}</span>
          ))}
        </div>
      )}
    </footer>
  )
}
