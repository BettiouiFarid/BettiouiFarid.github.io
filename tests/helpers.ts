import { expect, type Page } from '@playwright/test'

export const editor = { email: 'admin@example.com', password: 'localpassword' }

// Signs in to the CMS with the local editor created by the seed.
export async function loginToAdmin(page: Page) {
  await page.goto('/admin')
  await page.getByText('Email/password').click()
  await page.locator('input').first().fill(editor.email)
  await page.getByRole('button', { name: /next|continue|login|sign/i }).first().click()
  await page.locator('input[type=password]').fill(editor.password)
  await page.getByRole('button', { name: /login|sign in|log in/i }).first().click()
  // The home screen has one card per collection (the side drawer is collapsed on small screens).
  await expect(page.getByText(/Contact details/)).toBeVisible()
}

// Auth emulator: ID token for a user, used to call the site's protected endpoints.
export async function idToken(email: string, password: string) {
  const res = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) },
  )
  if (!res.ok) throw new Error(`Sign-in failed for ${email}: ${await res.text()}`)
  return (await res.json()).idToken as string
}
