import type { Metadata } from 'next'

import type { PageSeo, Site } from './types'

// Browser title, description and share image of a page: its own settings first, the site-wide ones after.
export function pageMetadata(fallbackTitle: string | undefined, page: PageSeo, site: Site): Metadata {
  const image = page.shareImage ?? site.shareImage
  return {
    title: page.metaTitle || fallbackTitle || undefined,
    description: page.metaDescription || site.description,
    openGraph: {
      title: page.metaTitle || undefined,
      description: page.metaDescription || site.description,
      images: image ? [`/img/${image}?w=1600`] : undefined,
    },
  }
}
