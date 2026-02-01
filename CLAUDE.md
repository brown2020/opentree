# OpenTree Project Guide

## Project Overview
Full-stack family tree application using Next.js, Firebase (Auth, Firestore, Storage), and D3.js for visualization. Licensed under GNU AGPL v3.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3
- **TypeScript**: ^5 (strict mode)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **State**: Zustand for client state
- **Forms**: React Hook Form + Zod validation
- **Visualization**: D3.js for family tree
- **Fonts**: Geist (via next/font/google)

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
│   ├── (auth)/           # Auth routes (login, signup)
│   ├── (dashboard)/      # Protected routes
│   │   ├── tree/[treeId]/    # Tree view
│   │   └── person/[personId]/ # Person detail, photos, docs, timeline
│   └── layout.tsx
├── components/
│   ├── auth/             # AuthGuard, GuestGuard, forms
│   ├── person/           # PersonCard, PersonForm, PhotoGallery, etc.
│   ├── tree/             # FamilyTree (D3), TreeCard, CreateTreeModal
│   ├── providers/        # AuthProvider
│   └── ui/               # Button, Input, Modal, Sidebar, Header, etc.
├── lib/
│   ├── firebase/         # config, auth, firestore, storage utilities
│   ├── hooks/            # useAuth, useTree, usePerson, usePhotos, etc.
│   ├── stores/           # Zustand stores (authStore, treeStore)
│   ├── types/            # TypeScript interfaces
│   └── utils/            # validation schemas, treeLayout helpers
```

## Path Aliases
- `@/*` → `./src/*` (e.g., `import { Button } from "@/components/ui/Button"`)

## Firebase Setup
1. Copy `.env.local.example` to `.env.local`
2. Add Firebase config from console.firebase.google.com
3. Enable Authentication (Email/Password)
4. Create Firestore database
5. Enable Storage

## Data Model (Firestore)
```
users/{userId}
trees/{treeId}
  └── persons/{personId}
        ├── relationships/{relationshipId}
        ├── events/{eventId}
        ├── photos/{photoId}
        └── documents/{documentId}
```

## Conventions
- **TypeScript First**: All files `.tsx` or `.ts`
- **App Router**: Use route groups `(auth)` and `(dashboard)`
- **Client Components**: Mark with `'use client'` when using hooks/state
- **Styling**: Utility-first Tailwind, emerald-600 as primary color
- **Dark Mode**: CSS media query with `dark:` prefix classes
- **Forms**: Use react-hook-form with zodResolver
- **State**: Zustand for global state, React state for local

## Key Patterns
- **Auth Guards**: `AuthGuard` for protected routes, `GuestGuard` for auth pages
- **Custom Hooks**: One hook per data type (useTree, usePerson, usePhotos, etc.)
- **Modals**: Use `Modal` and `ConfirmModal` from UI components
- **File Uploads**: Use `FileUpload` component with react-dropzone

## Development Notes
- Run `npm run lint` before commits
- All timestamps stored as Firestore `Timestamp`, convert with `timestampToDate()`
- Use `serverTimestamp()` for createdAt/updatedAt fields
- Person gender determines node color in tree visualization
