# Farid Bettioui — Portfolio

Self-hosted copy of https://faridbettioui.framer.website/ with the "Made in Framer" badge removed.

**Live:** https://bettiouifarid.github.io/ (GitHub Pages, deployed from `site/` on every push to `main`)

- `site/` — the website (all pages, images, fonts and scripts are local; nothing loads from framerusercontent.com)
- `server.js` — tiny dependency-free static server
- `tests/` — Playwright tests (every page loads, no badge, no broken assets, no JS errors, desktop + mobile)

## Run

```bash
npm start          # http://localhost:3000
npm test           # Playwright
BASE_URL=https://bettiouifarid.github.io npm test   # test the live site
```

Node was installed to `~/.local/node-v22.11.0-darwin-arm64/bin`. Add it to your PATH if `npm` isn't found:

```bash
echo 'export PATH="$HOME/.local/node-v22.11.0-darwin-arm64/bin:$PATH"' >> ~/.zshrc
```

## Deploy

Upload the `site/` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages). Pages use clean URLs (`/projects` → `projects/index.html`), which those hosts handle automatically.

## Customising

- `tools/mirror.pl` — re-download the site from Framer (`perl tools/mirror.pl site`) after publishing changes there
- `tools/customize.pl` — local edits applied on top of the mirror (`perl tools/customize.pl site`): footer year/location, and fluid layout above 1440px. Run it after every mirror.
