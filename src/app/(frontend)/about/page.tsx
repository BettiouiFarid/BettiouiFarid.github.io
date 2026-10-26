import type { Metadata } from 'next'

import { AboutPhotos } from '@/components/AboutPhotos'
import { PageHeader } from '@/components/Blocks'
import { HighlightText } from '@/components/HighlightText'
import { getPages, getSite } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [site, { about }] = await Promise.all([getSite(), getPages()])
  return pageMetadata('About', about, site)
}

export default async function AboutPage() {
  const [{ name }, { about: a }] = await Promise.all([getSite(), getPages()])
  return (
    <>
      <PageHeader eyebrow={a.eyebrow} line1={a.headingLine1} line2={a.headingLine2} intro={a.intro} />
      <div className="container">
        {a.bio?.lead && (
          <section className="about-bio">
            <HighlightText lead={a.bio.lead} rest={a.bio.rest} />
            {a.photos.length > 0 && <AboutPhotos photos={a.photos} alt={`Portrait of ${name}`} />}
          </section>
        )}
        {a.stats.length > 0 && (
          <section className="stats" aria-label="In numbers">
            {a.stats.map((s) => (
              <div key={s.label} className="reveal">
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </section>
        )}
        {a.services.length > 0 && (
          <section className="services" aria-label="Services">
            {a.services.map((s, i) => (
              <div key={s.title} className="reveal">
                <small>{String(i + 1).padStart(2, '0')}</small>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  )
}
