# Farid Bettioui — Portfolio

Portfolio site with a built-in CMS, rebuilt from the original Framer design. All on one Firebase project.

- **Site** — Next.js 16 (App Router), reads content on the server with the Firebase Admin SDK
- **CMS** — [FireCMS](https://firecms.co) (React app in [`admin/`](admin)), served by the site at `/admin`
- **Data** — Cloud Firestore (content) and Cloud Storage for Firebase (images); Firebase Auth (Google sign-in) for editors
- **Hosting** — Firebase App Hosting; domain on Cloudflare

Deployment: [docs/DEPLOY.md](docs/DEPLOY.md).

## Run locally

Needs Node 24 and Java 21 (for the Firestore emulator) — on this Mac:

```bash
export PATH="$HOME/.local/node-v24.22.1-darwin-arm64/bin:$HOME/.local/jre-21/Contents/Home/bin:$PATH"
npm install && npm run admin:install

npm run emulators      # terminal 1: Auth + Firestore + Storage emulators (data kept in ~/.local/share/farid-portfolio)
npm run seed           # terminal 2, first time only: imports the Framer content + creates a local editor
npm run admin:build:local   # builds the CMS into public/admin, pointed at the emulators
npm run dev            # terminal 2: site at http://localhost:3000, CMS at http://localhost:3000/admin
```

Local editor login: `admin@example.com` / `localpassword`. Emulator UI: <http://127.0.0.1:4000>.
`SEED_RESET=1 npm run seed` wipes and re-imports the content.

## How the content is organised

| In the CMS | Firestore | Drives |
|---|---|---|
| **Pages** | `pages/home`, `about`, `projects`, `stories`, `contact` | One entry per page, each with its own ID: its texts plus its own browser title, search description and share image. |
| **Projects** | `projects/<id>` | `/projects` grid and `/work/<id>` pages. *Order* sorts them; *On home page* features them. |
| **Stories** | `posts/<id>` | `/stories`, the home list and `/blog/<id>`. A `>` quote in the text becomes the large pull quote. |
| **Hero animation** | `hero/settings` | The home hero: photo frames (portrait, landscape or square, 2–5 pictures each), tilt, speed and spacing. The *Preview* tab plays it. |
| **Cursor trail** | `trail/settings` | The line that follows the mouse: thickness, duration, opacity, length, colour. The *Control panel* tab tries changes live. |
| **Site settings** | `site/settings` | Contact details, social links and footer, shared by every page. |
| — | `admins/<email>` | Who may use the CMS (enforced by the Firestore and Storage rules). |

The document ID is the page's web address. Only items with **Status = Published** appear on the site.
The cursor trail is off on touch screens and with reduced motion.
Images are stored under `media/` in Storage and served resized through `/img/media/<file>?w=1024`.

## Tests

```bash
npm test                                    # Playwright, desktop + mobile, against localhost (needs the emulators running)
BASE_URL=https://faridbettioui.art npm test # against the live site (admin tests skipped)
```

## Layout

```
src/app/(frontend)/       site pages and styles
src/app/img/              image proxy: reads Storage, resizes
src/app/api/revalidate/   called by the CMS after each save
src/components/           site building blocks (menu, footer, cursor trail…)
src/lib/                  Firestore/Storage access (cms.ts), types
admin/                    FireCMS app: collections in admin/src/collections
seed/                     Framer content + images, and the import script
tests/                    Playwright end-to-end tests (site and CMS)
docs/                     deployment guide
firestore.rules, storage.rules, firebase.json, apphosting.yaml   Firebase config
```

## Checks

`npm run lint`, `npm run typecheck` and the admin build run on every push (GitHub Actions, `.github/workflows/ci.yml`).
