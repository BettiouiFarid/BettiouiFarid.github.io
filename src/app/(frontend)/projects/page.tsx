import type { Metadata } from 'next'

import { PageHeader, ProjectGrid } from '@/components/Blocks'
import { getPages, getProjects, getSite } from '@/lib/cms'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const [site, { projects }] = await Promise.all([getSite(), getPages()])
  return pageMetadata('Projects', projects, site)
}

export default async function ProjectsPage() {
  const [{ projects: h }, projects] = await Promise.all([getPages(), getProjects()])
  return (
    <>
      <PageHeader eyebrow={h.eyebrow} line1={h.headingLine1} line2={h.headingLine2} intro={h.intro} />
      <section className="container" aria-label="All projects">
        <ProjectGrid projects={projects} />
      </section>
    </>
  )
}
