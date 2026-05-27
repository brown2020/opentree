# OpenTree

Free, open-source family tree builder. Create connected pedigree charts, collaborate with family, upload photos and documents, and export your full tree (GEDCOM + media).

- **Product spec & roadmap:** [spec.md](./spec.md)
- **Agent/developer guide:** [AGENTS.md](./AGENTS.md)
- **License:** GNU AGPL v3 — see [LICENSE.md](./LICENSE.md)

## Quick start

```bash
npm install
# Create .env.local with NEXT_PUBLIC_FIREBASE_* vars (see AGENTS.md)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Firebase setup

1. Create a Firebase project with **Authentication** (Email/Password + Google), **Firestore**, and **Storage**
2. Add web app credentials to `.env.local` (all `NEXT_PUBLIC_FIREBASE_*` vars — see [AGENTS.md](./AGENTS.md))
3. Deploy security rules: `firebase deploy --only firestore:rules,storage`

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint
npm start        # Run production build
```

## Deploy

Deployed on [Vercel](https://vercel.com). Connect the repo and set the same `NEXT_PUBLIC_*` environment variables.
