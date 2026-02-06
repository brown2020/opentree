# OpenTree Spec — Competing with Ancestry.com

## Guiding Principles

1. **Free and open source** — this is our core differentiator. No paywalls, no subscriptions, no locked features.
2. **Data freedom** — users own their data. Full export, standard formats, no lock-in.
3. **Modern and fast** — clean UI, fast interactions, no legacy cruft.
4. **Relationships are the product** — a family tree app without working relationships is not a family tree app. This is job #1.

---

## 1. Table Stakes Gaps

Things Ancestry has that we're missing entirely. Must add to be a credible family tree app.

### 1.1 Working Relationships & Connected Tree Visualization ✅ DONE
- **What we have**: Persons exist in a tree but have zero connections. The `relationships` subcollection is defined but never written to or read. The "tree view" is a flat grid of person cards.
- **What Ancestry does**: Full parent/child, spouse, and sibling relationships. Pedigree chart shows ancestors branching upward. Family view shows a couple with their children below.
- **What we'll build**:
  - **Relationship CRUD**: When viewing a person, users can add relationships: "Add Parent", "Add Spouse", "Add Child". Each creates a bidirectional relationship (adding a parent to Person A also adds Person A as a child of the parent). Users can link to an existing person in the tree or create a new person inline.
  - **Relationship types**: parent/child, spouse (with optional marriage date/end date). Sibling is inferred (shared parent), not stored directly.
  - **Connected tree visualization**: Replace the flat grid with an actual family tree. Use d3-hierarchy to render a pedigree-style chart: selected person in the center, ancestors branching upward, descendants branching downward, spouses shown side-by-side. Connecting lines between related persons.
  - **Person detail shows relationships**: The person detail page shows parents, spouse(s), children, and siblings in clearly labeled sections with clickable links.

### 1.2 Search Within Tree ✅ DONE
- **What we have**: Nothing. No way to find a person except scrolling.
- **What Ancestry does**: Search across trees and records by name, date, place.
- **What we'll build**:
  - **Tree search bar**: A search input at the top of the tree view page. Filters persons in real-time by first name, last name, or maiden name. Case-insensitive substring match.
  - **Search highlights**: Matching persons are highlighted in both tree view and list view. Clicking a result selects and centers on that person in the tree visualization.

### 1.3 GEDCOM Export ✅ DONE
- **What we have**: Nothing. No data export of any kind.
- **What Ancestry does**: GEDCOM import and export (text-only, no media).
- **What we'll build**:
  - **GEDCOM export**: A "Download GEDCOM" button in tree settings. Generates a standard GEDCOM 5.5.1 file containing all persons, relationships, and events in the tree. Does not include media files (standard GEDCOM limitation) but includes references to them.
  - **Implementation**: Client-side generation. Build the GEDCOM text from Firestore data, create a Blob, trigger download. No server needed.

### 1.4 GEDCOM Import ✅ DONE
- **What we have**: Nothing.
- **What Ancestry does**: Upload a GEDCOM file to create or populate a tree.
- **What we'll build**:
  - **GEDCOM import**: An "Import GEDCOM" option when creating a new tree. User uploads a `.ged` file. The app parses it client-side, extracts persons and relationships, and creates Firestore documents in a new tree.
  - **Preview before import**: Show a summary (X persons, Y families found) before committing.
  - **Implementation**: Client-side GEDCOM parsing. Use a lightweight parser or build one — GEDCOM is a simple line-based format.

### 1.5 Sharing & Collaboration ✅ DONE
- **What we have**: Nothing. Trees are single-user.
- **What Ancestry does**: Invite family members to view or edit a shared tree.
- **What we'll build**:
  - **Invite by email**: Tree owner can invite collaborators from tree settings. Enter an email, choose role (viewer or editor).
  - **Roles**: Owner (full control + delete), Editor (add/edit/delete persons, photos, documents, events), Viewer (read-only access).
  - **Data model**: `trees/{treeId}/members/{memberId}` subcollection with `{ userId, email, role, invitedAt, acceptedAt }`. The tree document gets a `memberIds` array for Firestore rules query filtering.
  - **Firestore rules update**: Allow read/write access to tree members based on role. Viewers can read, editors can read+write, owner has full access.
  - **Pending invites**: If the invited email isn't a registered user, store the invite. When they sign up and verify email, match pending invites and grant access.
  - **Tree list**: Dashboard shows both owned trees and trees shared with the user.

### 1.6 Relationship Calculator ✅ DONE
- **What we have**: Nothing.
- **What Ancestry does**: Shows how two people in a tree are related (e.g., "2nd cousin once removed").
- **What we'll build**:
  - **"How are we related?" feature**: Select two persons in the tree. The app calculates and displays their relationship path (e.g., "John is the grandfather of Mary" or "John and Mary are 1st cousins").
  - **Algorithm**: BFS/shortest-path through the relationship graph. Calculate generational distance to common ancestor(s) to determine cousin degree and removal.
  - **UI**: A button or mode in tree view: "Calculate Relationship". Click two persons. Show the result as text plus the path highlighted on the tree.

### 1.7 Privacy Controls ✅ DONE
- **What we have**: All trees are private. No public visibility option.
- **What Ancestry does**: Public/private toggle. Living people's details auto-hidden in public trees.
- **What we'll build**:
  - **Tree privacy setting**: Owner can set a tree as "Private" (default, only owner and invited members) or "Public" (anyone with the link can view, but cannot edit).
  - **Living person protection**: In public trees, persons marked as `isLiving: true` have their details hidden (show name and "Living" only — no dates, places, bio, or photos).
  - **Shareable link**: Public trees get a shareable read-only URL.

---

## 2. Improvement Opportunities

Things we both have (or will have) but where we can do better than Ancestry.

### 2.1 Onboarding Flow
- **What we have**: Empty dashboard, no guidance.
- **What Ancestry does**: Multi-step wizard starting with yourself, then parents, then grandparents.
- **What we'll build**:
  - **First tree wizard**: When a user has zero trees, show a guided flow instead of an empty state:
    1. "Let's start your family tree" — enter tree name
    2. "Start with yourself" — enter your name, birth date, gender
    3. "Add your parents" — two simple forms for mother and father (optional, can skip)
    4. Tree is created with you as root person, parents linked
  - **This replaces the current empty dashboard state**. After completing the wizard (or skipping it), the user sees their tree.

### 2.2 Person Detail Page
- **What we have**: Basic bio display with links to photos/documents/timeline as separate pages.
- **What Ancestry does**: Rich person page with facts, sources, photos, family members, hints — all on one page with tabs.
- **What we'll build**:
  - **Tabbed layout**: Single person page with tabs: Overview, Photos, Documents, Timeline.
  - **Overview tab**: Bio, key facts (birth, death, gender), relationship section (parents, spouses, children, siblings with clickable cards), and quick-add buttons for relationships.
  - **This consolidates the current separate pages** into a single page with client-side tab switching. Reduces navigation and page loads.

### 2.3 Tree Visualization ✅ DONE
- **What we have**: Flat grid with D3 zoom/pan. No relationship lines.
- **What Ancestry does**: Pedigree chart (ancestors only, expanding left-to-right), family group view.
- **What we'll build**:
  - **Pedigree chart**: Rooted at a selected person. Parents above, children below, spouses side-by-side. Connected with lines. Uses d3-hierarchy for layout.
  - **Navigation**: Click any person to re-root the tree on them. Double-click to open person detail.
  - **Minimap or zoom indicator**: Show current zoom level and a reset button (already have reset).
  - **Responsive nodes**: Person nodes show name, lifespan, and a small avatar. Selected node is highlighted.

### 2.4 Activity Feed
- **What we have**: Nothing.
- **What Ancestry does**: Shows recent changes to the tree.
- **What we'll build**:
  - **Simple activity log**: When a person is added, edited, or deleted, or a photo/document/event is added, record an activity entry in `trees/{treeId}/activity/{activityId}` with `{ type, description, userId, personId?, timestamp }`.
  - **Activity feed on dashboard**: Show recent activity across all user's trees. "You added John Smith to Smith Family Tree — 2 hours ago".
  - **Activity feed on tree page**: Show recent activity for that specific tree in a collapsible sidebar panel.

---

## 3. Differentiators

Things we can do that Ancestry doesn't, or ways we can be meaningfully better.

### 3.1 Completely Free
- No subscription tiers, no paywalls, no upsells. Every feature available to every user.
- This is not a feature to build — it's a positioning choice that's already made.

### 3.2 Full Data Export (Including Media)
- **What Ancestry does**: GEDCOM export (text only, no photos/documents).
- **What we'll build**:
  - **Full tree export**: Download a ZIP file containing the GEDCOM file plus all photos and documents organized in folders per person.
  - **This directly exploits Ancestry's #1 complaint**: losing access to records and media when you cancel.

### 3.3 Smart Relationship Inference
- **What Ancestry does**: Manually define every relationship.
- **What we'll build**:
  - **Auto-infer siblings**: If Person A and Person B share a parent, they're siblings. Display this automatically without storing a separate sibling relationship.
  - **Auto-infer step-relationships**: If Parent A has a spouse B, and B is not the biological parent of A's children, show B as step-parent.
  - **Relationship validation**: Warn if a relationship creates an impossible situation (e.g., someone being their own ancestor, birth date after death date of a parent).

### 3.4 User Profile & Settings
- **What we have**: No profile or settings page.
- **What we'll build**:
  - **Profile page**: Update display name and profile photo. View email (read-only). Change password (for email/password users).
  - **Settings**: Theme preference (system/light/dark), notification preferences (future).

---

## 4. Not Doing

Things Ancestry has that we're intentionally skipping.

### 4.1 Historical Records Database
Ancestry's 30B+ record database is their core moat and costs hundreds of millions to maintain. We're a tree-building tool, not a records service. Users can search FamilySearch.org (free) or other services for records and manually attach findings.

### 4.2 DNA Testing & Matching
Hardware product requiring lab partnerships, regulatory compliance, and massive infrastructure. Completely out of scope.

### 4.3 Ancestry Hints / Auto-Record Matching
Requires the records database above. Without it, there's nothing to match against.

### 4.4 AI Photo Recognition
Requires significant ML infrastructure. Could be a future feature but not in scope now.

### 4.5 Mobile Native Apps
We're responsive web. A PWA is possible later but native iOS/Android apps are out of scope.

### 4.6 Newspapers.com / Fold3 Integration
Third-party paid archives. Not relevant to our free, open-source approach.

### 4.7 Pro Tools (Tree Checker, Tree Mapper, Charts & Reports)
Nice-to-have features but not table stakes. Can add later. Relationship validation (3.3) covers the most important part of "tree checker."

---

## Implementation Priority

### Batch 1: Relationships & Tree Visualization (Foundation)
Without this, we don't have a family tree app. Everything else depends on relationships working.
- 1.1 Working Relationships & Connected Tree Visualization
- 2.3 Tree Visualization improvements

### Batch 2: Person Detail Consolidation
Improve the core person experience before adding more features.
- 2.2 Person Detail Page (tabbed layout with relationships)
- 3.3 Smart Relationship Inference

### Batch 3: Search & Navigation
Make large trees usable.
- 1.2 Search Within Tree
- 2.1 Onboarding Flow

### Batch 4: Data Portability
Table-stakes GEDCOM support.
- 1.3 GEDCOM Export
- 1.4 GEDCOM Import

### Batch 5: Collaboration & Sharing
Multi-user support.
- 1.5 Sharing & Collaboration
- 1.7 Privacy Controls

### Batch 6: Polish & Extras
Differentiation and quality-of-life.
- 1.6 Relationship Calculator
- 2.4 Activity Feed
- 3.2 Full Data Export (ZIP with media)
- 3.4 User Profile & Settings
