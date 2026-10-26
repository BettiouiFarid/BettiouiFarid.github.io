import { execSync } from 'child_process'

// Makes sure the emulators are running and hold the site content (the seed skips itself when they do).
export default async function globalSetup() {
  const up = await fetch('http://127.0.0.1:8080').then(() => true, () => false)
  if (!up) throw new Error('The Firebase emulators are not running. Start them with: npm run emulators')
  execSync('npx tsx seed/seed.ts', { stdio: 'inherit' })
}
