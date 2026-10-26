import { revalidateTag } from 'next/cache'

import { auth, db } from '@/lib/firebase'
import { CMS_TAG } from '@/lib/tags'

// Called by the admin after every save, with the editor's Firebase ID token, so edits show on
// the site immediately. Only editors listed in /admins/{email} are accepted.
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return new Response('Missing token', { status: 401 })

  try {
    const { email, email_verified } = await auth.verifyIdToken(token)
    if (!email || !email_verified || !(await db.doc(`admins/${email}`).get()).exists) {
      return new Response('Not an editor', { status: 403 })
    }
  } catch {
    return new Response('Invalid token', { status: 401 })
  }

  revalidateTag(CMS_TAG, { expire: 0 })
  return new Response(null, { status: 204 })
}
