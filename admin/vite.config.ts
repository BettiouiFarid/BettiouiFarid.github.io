import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// The built admin is served by the website itself under /admin (see next.config.ts).
export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../public/admin', emptyOutDir: true, target: 'esnext', sourcemap: false },
  server: {
    port: 5173,
    // `npm run dev` here talks to the website running on :3000 for revalidation and previews.
    proxy: { '/api': 'http://localhost:3000', '/img': 'http://localhost:3000' },
  },
  resolve: {
    // Firebase must resolve to a single copy, or Auth fails with "Component auth has not been registered yet".
    dedupe: ['firebase'],
  },
  optimizeDeps: { include: ['react/jsx-runtime'] },
})
