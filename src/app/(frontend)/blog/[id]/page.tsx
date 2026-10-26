import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from 'react-markdown'

import { formatDate, MediaImage } from '@/components/Blocks'
import { getPost, getPosts } from '@/lib/cms'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).id)
  if (!post) return {}
  return {
    title: post.title,
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      images: post.cover ? [`/img/${post.cover}?w=1600`] : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const [post, all] = await Promise.all([getPost(id), getPosts()])
  if (!post) notFound()
  const recent = all.filter((p) => p.id !== post.id).slice(0, 2)

  return (
    <article className="container">
      <header className="post-header">
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
        <h1>{post.title}</h1>
        <span className="tag">{post.category}</span>
      </header>
      {post.cover && (
        <div className="post-cover">
          <MediaImage path={post.cover} alt={post.title} sizes="(max-width: 1440px) 100vw, 84vw" priority />
        </div>
      )}
      <div className="prose">
        <Markdown>{post.content}</Markdown>
      </div>

      {recent.length > 0 && (
        <aside className="recent" aria-labelledby="recent">
          <h2 id="recent" className="label">
            My Recent Stories
          </h2>
          <div className="recent-grid">
            {recent.map((p) => (
              <Link key={p.id} href={`/blog/${p.id}`} className="recent-card">
                <span className="tag">{p.category}</span>
                <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                <h3>{p.title}</h3>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  )
}
