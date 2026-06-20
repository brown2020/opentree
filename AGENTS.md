# OpenTree — Agent Instructions

Read this file before making any changes. `spec.md` is the authoritative product spec and roadmap.

## Project overview

OpenTree is a free, open-source (GNU AGPL v3) family tree web application. Users authenticate, create one or more trees, add people and relationships, upload photos and documents, and visualize connected pedigree charts. Data lives in Firebase (Auth, Firestore, Storage). The app is deployed on Vercel.

There is **no backend server** in this repo: no API routes, no Server Actions, and no Firebase Admin SDK. `src/proxy.ts` is a lightweight Next.js proxy for cookie-based route redirects only; all data access still runs in the browser via the Firebase client SDK, protected by Firestore and Storage security rules.

## Product purpose

Help people build, share, and preserve family history without subscriptions or data lock-in. Core value: working relationships, connected tree visualization, full data export (GEDCOM + media ZIP), and collaboration.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, custom UI components (not shadcn) |
| Language | TypeScript (strict) |
| Backend | Firebase client SDK — Auth, Firestore, Storage |
| State | Zustand (`authStore`, `treeStore`) + React local state |
| Forms | React Hook Form + Zod (`src/lib/utils/validation.ts`) |
| Tree viz | D3 submodules (`d3-selection`, `d3-zoom`, `d3-transition`) + custom BFS layout in `familyTreeLayout.ts` |
| Dates | date-fns; Firestore `Timestamp` converted via `timestampToDate()` |
| Uploads | react-dropzone via `FileUpload` component |
| Export | Client-side GEDCOM + JSZip full-tree export |
| Package manager | **npm** (use `package-lock.json`; never switch to yarn/pnpm) |

## Repository structure

```
src/
├── app/
│   ├── (auth)/          # Guest-only routes — GuestGuard
│   │   login, signup, forgot-password, verify-email, email-link
│   ├── (dashboard)/     # Protected routes — AuthGuard
│   │   page.tsx         # Dashboard (owned + shared trees, activity)
│   │   settings/        # Profile, password, theme
│   │   tree/[treeId]/   # Tree view (D3 viz, list view, search, settings)
│   │   person/[personId]/  # Tabbed detail + edit/photos/docs/timeline routes
│   ├── layout.tsx       # Root layout + AuthProvider
│   └── globals.css
├── components/
│   ├── auth/            # AuthGuard, GuestGuard, forms
│   ├── person/          # PersonForm, PhotoGallery, DocumentList, TimelineView
│   ├── tree/            # FamilyTree, modals, OnboardingWizard, ActivityFeed
│   ├── providers/       # AuthProvider
│   └── ui/              # Button, Input, Modal, Sidebar, Header, etc.
└── lib/
    ├── firebase/        # config, auth, firestore, storage, members, relationships, activity
    ├── hooks/           # useAuth, useTree, usePerson, usePhotos, useDocuments, etc.
    ├── stores/          # authStore, treeStore
    ├── types/           # Person, Tree, Relationship, Activity, media, events
    └── utils/           # validation, gedcom, exportZip, familyTreeLayout, relationshipCalculator
firestore.rules          # Deploy with Firebase CLI
storage.rules
firebase.json
```

Path alias: `@/*` → `./src/*`

## Core architecture

```
Browser (Next.js client components)
  → Firebase Auth (session)
  → Firestore / Storage (direct reads/writes)
  → Security rules enforce access (owner / editor / viewer / public read)
```

**Data model highlights:**
- Trees: `trees/{treeId}` with `userId`, `isPublic`, `memberIds[]`, `rootPersonId`
- Relationships: tree-level subcollection `trees/{treeId}/relationships/` (not per-person)
- Persons: `trees/{treeId}/persons/{personId}` with nested photos, documents, events
- Members: `trees/{treeId}/members/{userId}` with `editor` | `viewer` roles
- Activity: `trees/{treeId}/activity/` append-only log

**Canonical relationship resolution:** `buildAdjacencyMap()` in `src/lib/firebase/relationships.ts` — used by tree layout, person detail, GEDCOM export, relationship calculator.

**Storage paths:** `users/{ownerUserId}/trees/{treeId}/persons/{personId}/{photos|documents}/...` — files are always under the tree owner's UID even when editors upload.

## Key features (verified in code)

- Auth: email/password, Google OAuth, email link, email verification, password reset
- Onboarding wizard (first tree: name → self → parents)
- Dashboard: owned trees, shared trees, person counts, consolidated activity
- Tree view: D3 connected pedigree (ancestors up, descendants down, spouses side-by-side), list view toggle, re-root, search
- Person CRUD with biographical fields; tabbed detail (Overview, Photos, Documents, Timeline)
- Relationship CRUD (parent/child/spouse) with duplicate, cycle, and age warnings
- Inferred siblings and step-relationships (computed at display time, not stored)
- Relationship calculator (BFS path between two persons)
- Photo gallery, document upload, timeline events
- GEDCOM 5.5.1 export/import; full ZIP export (GEDCOM + media)
- Sharing: invite by email (viewer/editor); public/private toggle on tree
- Activity feed (tree page + dashboard summary)
- Settings: display name, profile photo, password change, theme (system/light/dark)
- Error boundaries on `(auth)` and `(dashboard)` route groups

## Important commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build (canonical typecheck + compile)
npm run lint     # ESLint
npm start        # Run production build locally
```

Firebase rules deploy (requires Firebase CLI login):
```bash
firebase deploy --only firestore:rules,storage
```

## Canonical validation

Run before committing:

```bash
npm run lint && npm run build && npm test
```

Unit tests run through Vitest with `npm test`. There is **no separate typecheck script** — `npm run build` runs TypeScript via Next.js.

## Non-interactive testing rules

- Never use watch mode (`--watch`, `-w`)
- Never open a headed browser or require manual login for CI-style checks
- Use `npm run lint`, `npm run build`, and `npm test` only
- Do not prompt for user input; pass non-interactive flags when available
- Firebase-dependent runtime behavior cannot be fully verified without `.env.local` credentials

## Development conventions

- **TypeScript first:** all source files `.ts` / `.tsx`
- **App Router:** route groups `(auth)` and `(dashboard)`
- **Client components:** mark `'use client'` when using hooks, state, or browser APIs
- **Styling:** Tailwind utility classes; emerald-600 primary; `dark:` variants for dark mode
- **Forms:** react-hook-form + `zodResolver`; infer form types from Zod schemas in `validation.ts` — do not duplicate interfaces
- **Dates:** store as Firestore `Timestamp`; use `toLocalDateString()` for date inputs
- **Uploads:** Storage first, then Firestore doc (prevents orphaned records)
- **Deletes:** cascade subcollections + storage + relationships (`deleteTree`, `deletePersonAndSubcollections`)
- **Batch writes:** chunk at 500 ops (`batchDeleteDocs`); use `writeBatch` for atomic multi-doc updates
- **Modals:** use `Modal` / `ConfirmModal` from `@/components/ui/Modal` with `size` prop
- **Suspense:** wrap pages using `useSearchParams()` in `<Suspense>`
- **Hooks:** one hook per data domain (`useTree`, `usePerson`, `usePhotos`, etc.)

## TypeScript and lint expectations

- `strict: true` in `tsconfig.json`
- ESLint via `eslint-config-next` (core-web-vitals + typescript)
- Fix lint errors in files you touch; do not drive large unrelated lint cleanups
- Prefer existing patterns over new abstractions

## Server / client boundary

Almost the entire app is client-side. There are:
- **No** `app/api/` routes
- **No** `'use server'` actions
- **Middleware** (`src/proxy.ts`) for cookie-based route redirects only

Server Components are used sparingly (e.g. auth page shells with metadata). Default to `'use client'` for anything touching Firebase, Zustand, or forms.

Do not introduce Server Actions or API routes unless the product explicitly requires server-side secrets (none exist today).

## Route protection

Protection uses **middleware** (session cookie) plus **client guards**:

| Layer | Location | Behavior |
|-------|----------|----------|
| `proxy.ts` | Server edge | Redirects based on `ot-auth` cookie (`1` = verified, `pending` = unverified) |
| `AuthGuard` | `(dashboard)/layout.tsx` | Redirect unauthenticated → `/login`; unverified → `/verify-email` |
| `GuestGuard` | `(auth)/layout.tsx` | Redirect authenticated → `/` |

`AuthProvider` syncs the `ot-auth` cookie when Firebase auth state changes. The cookie is a UX/defense-in-depth marker — not cryptographically verified. Firestore/Storage rules remain the authoritative data boundary. Full server-side token verification requires Firebase Admin SDK session cookies.

## State management

| Store / pattern | Purpose |
|-----------------|---------|
| `authStore` | Firebase user, `emailVerified`, `initialized`, `loading` |
| `treeStore` | Current tree session: persons, relationships, selection, root |
| Hook-local state | Fetch lifecycle, form state, modal open/close |
| React state in pages | View mode, sidebar, wizard visibility |

Prefer extending existing hooks/stores over adding new global state libraries.

## Testing expectations

No automated integration tests. Unit tests run via Vitest (`npm test`) for auth route matching and other pure logic.

## Files and systems requiring extra caution

| Area | Why |
|------|-----|
| `firestore.rules` / `storage.rules` | Production security; test rule changes mentally against owner/editor/viewer/public cases |
| `src/lib/firebase/firestore.ts` | Cascade delete, batch limits, tree ownership |
| `src/lib/firebase/members.ts` | Sharing invites, `memberIds` array sync |
| `src/lib/firebase/relationships.ts` | Graph integrity; `buildAdjacencyMap` is canonical |
| `src/lib/utils/gedcom.ts` | Import/export correctness; GEDCOM ID mapping |
| `src/lib/utils/familyTreeLayout.ts` | Layout algorithm; changes affect all tree rendering |
| `src/components/tree/FamilyTree.tsx` | Large D3 component; easy to break zoom/pan/selection |
| `firebase.json` | Contains project-specific bucket name |
| `.env.local` | Secrets; never commit (gitignored) |

## Environment variables

All Firebase config is client-side (`NEXT_PUBLIC_*`):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```

Copy credentials into `.env.local` manually. There is no `.env.local.example` in the repo currently.

## Git workflow

| Branch | Role |
|--------|------|
| `main` | Stable production — **never push directly** |
| `dev` | Autonomous working branch — commit here |

Autonomous agents:
- Work on `dev` only
- One focused, PR-sized change per run (even though commits go directly to `dev`)
- Pull `origin/dev` before starting and before pushing
- Do not open PRs or merge to `main` unless explicitly instructed
- Use conventional commit prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## Definition of done

A change is done when:
1. It matches the scoped task (one logical unit of work)
2. `npm run lint` passes
3. `npm run build` passes
4. Firestore/Storage rule changes are reflected in `firestore.rules` / `storage.rules` if data access changed
5. New UI follows existing Tailwind patterns and dark mode support
6. No secrets committed
7. Committed to `dev` and pushed to `origin/dev`

## Rules for autonomous runs

1. Read `AGENTS.md` and relevant sections of `spec.md` before coding
2. Inspect the code — do not trust docs alone
3. One focused change per run; do not bundle unrelated features
4. Reuse existing components, hooks, and utilities
5. Minimize diff scope; match surrounding code style
6. Do not refactor unrelated code
7. Do not switch package managers or add heavy dependencies without clear product need
8. Do not modify `.next/` or other generated output
9. Do not implement roadmap items unless they are the assigned task

## Stop conditions

Stop and report (do not guess) when:
- Working tree has uncommitted changes unrelated to your task
- `git pull` produces conflicts you cannot safely resolve
- Build fails due to missing Firebase env vars and the task requires runtime Firebase
- The task requires Firebase Admin SDK or server-side secrets (not available)
- Firestore rule changes need manual Firebase console verification you cannot perform
- Scope expands beyond a single PR-sized unit — document findings and stop

## Product planning

See `spec.md` for current state, known gaps, and the ordered product roadmap.
