# Agent Report

## Agent

Name: Codex

## Scope

Findings backlog for bugs, race risks, architecture/lean-code concerns, package/dead-code candidates, and the first executable improvement.

## Inputs

AGENTS.md, spec.md, package.json, baseline report, dashboard page, Firestore rules, key hooks, Firebase modules, tree visualization modules, auth route/proxy files, source search output.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: 5405e43990f42988059f8a52b02e5ad28ce051e6 before findings report edits
- Pushed to: Pending findings checkpoint
- Sync status: Clean and synced after baseline push

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: Produce an evidence-backed backlog and select the highest-priority locally verifiable task.
- Verify gate: every finding has severity, evidence, owned files, proposed fix, and verification.
- Stop condition: backlog prioritized and first executable task clear.
- Attempt: 1/1
- Result: Pass

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: 5405e43990f42988059f8a52b02e5ad28ce051e6
- Next action: Commit/push findings report, then execute F-001.
- Blockers: None

## Commands Run

```text
wc -l src/components/tree/FamilyTree.tsx src/lib/firebase/firestore.ts src/lib/firebase/relationships.ts src/lib/firebase/storage.ts src/lib/firebase/members.ts src/lib/hooks/useTree.ts src/lib/hooks/usePerson.ts src/lib/hooks/usePhotos.ts src/lib/hooks/useDocuments.ts src/lib/hooks/useTimeline.ts src/lib/utils/gedcom.ts src/lib/utils/gedcomImport.ts src/lib/utils/familyTreeLayout.ts src/lib/utils/relationshipCalculator.ts 'src/app/(dashboard)/tree/[treeId]/page.tsx' 'src/app/(dashboard)/page.tsx' 'src/app/(public)/tree/[treeId]/public/page.tsx'
rg -n "TODO|FIXME|HACK|eslint-disable|@ts-ignore|@ts-expect-error|console\." src firestore.rules storage.rules
rg -n "setTimeout|setInterval|onSnapshot|AbortController|isMounted|unsubscribe|localStorage|sessionStorage" src
rg -n "\bany\b|unknown|as " src --glob '*.{ts,tsx}'
rg -n "export async function|export function|export const" src/lib/firebase src/lib/hooks src/lib/utils
cat src/lib/firebase/relationships.ts
cat src/lib/hooks/useTree.ts
cat src/lib/utils/personPrivacy.ts
cat src/lib/hooks/usePerson.ts
cat src/lib/hooks/usePhotos.ts
cat src/lib/hooks/useDocuments.ts
cat src/lib/hooks/useTimeline.ts
cat src/lib/firebase/firestore.ts
cat src/lib/firebase/members.ts
cat 'src/app/(dashboard)/page.tsx'
cat firestore.rules
cat src/components/tree/TreeCard.tsx
cat src/lib/firebase/activity.ts
cat src/components/tree/ActivityFeed.tsx
cat src/lib/stores/treeStore.ts
cat 'src/app/(dashboard)/tree/[treeId]/page.tsx'
cat 'src/app/(public)/tree/[treeId]/public/page.tsx'
cat src/components/tree/FamilyTree.tsx
cat src/lib/hooks/useRelationships.ts
cat src/lib/hooks/useActivity.ts
cat src/lib/auth/session.ts
cat src/proxy.ts
cat src/lib/auth/routes.ts
cat src/lib/auth/routes.test.ts
cat src/components/ui/Sidebar.tsx
rg -n "getTreePersonCount|getTreeActivity\(|sharedTrees|consolidatedActivity|treeStats" src
nl -ba 'src/app/(dashboard)/page.tsx'
nl -ba firestore.rules
nl -ba src/lib/hooks/useTree.ts
nl -ba src/lib/hooks/usePerson.ts
nl -ba src/components/tree/FamilyTree.tsx
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P2 | Bug | Open | Dashboard shared trees | Dashboard summaries exclude shared trees and can show onboarding while shared trees are still loading. | `src/app/(dashboard)/page.tsx:83-158` fetches person counts and consolidated activity from `trees` only; `src/app/(dashboard)/page.tsx:235-270` renders onboarding/shared cards from separate owned/shared state; `firestore.rules:137-139` allows members to read activity and `firestore.rules:175-177` allows members to read persons through `canAccessTree`. | Users who only have shared trees may briefly see first-tree onboarding and never see shared-tree counts/activity on the dashboard. | Small | `npm run lint`, `npm test`, `npm run build`; inspect dashboard logic. | Fix in T-004. |
| F-002 | P3 | Lean code | Deferred | Data hooks | Several hooks duplicate fetch logic between `useCallback` refetch functions and mount effects. | `src/lib/hooks/useTree.ts:21-57`, `src/lib/hooks/usePerson.ts:23-59`, plus photos/documents/timeline/activity hooks repeat the same cancellation pattern. | More maintenance surface; future fixes must be repeated carefully. | Medium | Refactor one hook family at a time with lint/build. | Defer; not needed for F-001. |
| F-003 | P3 | Architecture | Deferred | Tree UI modules | Tree page, public tree page, and D3 component are large and own many concerns. | Line counts: `FamilyTree.tsx` 576, dashboard tree page 569, dashboard page 348, `familyTreeLayout.ts` 317. | Local reasoning is harder around visualization and tree workflows. | Medium/Large | Component extraction with visual regression or manual browser checks. | Defer; broad UI architecture decision. |
| F-004 | P3 | Test gap | Deferred | Dashboard UI | Baseline tests cover utilities/auth route logic but no React/dashboard behavior. | `npm test` output: 6 files/35 tests, none for `src/app/(dashboard)/page.tsx`; package has no React Testing Library dependency. | Dashboard regressions rely on lint/build and manual Firebase-backed checks. | Medium | Add a component test setup or pure helper tests after choosing test stack. | Defer; adding test tooling is broader than this fix. |
| F-005 | P3 | Package update | Deferred | Dependencies | Package drift/audit diagnostics not yet run in this phase. | `package.json` includes Next 16, React 19, Firebase 12, Vitest 3; package diagnostics are assigned to cleanup phase. | Possible patch/minor updates may exist. | Small/Medium | `npm outdated`, `npm audit`, lint/test/build after updates. | Evaluate in package cleanup phase. |

## Changes Made

- Wrote prioritized findings backlog and selected F-001 as the execution task.
- Updated run-state.md and task-queue.md.

## Verification

Checks performed and results: lint/test/build baseline was clean before this phase; source searches and file reads identified one P2 bug with concrete code/rules evidence. No source code changed in this phase.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | App/components call hooks and Firebase utilities; no server data layer introduced | None |
| Module cohesion | Watch | Large files: `FamilyTree.tsx` 576, tree page 569, dashboard page 348 | Defer F-003 |
| Public surface area | Watch | `src/lib/types/index.ts` re-exports types broadly; no high-confidence harm found | Defer |
| Data and side-effect flow | Fail | Dashboard has separate owned/shared flows but summaries use owned trees only (`page.tsx:83-158`) | Fix F-001 |
| Async/cache/resource lifecycle | Watch | Hooks use cancellation flags; no confirmed stale update bug found beyond dashboard shared-loading onboarding flicker | Fix F-001; defer hook refactor |
| Duplication and dead code | Watch | Hook fetch/refetch duplication found; no unused source proven | Defer F-002 |
| Dependency lean-ness | Watch | Package diagnostics pending | Run cleanup phase |
| Testability | Watch | Pure utility tests pass; dashboard behavior lacks tests and React test tooling | Defer F-004 |

## Quality Gate

- Command: npm run lint
- Result: Pass
- Notes: Report-only checkpoint; no source code changed.

## Commit-Push Checkpoint

- Status inspected: dev matched origin/dev with findings report edits
- Diff checked: git diff --check passed; report diff reviewed
- Files staged: Pending
- Dry-run push: Pending
- Push: Pending
- Post-push sync: Pending

## Stabilization

- Cycle: Not started
- Completion criteria status: F-001 open; no P0/P1 findings found
- Remaining blockers: None

## Risks

Known risks or uncertainties: Runtime Firebase behavior is inferred from code/rules rather than exercised against live seeded data; dashboard fix can be statically verified but not fully integration-tested in this repo.

## Open Questions

- None.

## Recommended Next Step

Commit/push this backlog, then fix F-001 in `src/app/(dashboard)/page.tsx`.
