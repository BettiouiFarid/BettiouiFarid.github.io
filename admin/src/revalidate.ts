import { getAuth } from 'firebase/auth'

import { firebaseApp } from './firebase'

// Tells the website to drop its cached content so a save shows up right away.
// The site only accepts the call from a signed-in editor (see src/app/api/revalidate in the site).
export async function revalidateSite() {
  try {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken()
    if (!token) return
    await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  } catch (error) {
    console.warn('Could not refresh the website cache; changes will appear within 5 minutes.', error)
  }
}
