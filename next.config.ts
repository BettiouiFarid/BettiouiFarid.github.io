import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The FireCMS admin is a single-page app built into public/admin (npm run admin:build).
  // Any /admin/... URL that isn't a real file (assets are) is answered with its index.html.
  // afterFiles runs after public/ files but before the catch-all 404 page.
  async rewrites() {
    return { beforeFiles: [], afterFiles: [{ source: '/admin/:path*', destination: '/admin/index.html' }], fallback: [] }
  },
  async headers() {
    return [{ source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-cache' }] }]
  },
}

export default nextConfig
