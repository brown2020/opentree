# OpenTree Project Guide

## Project Overview
Full-stack family tree application using Next.js, Firebase (Auth, Firestore, Storage), and D3.js for visualization. Licensed under GNU AGPL v3. Deployed on Vercel.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.4
- **TypeScript**: ^5 (strict mode)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Backend**: Firebase (Auth, Firestore, Storage) — Client SDK only, no Admin SDK
- **State**: Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Visualization**: D3.js submodules (d3-selection, d3-zoom, d3-transition, d3-hierarchy) for family tree
- **Fonts**: Geist (via next/font/google)
- **Date formatting**: date-fns
- **File uploads**: react-dropzone

## Commands
```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Create production build
npm start        # Run production server
npm run lint     # Run ESLint
```

## Project Structure
```
src/
├── app/
│   ├── (auth)/                        # Auth routes (guest-only)
│   │   ├── layout.tsx                 # GuestGuard wrapper + centered card layout
│   │   ├── error.tsx                  # Error boundary for auth routes
│   │   ├── login/page.tsx             # Login (Server Component with metadata)
│   │   ├── signup/page.tsx            # Signup (Server Component with metadata)
│   │   ├── forgot-password/page.tsx   # Password reset (Client Component)
│   │   ├── verify-email/page.tsx      # Email verification (Client Component)
│   │   └── email-link/page.tsx        # Passwordless sign-in completion
│   ├── (dashboard)/                   # Protected routes (auth required)
│   │   ├── layout.tsx                 # AuthGuard + Sidebar + Header
│   │   ├── error.tsx                  # Error boundary for dashboard routes
│   │   ├── page.tsx                   # Dashboard — list of user's trees
│   │   ├── tree/[treeId]/page.tsx     # Tree view — grid/tree of persons
│   │   └── person/[personId]/
│   │       ├── page.tsx               # Person detail (bio, links)
│   │       ├── edit/page.tsx          # Edit person form
│   │       ├── photos/page.tsx        # Photo gallery
│   │       ├── documents/page.tsx     # Document list
│   │       └── timeline/page.tsx      # Timeline events
│   ├── layout.tsx                     # Root layout (fonts, AuthProvider)
│   ├── globals.css                    # Tailwind import + CSS variables
│   └── favicon.ico
├── components/
│   ├── auth/
│   │   ├── AuthGuard.tsx              # Redirects unauthenticated users to /login
│   │   ├── GuestGuard.tsx             # Redirects authenticated users to /
│   │   ├── LoginForm.tsx              # Email/password + email link login
│   │   ├── SignupForm.tsx             # Registration form
│   │   └── SocialLoginButtons.tsx     # Google OAuth button
│   ├── person/
│   │   ├── AddPersonModal.tsx         # Modal wrapping PersonForm
│   │   ├── DocumentList.tsx           # Document CRUD with file upload
│   │   ├── PersonCard.tsx             # Person summary card (list view)
│   │   ├── PersonForm.tsx             # Add/edit person form with all fields
│   │   ├── PhotoGallery.tsx           # Photo grid + lightbox + upload
│   │   └── TimelineView.tsx           # Life events CRUD
│   ├── providers/
│   │   └── AuthProvider.tsx           # Firebase auth state → Zustand store
│   ├── tree/
│   │   ├── CreateTreeModal.tsx        # Create tree form in modal
│   │   ├── FamilyTree.tsx             # D3 SVG tree visualization with zoom/pan
│   │   └── TreeCard.tsx               # Tree summary card for dashboard
│   └── ui/
│       ├── Button.tsx                 # Variant button (primary/secondary/outline/ghost/danger)
│       ├── FileUpload.tsx             # Drag-and-drop file upload
│       ├── Header.tsx                 # Top bar with user dropdown
│       ├── Input.tsx                  # Form input with label/error
│       ├── LoadingSpinner.tsx         # Spinner + FullPageLoader
│       ├── Modal.tsx                  # Modal + ConfirmModal (sm/md/lg sizes)
│       └── Sidebar.tsx               # Left nav with links
└── lib/
    ├── firebase/
    │   ├── config.ts                  # Firebase app initialization + exports (auth, db, storage)
    │   ├── auth.ts                    # Auth functions (signUp, signIn, signOut, Google, email link, etc.)
    │   ├── firestore.ts              # Firestore CRUD (trees, persons) + cascade delete
    │   └── storage.ts                # Storage upload/delete (photos, documents)
    ├── hooks/
    │   ├── useAuth.ts                # Auth state selector from Zustand
    │   ├── useDocuments.ts           # Document CRUD hook
    │   ├── usePerson.ts              # Person CRUD + detail hooks
    │   ├── usePhotos.ts              # Photo CRUD hook with batch profile setting
    │   ├── useTimeline.ts            # Timeline event CRUD hook
    │   └── useTree.ts                # Tree CRUD + detail hooks
    ├── stores/
    │   ├── authStore.ts              # User, emailVerified, loading, initialized
    │   └── treeStore.ts              # currentTree, persons, selectedPersonId
    ├── types/
    │   ├── index.ts                  # Re-exports + User interface
    │   ├── person.ts                 # Person, Gender types
    │   ├── tree.ts                   # Tree type
    │   ├── relationship.ts           # Relationship, RelationshipType types
    │   ├── event.ts                  # PersonEvent, EventType, EventFormData, EVENT_TYPE_LABELS
    │   └── media.ts                  # Photo, Document, DocumentType types + labels
    └── utils/
        ├── validation.ts             # Zod schemas (login, signup, tree, person) — single source of truth for form types
        ├── treeLayout.ts             # getNodeColor, getNodeBackgroundColor
        └── dateFormat.ts             # toLocalDateString (timezone-safe date formatting)
```

## Path Aliases
- `@/*` → `./src/*` (e.g., `import { Button } from "@/components/ui/Button"`)

## Firebase Setup
1. Copy `.env.local.example` to `.env.local`
2. Add Firebase config from console.firebase.google.com
3. Enable Authentication (Email/Password + Google)
4. Create Firestore database
5. Enable Storage
6. Deploy `firestore.rules` and `storage.rules`

## Environment Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
```
All are `NEXT_PUBLIC_` (client-side). No server-side env vars. No Firebase Admin SDK.

## Data Model (Firestore)
```
users/{userId}
  - email, displayName, photoURL, createdAt, updatedAt

trees/{treeId}
  - userId, name, description, rootPersonId, createdAt, updatedAt

  └── persons/{personId}
        - firstName, lastName, middleName, maidenName, gender, birthDate,
          birthPlace, deathDate, deathPlace, isLiving, profilePhotoUrl, bio,
          createdAt, updatedAt

        ├── photos/{photoId}
        │     - url, thumbnailUrl, caption, date, isProfilePhoto, storagePath, createdAt

        ├── documents/{documentId}
        │     - url, name, type, description, date, storagePath, fileSize, mimeType, createdAt

        ├── events/{eventId}
        │     - type, title, description, date, endDate, place, createdAt

        └── relationships/{relationshipId}
              - type, relatedPersonId, startDate, endDate, createdAt
```

## Security Rules
- **firestore.rules** — Auth enforced on every collection. Tree access scoped to owner via `isTreeOwner()` helper. Field/type validation on creates. Subcollection access inherits tree ownership check.
- **storage.rules** — Auth enforced, user-scoped paths (`users/{userId}/...`). Photos: 10MB max, images only. Documents: 25MB max, images + PDF.

## Auth Flows
1. **Email/password** — signup with email verification required, login, password reset
2. **Google OAuth** — popup-based, auto-creates user doc if first login
3. **Email link (passwordless)** — sends magic link, stores email in localStorage for return trip
4. **Email verification** — required for dashboard access. Unverified users redirected to /verify-email
5. **Auth state** — managed via `onAuthStateChanged` → Zustand store → `useAuth()` hook

## Current Features (what exists and works)
- ✅ Authentication (email/password, Google, email link, email verification, password reset)
- ✅ Dashboard showing all user's trees
- ✅ Create/delete trees with confirmation
- ✅ Tree view with D3 visualization (zoom, pan, grid layout) and list view toggle
- ✅ Add/edit/delete persons with full biographical data
- ✅ Photo upload, gallery, lightbox, set-as-profile, delete
- ✅ Document upload with type classification, view, delete
- ✅ Timeline events CRUD (birth, death, marriage, divorce, graduation, etc.)
- ✅ Responsive layout with sidebar and mobile hamburger menu
- ✅ Dark mode (system preference)
- ✅ Form validation with Zod
- ✅ Error boundaries on auth and dashboard route groups

## Known Limitations / Missing Features
- **No real relationship connections** — Persons exist in a tree but have no parent/child/spouse links. The relationships subcollection schema exists but nothing reads or writes it. The tree visualization is a flat grid, not a connected family tree.
- **No GEDCOM import/export** — No standard genealogy data format support
- **No sharing or collaboration** — Trees are single-user only. No invite system.
- **No search** — Cannot search for persons within a tree or across trees
- **No relationship calculator** — Cannot show how two people are related
- **No privacy controls for trees** — All trees are private by default with no public sharing option
- **No activity feed** — No history of changes or contributions
- **No Firebase Admin SDK** — Everything runs client-side. No server-side validation beyond Firestore rules. No API routes or Server Actions.
- **No middleware** — No server-side auth checking or route protection
- **Tree visualization is a flat grid** — Not a connected family tree. Persons are arranged in a grid with no relationship lines.
- **No onboarding** — New users see an empty dashboard with no guidance
- **No data export** — No way to download tree data
- **No profile/settings page** — Users can't update their name, email, or photo
- **d3-hierarchy is installed but unused** — Hierarchy layout code was removed as dead code

## Conventions
- **TypeScript First**: All files `.tsx` or `.ts`
- **App Router**: Use route groups `(auth)` and `(dashboard)`
- **Client Components**: Mark with `'use client'` when using hooks/state
- **Styling**: Utility-first Tailwind, emerald-600 as primary color
- **Dark Mode**: CSS media query with `dark:` prefix classes
- **Forms**: Use react-hook-form with zodResolver. Zod schemas are the single source of truth for form data types.
- **State**: Zustand for global state, React state for local
- **Dates**: Stored as Firestore Timestamps, converted with `timestampToDate()`. Date inputs use `toLocalDateString()` for timezone safety.
- **Uploads**: Storage first, then Firestore doc (prevents orphaned records)
- **Deletes**: Cascade delete subcollections + storage when deleting trees or persons
- **Batch writes**: Used for atomic multi-document updates (e.g., setAsProfile)

## Key Patterns
- **Auth Guards**: `AuthGuard` for protected routes, `GuestGuard` for auth pages
- **Custom Hooks**: One hook per data type (useTree, usePerson, usePhotos, etc.)
- **Modals**: Use `Modal` and `ConfirmModal` from UI components. Modal supports `size` prop (sm/md/lg).
- **File Uploads**: Use `FileUpload` component with react-dropzone
- **Suspense Boundaries**: All pages using `useSearchParams()` wrap content in `<Suspense>`
- **Error Boundaries**: `error.tsx` files in `(auth)` and `(dashboard)` route groups

## Development Notes
- Run `npm run lint` before commits
- Run `npm run build` to verify clean build
- All timestamps stored as Firestore `Timestamp`, convert with `timestampToDate()`
- Use `serverTimestamp()` for createdAt/updatedAt fields
- Person gender determines node color in tree visualization
- Form data types are inferred from Zod schemas (`PersonSchemaFormData`, `TreeSchemaFormData`, etc.) — do not create duplicate manual interfaces
