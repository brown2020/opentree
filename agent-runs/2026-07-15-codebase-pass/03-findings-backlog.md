# Agent Report

## Agent

Name: Codex

## Scope

Evidence-backed findings for dependency drift, security advisories, upgrade migrations, warnings, confirmed bugs, dead code, and architecture risks.

## Inputs

Baseline output, npm registry metadata, official ESLint/Vitest/TypeScript migration guidance, package usage searches, React Doctor 0.7.8 diagnostics, relevant source/config/rules files, and the June 2026 improvement reports.

## Branch and Push

- Branch: `dev`
- Upstream: `origin/dev`
- Commit: `4f7e369` (`chore: add dependency findings backlog`)
- Pushed to: `origin/dev`
- Sync status: clean and synchronized after push

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, and Lean Code Loop (read-only)
- Goal: distinguish executable update/bug tasks from false positives and broad deferred cleanup
- Verify gate: every finding has severity, evidence, ownership, and a local verification method
- Stop condition: the ordered package and warning-fix batches are clear
- Attempt: 1/2
- Result: pass

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: `9202a36`
- Next action: fix the confirmed Zod deprecations before package updates
- Blockers: none

## Commands Run

```text
npm view <major-package>@latest version engines peerDependencies dependencies --json
rg package imports/usages across src
rg TODO/FIXME/HACK/eslint-disable/console diagnostics across src
npx react-doctor@latest . --yes --verbose --no-telemetry --blocking none --max-duration 60
targeted source/config/rules inspection with sed
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P1 | Package update | Done | Supply chain | Eight audit advisories included critical `websocket-driver`; dependency refresh and PostCSS override removed all advisories | baseline and final `npm audit` | High | Medium | `npm audit` plus canonical gates | Completed in T-005 |
| F-002 | P2 | Package update | Done with deferrals | Direct dependencies | 18 direct packages were outdated; all moved to current compatible releases, with unsupported ESLint 10 and TypeScript 7 majors retained on latest compatible lines | `npm outdated`; install/gate evidence | Medium | Medium | `npm outdated`, lint, tests, build | Completed in T-005 |
| F-003 | P2 | Package update | Deferred | TypeScript tooling | TypeScript 7 makes the current TypeScript-ESLint peer tree invalid; ESLint 10 crashes the latest React lint plugin used by Next | `npm ls` and lint reproductions plus official migration constraints | High compatibility risk | Medium/large | peer-clean install, lint, Next build | Wait for upstream plugin/Next support |
| F-004 | P2 | Bug/maintainability | Done | Zod validation | Three deprecated `z.string().email()` calls were upgrade-fragile | changed-line Doctor and canonical gates | Medium | Small | lint, tests, build, changed-scope doctor | Completed in T-004 |
| F-005 | P3 | Dead code | Done | Firebase config | Default Firebase app export had no importers | repository-wide import search and build | Low | Small | search, lint, build | Removed in T-005 |
| F-006 | P2 | Accessibility/bug | Deferred | UI buttons/labels | React Doctor reports broad missing button types and labels; many require per-form/UI validation and span 20+ files | 42 button-type and 39 accessibility diagnostics | Medium | Migration-scale | focused UI tests/manual accessibility review | Separate focused run per React Doctor guidance and AGENTS single-change rule |
| F-007 | P3 | Performance/architecture | Deferred | Large UI/loops | Doctor reports large components and repeated array lookups/awaits; prior run already classed these as P3, and safe fixes require independent behavioral/performance proof | 22 performance and 19 maintainability warnings | Low/medium | Large | benchmarks/targeted tests | Separate optimization run |
| F-008 | P2 | Security review | Needs human/external review | Firebase/routing | Cookie/BaaS findings conflict with documented client-only marker design; profile-photo read and Storage rule changes require product/privacy decisions and Firebase rule verification | `AGENTS.md`, `session.ts`, `storage.rules`, Doctor heuristics | Potentially high but not confirmed | Medium | Firebase rules tests/manual console validation | Do not change in package run |
| F-009 | P3 | False positive | Closed | D3 lifecycle/member lookup | Doctor claims missing zoom cleanup and client authority write, but `FamilyTree` removes `.zoom` listeners and `members.ts:58` only queries users | source inspection | None | None | code evidence | No action |

Official migration evidence:

- ESLint 10 supports this run's Node 22.22.3 and the repo already uses flat config; new rules may expose additional findings.
- Vitest 4 requires Node 20+ and Vite 6+; the current environment meets Node requirements and the repo uses no removed coverage/pool options.
- TypeScript 7 is intended to be source/CLI compatible with TypeScript 6, but has no public API in 7.0; the current lint stack explicitly peers on `<6.1.0`.
- `react-dropzone` 17 supports React 18+ and the repo uses only the stable `useDropzone` hook surface.

## Changes Made

No source or package files changed. The task queue now separates the confirmed Zod warning fix, dependency batches, and deferred migration-scale diagnostics.

## Verification

Package constraints were checked through the npm registry. Each dependency is imported by current code or is a required build/type/test tool; no package removal is justified yet. Targeted inspection closed the two React Doctor error false positives without suppression.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Pass | Updates stay within existing client/build boundaries | Preserve |
| Module cohesion | Watch | Eight giant-component diagnostics, already pre-existing | Defer migration-scale split |
| Public surface area | Watch | One unused Firebase default export | F-005 |
| Data and side-effect flow | Pass | No confirmed flow defect in targeted inspection | Preserve |
| Async/cache/resource lifecycle | Pass | D3 effect owns and removes its zoom listeners | Close false positive |
| Duplication and dead code | Watch | Only F-005 has high-confidence deletion proof | Evaluate in cleanup |
| Dependency lean-ness | Fail | F-001/F-002 audit and version drift | T-005 |
| Testability | Watch | Pure suite is green; UI/Firebase integration coverage remains limited | Use strict compile plus scoped inspection |

## Quality Gate

- Command: `npm run lint`
- Result: pass
- Notes: baseline lint/test/build are green

## Commit-Push Checkpoint

- Status inspected: clean/synced before report edits
- Diff checked: pending
- Files staged: pending
- Dry-run push: pending
- Push: pending
- Post-push sync: pending

## Stabilization

- Cycle: not started
- Completion criteria status: actionable P1/P2 dependency tasks queued
- Remaining blockers: none for F-001/F-002/F-004/F-005; F-008 needs a separate security/rules decision

## Risks

The five major updates can expose toolchain/API changes despite clean peer/engine metadata. TypeScript 7 has a known peer/API incompatibility with the current lint stack and must not be forced into an unsupported tree merely to make `npm outdated` empty.

## Open Questions

- None; incompatible packages will be retained only with exact command evidence.

## Recommended Next Step

Fix F-004, then update patch/minor releases followed by compatible majors, validating each batch.
