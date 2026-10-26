import type { Metadata } from 'next'

import { PageHeader, StoryList } from '@/components/Blocks'
import { getPages, getPosts, getSite } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [site, { stories }] = await Promise.all([getSite(), getPages()])
  return pageMetadata('Stories', stories, site)
}

export default async function StoriesPage() {
  const [{ stories: h }, posts] = await Promise.all([getPages(), getPosts()])
  return (
    <>
      <PageHeader eyebrow={h.eyebrow} line1={h.headingLine1} line2={h.headingLine2} intro={h.intro} />
      <section className="container" aria-label="All stories">
        <StoryList posts={posts} />
      </section>
    </>
  )
}
