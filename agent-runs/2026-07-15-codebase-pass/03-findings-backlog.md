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
- Commit: `9202a36` before findings edits
- Pushed to: pending findings checkpoint
- Sync status: clean and synchronized before report edits

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
- Next action: checkpoint findings, then fix the confirmed Zod deprecations before package updates
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
| F-001 | P1 | Package update | Open | Supply chain | Eight audit advisories include critical `websocket-driver`; fixes are available through dependency refresh | `npm audit` | High | Medium | post-update `npm audit` plus canonical gates | T-005 |
| F-002 | P2 | Package update | Open | Direct dependencies | 18 direct packages are outdated; five cross majors | `npm outdated`; `npm view` | Medium | Medium | `npm outdated`, lint, tests, build | T-005 in minor then major batches |
| F-003 | P2 | Package update | Deferred candidate | TypeScript tooling | TypeScript 7 is current but latest `typescript-eslint@8.64.0` declares `typescript <6.1.0`; TypeScript 7 also removes its public API | registry peer metadata and official TS 7 release notes | High compatibility risk | Medium/large | peer-clean install, lint, Next build | Attempt only if toolchain can remain supported; otherwise keep TS 6.0.3 with exact evidence |
| F-004 | P2 | Bug/maintainability | Open | Zod validation | Three deprecated `z.string().email()` calls are upgrade-fragile | React Doctor locations and Zod 4 API | Medium | Small | lint, tests, build, changed-scope doctor | T-004 |
| F-005 | P3 | Dead code | Open | Firebase config | Default Firebase app export has no importers | repository-wide import search | Low | Small | search, lint, build | Evaluate in cleanup |
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
