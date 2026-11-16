import { Readable } from 'node:stream'

import { getPages } from '@/lib/cms'
import { bucket } from '@/lib/firebase'

// Sends the portfolio PDF chosen under Pages → Contact. It is streamed from the private bucket, so large
// files never sit in memory, and always downloads as the same file name.
export const dynamic = 'force-dynamic'

export async function GET() {
  const { contact } = await getPages()
  const path = contact.portfolioFile
  if (!path || !path.startsWith('files/') || path.includes('..')) return new Response('Not found', { status: 404 })

  const file = bucket().file(path)
  const [exists] = await file.exists()
  if (!exists) return new Response('Not found', { status: 404 })
  const [metadata] = await file.getMetadata()

  const headers: Record<string, string> = {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="Farid-Bettioui-Portfolio.pdf"',
    'Cache-Control': 'public, max-age=300',
  }
  if (metadata.size) headers['Content-Length'] = String(metadata.size)

  return new Response(Readable.toWeb(file.createReadStream()) as ReadableStream, { headers })
}
