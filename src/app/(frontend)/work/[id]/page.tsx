import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { formatDate, MediaImage, ProjectGrid } from '@/components/Blocks'
import { getImageSize, getProject, getProjects } from '@/lib/cms'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).id)
  if (!project) return {}
  return {
    title: project.title,
    description: project.summary ?? undefined,
    openGraph: project.cover ? { images: [`/img/${project.cover}?w=1600`] } : undefined,
  }
}

export default async function WorkPage({ params }: Props) {
  const { id } = await params
  const [project, all] = await Promise.all([getProject(id), getProjects()])
  if (!project) notFound()

  // One at a time: the Storage client doesn't like many simultaneous downloads.
  const gallery: { path: string; width: number; height: number }[] = []
  for (const path of project.gallery) gallery.push({ path, ...(await getImageSize(path)) })

  // The next three projects in the list, wrapping around to the start.
  const index = all.findIndex((p) => p.id === project.id)
  const related = [...all.slice(index + 1), ...all.slice(0, Math.max(index, 0))].slice(0, 3)
  const meta = [
    ['Industry', project.industry],
    ['Client', project.client],
    ['Service', project.service],
    ['Date', formatDate(project.date, 'month-year')],
  ]

  return (
    <article className="container">
      <header className="work-header">
        <h1>{project.title}</h1>
        {project.summary && <p className="summary">{project.summary}</p>}
        <dl className="work-meta">
          {meta.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="gallery">
        {gallery.length > 0
          ? gallery.map((g, i) => (
              <MediaImage
                key={g.path}
                path={g.path}
                alt={`${project.title} — image ${i + 1}`}
                width={g.width}
                height={g.height}
                sizes="(max-width: 1440px) 100vw, 84vw"
                priority={i === 0}
              />
            ))
          : Array.from({ length: 3 }, (_, i) => <div key={i} className="tile" />)}
      </div>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related">
          <h2 id="related" className="label section-label">
            Related Projects
          </h2>
          <ProjectGrid projects={related} columns={3} />
          <div className="center-link">
            <Link className="underline-link" href="/projects">
              View All Projects
            </Link>
          </div>
        </section>
      )}
    </article>
  )
}
