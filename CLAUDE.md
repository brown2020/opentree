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
│   │   ├── page.tsx                   # Dashboard — owned + shared trees
│   │   ├── tree/[treeId]/page.tsx     # Tree view — connected visualization + search + settings
│   │   └── person/[personId]/
│   │       ├── page.tsx               # Person detail (bio, relationships, links)
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
│   │   ├── PersonCard.tsx             # Person summary card (list view) + add relationship button
│   │   ├── PersonForm.tsx             # Add/edit person form with all fields
│   │   ├── PhotoGallery.tsx           # Photo grid + lightbox + upload
│   │   └── TimelineView.tsx           # Life events CRUD
│   ├── providers/
│   │   └── AuthProvider.tsx           # Firebase auth state → Zustand store
│   ├── tree/
│   │   ├── AddRelationshipModal.tsx   # Modal for adding parent/child/spouse relationships
│   │   ├── CreateTreeModal.tsx        # Create tree form in modal
│   │   ├── FamilyTree.tsx             # D3 SVG connected tree visualization with zoom/pan
│   │   ├── RelationshipCalculatorModal.tsx  # Calculate relationship between two persons
│   │   ├── TreeCard.tsx               # Tree summary card for dashboard (with shared/public badges)
│   │   ├── TreeSearch.tsx             # Search-as-you-type person finder
│   │   └── TreeSettingsModal.tsx      # Privacy, sharing, GEDCOM import/export
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
    │   ├── firestore.ts              # Firestore CRUD (trees, persons) + cascade delete + shared tree queries
    │   ├── members.ts                # Tree member/collaboration CRUD (invite, remove, role update)
    │   ├── relationships.ts          # Tree-level relationship CRUD + adjacency map builder
    │   └── storage.ts                # Storage upload/delete (photos, documents)
    ├── hooks/
    │   ├── useAuth.ts                # Auth state selector from Zustand
    │   ├── useDocuments.ts           # Document CRUD hook
    │   ├── useMembers.ts             # Tree member management hook
    │   ├── usePerson.ts              # Person CRUD + detail hooks
    │   ├── usePhotos.ts              # Photo CRUD hook with batch profile setting
    │   ├── useRelationships.ts       # Tree-level relationship CRUD hook
    │   ├── useTimeline.ts            # Timeline event CRUD hook
    │   └── useTree.ts                # Tree CRUD + detail hooks
    ├── stores/
    │   ├── authStore.ts              # User, emailVerified, loading, initialized
    │   └── treeStore.ts              # currentTree, persons, relationships, selectedPersonId, rootPersonId
    ├── types/
    │   ├── index.ts                  # Re-exports + User interface
    │   ├── person.ts                 # Person, Gender types
    │   ├── tree.ts                   # Tree, TreeMember, MemberRole types
    │   ├── relationship.ts           # Relationship type (parent-child | spouse) at tree level
    │   ├── event.ts                  # PersonEvent, EventType, EventFormData, EVENT_TYPE_LABELS
    │   └── media.ts                  # Photo, Document, DocumentType types + labels
    └── utils/
        ├── validation.ts             # Zod schemas (login, signup, tree, person) — single source of truth for form types
        ├── familyTreeLayout.ts       # Generation-based family tree layout algorithm (BFS, couple centering)
        ├── treeLayout.ts             # getNodeColor, getNodeBackgroundColor
        ├── gedcom.ts                 # GEDCOM 5.5.1 export/import (parse + generate + download)
        ├── relationshipCalculator.ts # BFS-based relationship path calculator (cousin, in-law, etc.)
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
  - userId, name, description, rootPersonId, isPublic, memberIds[], createdAt, updatedAt

  ├── relationships/{relationshipId}     (tree-level, not per-person)
  │     - type ('parent-child' | 'spouse'), person1Id, person2Id,
  │       marriageDate, divorceDate, createdAt

  ├── members/{memberId}                 (userId as doc ID)
  │     - userId, email, displayName, role ('editor' | 'viewer'),
  │       addedBy, addedAt

  └── persons/{personId}
        - firstName, lastName, middleName, maidenName, gender, birthDate,
          birthPlace, deathDate, deathPlace, isLiving, profilePhotoUrl, bio,
          createdAt, updatedAt

        ├── photos/{photoId}
        │     - url, thumbnailUrl, caption, date, isProfilePhoto, storagePath, createdAt

        ├── documents/{documentId}
        │     - url, name, type, description, date, storagePath, fileSize, mimeType, createdAt

        └── events/{eventId}
              - type, title, description, date, endDate, place, createdAt
```

## Security Rules
- **firestore.rules** — Auth enforced on every collection. Three access levels:
  - `isTreeOwner()` — full access to tree owner
  - `canEditTree()` — owner + editor members can write
  - `canAccessTree()` — owner + all members + public trees can read
  - Field/type validation on creates. Subcollection access uses tree-level access checks.
  - Users collection allows lookup by email for sharing invites.
- **storage.rules** — Auth enforced, user-scoped paths (`users/{userId}/...`). Photos: 10MB max, images only. Documents: 25MB max, images + PDF.

## Auth Flows
1. **Email/password** — signup with email verification required, login, password reset
2. **Google OAuth** — popup-based, auto-creates user doc if first login
3. **Email link (passwordless)** — sends magic link, stores email in localStorage for return trip
4. **Email verification** — required for dashboard access. Unverified users redirected to /verify-email
5. **Auth state** — managed via `onAuthStateChanged` → Zustand store → `useAuth()` hook

## Current Features (what exists and works)
- Authentication (email/password, Google, email link, email verification, password reset)
- Dashboard showing owned trees + trees shared with user
- Create/delete trees with confirmation
- Tree view with connected D3 family tree visualization (ancestors above, descendants below, spouses side-by-side, connecting lines) and list view toggle
- Re-root tree on any person (click target icon on node)
- Search within tree (real-time filtering by name)
- Add/edit/delete persons with full biographical data
- Relationship CRUD (add parent, add child, add spouse) with bidirectional linking
- Relationship calculator (select two persons → shows relationship label like "1st Cousin")
- Person detail page shows parents, spouses, children, siblings as clickable cards
- Photo upload, gallery, lightbox, set-as-profile, delete
- Document upload with type classification, view, delete
- Timeline events CRUD (birth, death, marriage, divorce, graduation, etc.)
- GEDCOM 5.5.1 export (download .ged file with all persons, families, and events)
- GEDCOM 5.5.1 import (upload .ged file to populate tree with persons + relationships)
- Sharing & collaboration (invite members by email, viewer/editor roles)
- Privacy controls (public/private toggle — public trees are viewable by anyone with the link)
- Tree settings modal (privacy, sharing, GEDCOM import/export)
- Responsive layout with sidebar and mobile hamburger menu
- Dark mode (system preference)
- Form validation with Zod
- Error boundaries on auth and dashboard route groups

## Known Limitations / Still Missing
- **No living person hiding in public trees** — Public trees show all data; living person redaction not yet implemented
- **No pending invite system** — Invites only work if the user already has an account
- **No GEDCOM import preview** — Import creates persons/relationships immediately without showing a summary first
- **No activity feed** — No history of changes or contributions
- **No Firebase Admin SDK** — Everything runs client-side. No server-side validation beyond Firestore rules.
- **No middleware** — No server-side auth checking or route protection
- **No onboarding wizard** — New users see an empty dashboard with no guided flow
- **No full ZIP export** — GEDCOM export exists but no media-inclusive ZIP download
- **No profile/settings page** — Users can't update their name, email, or photo
- **No step-relationship inference** — Only biological relationships are tracked

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
- **Deletes**: Cascade delete subcollections + storage + relationships when deleting trees or persons
- **Batch writes**: Used for atomic multi-document updates (e.g., setAsProfile, member management)
- **Relationships**: Stored at tree level (`trees/{treeId}/relationships/`), not per-person. One query loads all relationships for the entire tree.

## Key Patterns
- **Auth Guards**: `AuthGuard` for protected routes, `GuestGuard` for auth pages
- **Custom Hooks**: One hook per data type (useTree, usePerson, usePhotos, useRelationships, useMembers, etc.)
- **Modals**: Use `Modal` and `ConfirmModal` from UI components. Modal supports `size` prop (sm/md/lg).
- **File Uploads**: Use `FileUpload` component with react-dropzone
- **Suspense Boundaries**: All pages using `useSearchParams()` wrap content in `<Suspense>`
- **Error Boundaries**: `error.tsx` files in `(auth)` and `(dashboard)` route groups
- **Adjacency Map**: `buildAdjacencyMap()` in `relationships.ts` builds a per-person lookup of parents, children, and spouses from the flat relationship list. Used by tree layout, person detail, relationship calculator, and GEDCOM export.

## Development Notes
- Run `npm run lint` before commits
- Run `npm run build` to verify clean build
- All timestamps stored as Firestore `Timestamp`, convert with `timestampToDate()`
- Use `serverTimestamp()` for createdAt/updatedAt fields
- Person gender determines node color in tree visualization
- Form data types are inferred from Zod schemas (`PersonSchemaFormData`, `TreeSchemaFormData`, etc.) — do not create duplicate manual interfaces
- Relationships are stored at tree level (not per-person) to avoid N+1 queries
- The `buildAdjacencyMap` function is the canonical way to resolve relationships into usable structures
