# OpenTree

A free, open-source family tree builder. Create trees, link relationships, visualize pedigrees with D3, attach photos and documents, collaborate with relatives, and export your data (GEDCOM + ZIP) without a subscription lock-in. Live demo: [opentree-brown.vercel.app](https://opentree-brown.vercel.app/).

## Features

Verified from the current codebase:

- Auth: email/password (with email verification), Google OAuth, email link (passwordless), password reset
- Onboarding wizard for the first tree; dashboard of owned and shared trees
- D3 family-tree visualization (custom layout, zoom/pan, re-root) plus list view and in-tree search
- Person CRUD with biographical fields, living flag, duplicate warnings
- Relationships (parent/child/spouse) with validation helpers; relationship calculator (BFS path / cousin degree)
- Person detail: overview, photos, documents, timeline events
- GEDCOM 5.5.1 export/import (import preview before merge) and full ZIP backup (GEDCOM + media)
- Sharing: invite by email (viewer/editor), pending invites; public tree route `/tree/[treeId]/public` with living-person redaction for guests
- Activity feed, user settings (profile, password, theme), dark mode (system/light/dark)
- Route protection via `src/proxy.ts` + non-secret session cookie (`POST /api/session`); Firestore/Storage rules are the data authority

## Tech stack

| Area | Choice | Version (package.json) |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.3.5 |
| UI | React | ^19.2.7 |
| Language | TypeScript | ^6.0.3 |
| Styling | Tailwind CSS | ^4.3.2 |
| State | Zustand | ^5.0.14 |
| Forms | react-hook-form + Zod + `@hookform/resolvers` | — |
| Visualization | d3-selection / d3-zoom / d3-transition | ^3.x |
| Backend | Firebase Auth, Firestore, Storage (client SDK) | ^12.16.0 |
| Export | jszip, custom GEDCOM helpers | — |
| Tests | Vitest | ^4.1.10 |

No Stripe or AI providers in this repo.

## Project structure

```
src/
  app/
    (auth)/          # login, signup, forgot-password, verify-email, email-link
    (dashboard)/     # home, settings, tree/[treeId], person/[personId]/…
    (public)/        # tree/[treeId]/public
    api/session/     # UI gate cookie (verified | pending | cleared)
  components/        # auth, person, tree, settings, ui, providers
  lib/
    firebase/        # config, auth, firestore, storage, members, activity, …
    hooks/ stores/ types/ utils/ auth/ tree/
  proxy.ts           # Next.js proxy/middleware-style route gates
firestore.rules
storage.rules
firebase.json
.firebaserc          # default project id for Firebase CLI
.github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22 (matches CI) or a current LTS
- npm
- A Firebase project (Auth, Firestore, Storage)

### Clone and install

```bash
git clone https://github.com/brown2020/opentree.git
cd opentree
npm install
```

### Environment variables

| Name | Purpose | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | Firebase Console → Project settings → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID | Same |

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Put values in `.env.local` only. `config.ts` initializes Firebase when `apiKey` is present. CI may also define `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`; it is not read by application config today.

### Firebase setup

1. Create a Web app and copy config into `.env.local`.
2. Enable Auth: Email/Password, Google, Email link as needed; configure authorized domains.
3. Deploy `firestore.rules`, `firestore.indexes.json`, and `storage.rules` (`firebase.json` / `.firebaserc`).
4. Storage paths include profile photos and per-person tree media; rules enforce ownership/membership and file constraints.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |

## Testing and CI

- Vitest covers auth routes/session helpers, GEDCOM import, pedigree export, person privacy, duplicate detection, invite email helpers, and more under `src/**/*.test.ts`.
- CI: lint, typecheck, test, build on `dev`/`main` and PRs (Node 22), with Firebase `NEXT_PUBLIC_*` from Actions secrets.

## Deployment

Deploy as Next.js (demo: [opentree-brown.vercel.app](https://opentree-brown.vercel.app/). Configure the same public Firebase env vars on the host and keep Firestore/Storage rules in sync with this repo.

## Contributing

1. Branch from `dev`.
2. Treat Firestore/Storage rules as the authority boundary; the session cookie is a UI gate only.
3. Run lint, typecheck, and tests before opening a PR.
4. Never commit secrets or `.env*.local`.

## License

[GNU Affero General Public License v3.0](LICENSE.md) (AGPL-3.0).
