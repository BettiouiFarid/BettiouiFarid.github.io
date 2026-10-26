import sharp from 'sharp'

import { download } from '@/lib/firebase'

// Serves (and resizes) images from Firebase Storage. Visitors never talk to Storage directly,
// so the bucket stays private. Usage: /img/media/<file>?w=1024
const WIDTHS = [320, 640, 1024, 1600, 2400]

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const file = (await params).path.join('/')
  if (!file.startsWith('media/') || file.includes('..')) return new Response('Not found', { status: 404 })

  const width = Number(new URL(request.url).searchParams.get('w'))
  let image: Awaited<ReturnType<typeof download>>
  try {
    image = await download(file)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  const { buffer, contentType } = image

  // Animated GIFs and requests without a known width are served untouched.
  const resize = WIDTHS.includes(width) && contentType !== 'image/gif'
  const body = resize
    ? await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
    : buffer

  return new Response(new Uint8Array(body), {
    headers: {
      'Content-Type': resize ? 'image/webp' : contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
