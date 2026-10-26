import type { Metadata } from 'next'

import { PageHeader } from '@/components/Blocks'
import { getPages, getSite } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [site, { contact }] = await Promise.all([getSite(), getPages()])
  return pageMetadata('Contact', contact, site)
}

export default async function ContactPage() {
  const [site, { contact: c }] = await Promise.all([getSite(), getPages()])
  return (
    <>
      <PageHeader eyebrow={c.eyebrow} line1={c.headingLine1} line2={c.headingLine2} intro={c.intro} />
      <div className="container">
        <section className="contact" aria-label="Contact details">
          <a className="contact-email" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          {c.note && <p className="contact-note">{c.note}</p>}
          <dl className="contact-details">
            {site.location && (
              <div>
                <dt>Location</dt>
                <dd>{site.location}</dd>
              </div>
            )}
            {site.website && (
              <div>
                <dt>Website</dt>
                <dd>
                  <a className="underline-link" href={`https://${site.website}`}>
                    {site.website}
                  </a>
                </dd>
              </div>
            )}
            {site.socials.length > 0 && (
              <div>
                <dt>Elsewhere</dt>
                <dd>
                  {site.socials.map((s) => (
                    <a key={s.url} className="underline-link" href={s.url} target="_blank" rel="noreferrer">
                      {s.label}
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>
    </>
  )
}
