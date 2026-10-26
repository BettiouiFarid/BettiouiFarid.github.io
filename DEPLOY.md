# Deploying to Firebase + Cloudflare

Everything lives in **one Firebase project**:

| Piece | Service | Cost (approx.) |
|---|---|---|
| Website + `/admin` | Firebase App Hosting (Cloud Run) | free tier covers a portfolio; scales to zero |
| Content (projects, stories, texts) | Cloud Firestore | free tier |
| Uploaded images | Cloud Storage for Firebase | free up to 5 GB |
| Editor login | Firebase Authentication (Google sign-in) | free |
| Domain + DNS | Cloudflare | — |

No database server, so there is no monthly fixed cost.

Replace `PROJECT_ID` below with your Firebase project ID.

---

## 1. Create the Firebase project

1. <https://console.firebase.google.com> → **Add project**. Switch it to the **Blaze** (pay-as-you-go) plan and add a
   budget alert (e.g. $20) under *Usage and billing*. (App Hosting requires Blaze; a portfolio stays inside the free quotas.)
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   Under *Settings → Authorized domains*, add `faridbettioui.art`.
3. **Build → Firestore Database → Create database**, *production mode*, location `eur3` (Europe) — or the region nearest your visitors.
4. **Build → Storage → Get started**, same location.
5. **Project settings → Your apps → Web (`</>`)** → register an app named "CMS". Copy its config values into
   [`admin/.env.production`](admin/.env.production) (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `appId`).
   These are public by design — the rules below are what protect your data.
6. Put the project ID into [`apphosting.yaml`](apphosting.yaml) (`FIREBASE_STORAGE_BUCKET`, the bucket name shown in *Storage*)
   and into [`.firebaserc`](.firebaserc).

## 2. Command-line tools (on this Mac)

```bash
export PATH="$HOME/.local/node-v24.22.1-darwin-arm64/bin:$PATH"
npm install
npx firebase login
npx firebase use PROJECT_ID
```

## 3. Security rules

```bash
npx firebase deploy --only firestore,storage
```

The rules make Firestore and Storage **private**: only editors listed in Firestore under `admins/<their email>` can read or
write. Visitors never touch them — the website reads on its server and serves images through `/img`.

## 4. App Hosting backend

```bash
npx firebase apphosting:backends:create --backend portfolio --primary-region europe-west4
```

Connect the GitHub repo **BettiouiFarid/BettiouiFarid.github.io**, live branch **main**, root directory **/**.
Every push to `main` then builds (`npm run build` builds the admin app, then the site) and rolls out automatically.

Allow the backend's service account to use Firestore and Storage:

```bash
SA=firebase-app-hosting-compute@PROJECT_ID.iam.gserviceaccount.com
gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:$SA" --role=roles/datastore.user
gcloud projects add-iam-policy-binding PROJECT_ID --member="serviceAccount:$SA" --role=roles/storage.objectViewer
```

Push to `main` to trigger the first rollout (watch it under *App Hosting* in the console).

## 5. Import the content and add yourself as editor

Copies the projects, stories, images and page texts from the old Framer site into Firestore/Storage, and allows your
Google account to edit. Run once, from this folder:

```bash
gcloud auth application-default login
SEED_TARGET=production \
GCLOUD_PROJECT=PROJECT_ID FIREBASE_STORAGE_BUCKET=PROJECT_ID.firebasestorage.app \
ADMIN_EMAIL=you@gmail.com \
npm run seed
```

Then open `https://<your backend URL>/admin` and **Sign in with Google** using that account.
To add another editor later: in the Firebase console → Firestore, add a document with the ID `their@email.com` to the `admins` collection.

## 6. Domain on Cloudflare

1. Firebase console → **App Hosting → portfolio → Settings → Domains → Add custom domain**: add `faridbettioui.art`,
   then `www.faridbettioui.art` (redirecting to the first).
2. In **Cloudflare → DNS**, delete the old GitHub Pages records for those names and add exactly the records Firebase shows
   (A and TXT, plus a CNAME for the certificate challenge). Set every one to **DNS only (grey cloud)** — Firebase can't
   issue the HTTPS certificate through Cloudflare's proxy.
3. Wait for Firebase to show the domain as *Connected* (minutes to a few hours).

If you later want Cloudflare's proxy (orange cloud) on, first set Cloudflare **SSL/TLS → Full (strict)**.

## 7. Retire GitHub Pages

Once the domain works: GitHub repo → **Settings → Pages** → set *Source* to **None**.

---

## Later changes

- **Content**: edit at `/admin`. Saving refreshes the website immediately.
- **Code**: push to `main`; App Hosting redeploys.
- **New fields**: add them to `admin/src/collections/*.ts` (the form) and `src/lib/types.ts` + `src/lib/cms.ts` (the site).
- **Test the live site**: `BASE_URL=https://faridbettioui.art npm test`
