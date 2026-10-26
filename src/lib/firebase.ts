import { EventEmitter } from 'events'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

import { createLimit } from './limit'

// The Storage client (teeny-request) briefly attaches 11 listeners to one stream while piping a
// download, which makes Node print a harmless MaxListenersExceededWarning (and Next's dev overlay
// reports it as an error). The listeners are short-lived, so a slightly higher default is safe.
EventEmitter.defaultMaxListeners = 20

// On Firebase App Hosting the project, bucket and credentials come from the environment.
// Locally, .env.development points everything at the emulators.
const app = getApps()[0] ?? initializeApp({ storageBucket: process.env.FIREBASE_STORAGE_BUCKET })

export const db = getFirestore(app)
export const auth = getAuth(app)
export const bucket = () => getStorage(app).bucket()

// Many simultaneous Storage downloads make the client emit MaxListeners warnings and hold lots of memory.
const limitDownloads = createLimit(6)
export const download = (path: string, range?: { start: number; end: number }) =>
  limitDownloads(async () => {
    const file = bucket().file(path)
    const [[buffer], [metadata]] = await Promise.all([file.download(range), file.getMetadata()])
    return { buffer, contentType: (metadata.contentType as string | undefined) ?? 'application/octet-stream' }
  })
