# OpenTree — Product Specification

Authoritative product spec and roadmap for OpenTree. Supersedes prior planning documents including the old `spec.md` competitor-gap checklist.

For agent/development instructions, see [AGENTS.md](./AGENTS.md).

---

## 1. Product overview

### Product promise

OpenTree is a **free, open-source family tree builder** that lets anyone create rich family histories, visualize relationships, collaborate with relatives, and **own their data** — full GEDCOM export plus a ZIP of all media, with no subscription or lock-in.

Licensed under **GNU AGPL v3**. Deployed on **Vercel** with **Firebase** as the backend.

### Target users

| Segment | Need |
|---------|------|
| Family historians | Build accurate trees, attach sources and media, export and preserve data |
| Casual genealogists | Quick onboarding, intuitive tree view, add parents/grandparents without training |
| Collaborating families | Share a tree with relatives; editors contribute, viewers browse |
| Privacy-conscious users | Control public vs private visibility; *(living-person redaction planned — see gaps)* |
| Open-source advocates | Self-hostable stack, no vendor lock-in, inspectable code |

### Core workflows

1. **Sign up / sign in** → verify email → land on dashboard
2. **First tree** → onboarding wizard (tree name → yourself → optional parents) or create tree manually
3. **Build tree** → add people, link relationships, visualize connected pedigree, search/filter
4. **Enrich profiles** → photos, documents, timeline events, bio and vital facts
5. **Collaborate** → invite members by email (viewer/editor), toggle public visibility
6. **Export / import** → GEDCOM download, GEDCOM import into existing tree, full ZIP backup
7. **Discover connections** → relationship calculator between any two people in a tree

### Product goals

1. **Relationships are the product** — a working connected tree is non-negotiable
2. **Data freedom** — export everything, standard formats, no hostage data
3. **Modern UX** — fast, clean, mobile-responsive, dark mode
4. **Free and complete** — no paywalled features
5. **Trustworthy collaboration** — clear roles, activity visibility, privacy controls

---

## 2. Current application state

*Verified by code review, May 2026. Items marked **(inferred)** are conclusions from code inspection, not user-tested claims.*

### What the app does today

OpenTree is a fully client-rendered Next.js app. Users authenticate via Firebase Auth; all reads/writes go directly from the browser to Firestore and Storage, enforced by security rules.

### Feature inventory

| Area | Status | Notes |
|------|--------|-------|
| Email/password auth | ✅ | Signup requires email verification |
| Google OAuth | ✅ | Popup-based |
| Email link (passwordless) | ✅ | Email stored in localStorage for return trip |
| Password reset | ✅ | |
| Onboarding wizard | ✅ | 3-step first-tree flow when user has zero trees |
| Dashboard | ✅ | Owned + shared trees, person counts, activity summary |
| Create / delete trees | ✅ | Cascade delete of persons, relationships, members, activity, storage |
| D3 family tree visualization | ✅ | Custom BFS layout (`familyTreeLayout.ts`), zoom/pan, re-root |
| List view toggle | ✅ | Alternative to tree visualization |
| In-tree search | ✅ | Filter by name; selects and re-roots |
| Person CRUD | ✅ | Full biographical fields + `isLiving` flag |
| Relationship CRUD | ✅ | Parent, child, spouse; tree-level storage |
| Relationship validation | ✅ | Duplicates, cycles, age warnings (warnings, not hard blocks) |
| Inferred siblings | ✅ | From shared parents |
| Inferred step-relationships | ✅ | Computed on person detail page |
| Relationship calculator | ✅ | BFS shortest path + cousin degree |
| Person detail tabs | ✅ | Overview, Photos, Documents, Timeline |
| Photo gallery | ✅ | Upload, lightbox, set profile photo, delete |
| Document management | ✅ | Typed uploads (PDF/images), view, delete |
| Timeline events | ✅ | Birth, death, marriage, etc. |
| GEDCOM export | ✅ | Client-side 5.5.1 generation |
| GEDCOM import | ✅ | Preview modal with counts and sample names before merge |
| Full ZIP export | ✅ | GEDCOM + all photos/documents per person |
| Member sharing | ✅ | Invite by email; pending invites for users without accounts |
| Public/private toggle | ✅ | Toggle + guest route at `/tree/[treeId]/public`; living-person redaction for guests |
| Activity feed | ✅ | All CRUD paths log via hooks; per-tree and dashboard feeds |
| User settings | ✅ | Display name, photo, password, theme |
| Dark mode | ✅ | system/light/dark via localStorage |
| Error boundaries | ✅ | Auth and dashboard route groups |

### Current user flows

```
/auth routes (GuestGuard)
  login | signup | forgot-password | verify-email | email-link

/dashboard routes (AuthGuard — requires auth + verified email)
  /                     Dashboard
  /settings             Profile & theme
  /tree/[treeId]        Tree visualization + settings modal
  /person/[personId]    Tabbed person detail (+ /edit, /photos, /documents, /timeline)
```

### Integrations

| Service | Usage |
|---------|-------|
| Firebase Auth | All authentication |
| Cloud Firestore | Trees, persons, relationships, members, activity, users |
| Firebase Storage | Profile photos, person photos, documents |
| Vercel | Hosting/deployment **(inferred from docs and Next.js setup)** |
| Google OAuth | Social login via Firebase |

No third-party analytics, payment, email delivery (beyond Firebase Auth emails), or record-database integrations.

### Architecture summary

- **Frontend:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4
- **State:** Zustand (`authStore`, `treeStore`) + per-hook fetch state
- **Data access:** Firebase client SDK modules in `src/lib/firebase/`
- **Validation:** Zod schemas in `src/lib/utils/validation.ts`
- **Visualization:** D3 selection/zoom/transition + custom layout (not d3-hierarchy)
- **Security:** `firestore.rules` and `storage.rules` — no server-side enforcement layer
- **No API routes, Server Actions, middleware, Admin SDK, background jobs, or cron**

### Data model

```
users/{userId}
trees/{treeId}
  ├── relationships/{id}     type: parent-child | spouse
  ├── members/{userId}       role: editor | viewer
  ├── activity/{id}          append-only audit log
  └── persons/{personId}
        ├── photos/{id}
        ├── documents/{id}
        └── events/{id}
```

Relationships are stored at the **tree level** (one query loads all). `buildAdjacencyMap()` resolves the graph for display and export.

Storage files live under `users/{ownerId}/trees/{treeId}/persons/...` regardless of which member uploaded them.

### Technical constraints

1. **Client-only architecture** — all business logic runs in the browser; secrets cannot be hidden
2. **Firestore batch limit** — 500 operations per batch (handled in `batchDeleteDocs`)
3. **No real-time listeners** — data fetched on mount and after mutations; no `onSnapshot` **(inferred)**
4. **Auth guards are client-side** — dashboard routes flash loader then redirect; not server-enforced
5. **Public tree guest access** — unauthenticated reads allowed for public trees (persons, relationships); members/activity remain private
6. **Storage public reads** — public tree media readable without auth; living-person photos still redacted in UI
7. **No automated test suite** — quality relies on lint + build + manual testing
8. **No `.env.local.example`** — new developers must create `.env.local` manually from Firebase console

### Known limitations

| Limitation | Impact |
|------------|--------|
| No living-person redaction on public trees | ~~Living people's full details visible~~ **Fixed in Milestone 1** — client-side redaction; Firestore still returns full records |
| No pending invite system | ~~Cannot invite unsigned users~~ **Fixed in Milestone 3** — pending invites resolve on signup + verification |
| No GEDCOM import preview | ~~Import merges immediately~~ **Fixed in Milestone 2** — preview modal before commit |
| No guest/public viewing route | ~~Requires login~~ **Fixed in Milestone 4** — `/tree/[treeId]/public` read-only route |
| Activity logging incomplete | ~~Not all CRUD paths~~ **Fixed in Milestone 5** — centralized hook-based logging |
| No duplicate-person detection | ✅ | Name + birth year similarity warning on add person and GEDCOM import preview |
| No person merge | Fixing duplicates requires manual cleanup |
| No source/citation model | Records cannot be attached as structured sources |
| No printable chart export | ✅ | SVG pedigree export from tree view; Letter-sized, privacy-aware |
| Step-relationships not stored | Recomputed each render; cannot edit or override |
| README is boilerplate | GitHub landing page does not describe the project |

### Abandoned or partial systems

- **Old flat-grid tree view** — replaced by connected D3 pedigree (confirmed removed)
- **Per-person relationship subcollections** — migrated to tree-level relationships **(inferred from architecture)**
- **competitor-analysis.md** — retained as market research archive; not a living roadmap (see pointer at top of that file)

---

## 3. Product roadmap

Ordered by product impact and dependency. Each item is sized for one focused commit sequence on `dev`.

---

### Milestone 1: Living person privacy in public trees ✅ DONE

**User value:** Families can safely share trees publicly without exposing living relatives' birth dates, places, photos, or bios.

**Acceptance criteria:**
- When a tree is public, persons with `isLiving: true` show name + "Living" only in tree view, list view, search results, and person detail
- Living persons' photos, documents, timeline, and bio are hidden from non-owner/non-editor viewers
- Tree owner and editors see full data regardless
- Private trees unchanged

**Implementation note (May 2026):** Added `personPrivacy.ts` + `useTreePrivacy` hook. Redaction applied in FamilyTree, PersonCard, TreeSearch, person detail page, relation links, and GEDCOM export. Client-side only — raw Firestore data remains accessible to determined clients; server-side field filtering deferred.

---

### Milestone 2: GEDCOM import preview ✅ DONE

**User value:** Users can review what an import will add before modifying their tree.

**Acceptance criteria:**
- Selecting a `.ged` file shows a summary modal: person count, family count, sample names
- User confirms or cancels; no Firestore writes until confirm
- Clear warning when importing into a non-empty tree (merge, not replace)
- Errors (malformed file) shown before any writes

**Implementation note (May 2026):** Added `gedcomImport.ts` with `parseGedcomForImport()` validation, `GedcomImportPreviewModal`, and split parse/commit flow in `TreeSettingsModal` + `handleCommitGedcomImport` on the tree page. Parse errors show in settings; commit errors show in the preview modal.

---

### Milestone 3: Pending collaboration invites ✅ DONE

**User value:** Tree owners can invite relatives who have not signed up yet; access granted automatically on signup.

**Acceptance criteria:**
- Inviting unknown email creates a pending invite (not an error)
- On signup + email verification, pending invites resolve to `members/` docs and `memberIds`
- Owner sees pending vs accepted status in tree settings
- Owner can revoke pending invites

**Implementation note (May 2026):** Added `trees/{treeId}/invites/{email}` subcollection, updated `addTreeMember()` to create pending invites, `resolvePendingInvitesForUser()` via collection group query on email verification (`AuthProvider` + verify-email page). Owner UI shows pending vs active members; revoke supported. Firestore rules + collection group index added. User emails normalized to lowercase on signup for reliable matching.

---

### Milestone 4: Public read-only tree viewing ✅ DONE

**User value:** Anyone with a link can view a public tree without creating an account.

**Acceptance criteria:**
- `/tree/[treeId]/public` or similar route accessible without AuthGuard
- Unauthenticated read of public tree data per updated Firestore rules
- Living person redaction (Milestone 1) applies
- No edit affordances for guests
- Clear CTA to sign up for editing

**Implementation note (May 2026):** Added `(public)` route group at `/tree/[treeId]/public` with guest layout and read-only tree/list views. Updated Firestore rules for unauthenticated read of public trees (persons, relationships — not members/activity/invites) and Storage rules for public media. `FamilyTree`/`PersonCard` `readOnly` mode; public link copy in tree settings.

---

### Milestone 5: Complete activity logging ✅ DONE

**User value:** Collaborators see a trustworthy history of all tree changes.

**Acceptance criteria:**
- Activity entries for: person edit, photo add/delete, document add/delete, event add/delete, relationship delete, GEDCOM import, member add/remove
- Dashboard consolidated feed includes all entry types
- Logged user display name and timestamp on each entry

**Implementation note (May 2026):** Centralized `logTreeActivity()` in data hooks (`usePerson`, `usePhotos`, `useDocuments`, `useTimeline`, `useRelationships`, `useMembers`). Added delete/import activity types, shared `activityIcons`, and `activityStore` bump to refresh feeds after mutations. GEDCOM import logged from tree page; person edit uses `usePersons.update()`.

---

### Milestone 6: Duplicate person detection ✅

**User value:** Users avoid cluttered trees from accidental double-entry or messy GEDCOM imports.

**Acceptance criteria:**
- When adding a person or confirming GEDCOM import, warn if similar name + overlapping birth year exists
- Warning is dismissible; not a hard block
- "View possible duplicate" link to existing person

**Implementation note (May 2026):** Added `findSimilarPersons()` and `findGedcomImportDuplicates()` in `duplicatePerson.ts`. `PersonForm` shows dismissible `DuplicatePersonWarning` before create; GEDCOM preview lists possible duplicates with view links. Exact normalized name match; birth years must match when both known.

---

### Milestone 7: Printable pedigree export ✅

**User value:** Users can print or share a beautiful chart — a tangible output competitors charge for.

**Acceptance criteria:**
- "Export chart" action on tree view produces PDF or SVG of current rooted pedigree
- Output includes names and lifespan; respects living person redaction
- Readable at A4/Letter print size

**Implementation note (May 2026):** Added `pedigreeChartExport.ts` to render standalone SVG from `layoutFamilyTree` coordinates. Tree view "Export chart" downloads a Letter-sized SVG using privacy-redacted display persons. Users can print the SVG to PDF from any viewer; `printPedigreeChart()` helper included for future use.

---

### Milestone 8: Real-time collaborative updates

**User value:** Multiple editors see each other's changes without manual refresh.

**Acceptance criteria:**
- When another editor adds/edits a person in the same tree, local view updates within seconds
- No duplicate fetch storms; unsubscribe on unmount

**Implementation intent:** Replace one-shot `getDocs` in `usePerson` / tree page with Firestore `onSnapshot` listeners scoped to active tree.

---

### Milestone 9: Person merge

**User value:** Users can fix duplicate entries without manual relationship rewiring.

**Acceptance criteria:**
- Select two persons → merge into one survivor
- Relationships, photos, documents, events combined; duplicate relationships deduplicated
- Merge is irreversible with confirmation modal

**Implementation intent:** Transaction or batched writes: re-point relationships, move subcollections, delete merged person.

---

### Milestone 10: Source citations

**User value:** Serious genealogists can attach evidence to facts, building trust in the tree.

**Acceptance criteria:**
- Add source to a person (title, url or file, date, notes)
- Sources listed on person Overview tab
- Included in GEDCOM export (`SOUR` records)

**Implementation intent:** New `sources` subcollection under person; lightweight form; extend `gedcom.ts` export.

---

## Out of scope

These are intentionally **not** on the roadmap (see `competitor-analysis.md` for rationale):

- Historical records database or hint system
- DNA testing / matching
- AI photo recognition
- Native mobile apps (responsive web is sufficient for now)
- Newspapers.com / paid archive integrations

---

## Related documents

| Document | Purpose |
|----------|---------|
| [AGENTS.md](./AGENTS.md) | Agent/developer instructions |
| [competitor-analysis.md](./competitor-analysis.md) | Archived Ancestry.com market research |
| [LICENSE.md](./LICENSE.md) | GNU AGPL v3 |
| [README.md](./README.md) | Quick start for humans |
