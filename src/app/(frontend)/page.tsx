import Link from 'next/link'
import type { CSSProperties } from 'react'

import { MediaImage, ProjectGrid, StoryList } from '@/components/Blocks'
import { Crown } from '@/components/Crown'
import { HighlightText } from '@/components/HighlightText'
import type { Metadata } from 'next'

import { getHero, getPages, getPosts, getProjects, getSite } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

const SHAPE_WIDTH = { portrait: 232, landscape: 400, square: 312 } // px, same as the .holder sizes in styles.css

export async function generateMetadata(): Promise<Metadata> {
  const [site, { home }] = await Promise.all([getSite(), getPages()])
  const meta = pageMetadata(undefined, home, site)
  // The home page sets the whole title (the other pages get " — name" added by the layout).
  return { ...meta, title: { absolute: home.metaTitle || `${site.name} — ${site.copyright}` } }
}

export default async function Home() {
  const [hero, { home }, projects, posts] = await Promise.all([getHero(), getPages(), getProjects(), getPosts()])
  const featured = projects.filter((p) => p.featured)

  // Length of one repeat of the strip (frame widths + the gap before each frame), in design pixels.
  const loop = hero.frames.reduce((sum, f) => sum + SHAPE_WIDTH[f.shape] + hero.spacing, 0)
  const copies = loop > 0 ? Math.ceil(4000 / loop) + 1 : 0 // enough repeats to fill the tilted strip
  const stripStyle = {
    '--tilt': `${hero.tilt}deg`,
    '--gap': hero.spacing,
    '--loop': loop,
    '--dur': `${hero.speed > 0 ? loop / hero.speed : 0}s`,
  } as CSSProperties

  return (
    <>
      <section className="hero">
        {hero.frames.length > 0 && (
          <div className={`hero-strip${hero.speed > 0 ? '' : ' still'}`} style={stripStyle} aria-hidden="true">
            <div className="hero-strip-rotate">
              {/* The frames repeat; the track drifts by exactly one repeat, then loops. */}
              <div className="hero-track">
                {Array.from({ length: copies }, (_, copy) => copy).flatMap((copy) =>
                  hero.frames.map((holder, i) => (
                    <div key={`${copy}-${i}`} className={`holder ${holder.shape}`}>
                      <div
                        className="flip"
                        data-n={holder.images.length}
                        style={{ '--n': holder.images.length, '--s': `${holder.interval}s` } as CSSProperties}
                      >
                        {holder.images.map((path, j) => (
                          <MediaImage
                            key={path + j}
                            path={path}
                            alt=""
                            sizes="(max-width: 809px) 300px, 400px"
                            eager
                            style={{ '--i': j } as CSSProperties}
                          />
                        ))}
                      </div>
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
        )}
        <Crown className="hero-crown" />
        <p className="hero-role">{home.role}</p>
        <h1 className="display">
          <span>{home.headingLine1}</span> <span>{home.headingLine2}</span>
        </h1>
        <p className="scroll-cue">SCROLL</p>
      </section>

      <section className="home-projects container" aria-labelledby="latest">
        <h2 id="latest" className="label section-label">
          Latest Projects
        </h2>
        <ProjectGrid projects={featured} />
        <div className="center-link">
          <Link className="underline-link" href="/projects">
            View All Projects
          </Link>
        </div>
      </section>

      {home.paragraph?.lead && (
        <section className="home-about container" id="about">
          <HighlightText lead={home.paragraph.lead} rest={home.paragraph.rest} />
        </section>
      )}

      <section className="container" id="stories" aria-labelledby="stories-title">
        <h2 id="stories-title" className="label section-label">
          Stories
        </h2>
        <StoryList posts={posts.slice(0, 5)} />
      </section>
    </>
  )
}
