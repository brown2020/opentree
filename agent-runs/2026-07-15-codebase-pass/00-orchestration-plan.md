# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/opentree`
- Branch: `dev`
- Work mode: full, focused on dependency maintenance and regressions exposed by the upgrade
- Run folder: `agent-runs/2026-07-15-codebase-pass`
- Verifiable gates: `npm run lint`, `npm test`, `npm run build`, `npm outdated`, `npm audit`, Git diff/status/sync checks
- Human-decision blockers: package migrations that require product behavior changes, Firebase credentials, or unavailable external services
- Resume policy: resume from `run-state.md`; validate and push any in-scope local commit before new edits

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | Lint, tests, build, outdated, and audit results classified | Baseline report pushed |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed dependency/bug backlog and scorecard | Backlog, scorecard, and queue pushed |
| Execute | Task Queue Loop, Fix Validation Loop | Confirmed bugs or upgrade blockers have targeted proof | Fix batch pushed or no executable bug remains |
| Package Cleanup | Package Cleanup Loop, Dead Code Loop | Direct dependencies are current; lint/tests/build pass | Package batch pushed or exact deferrals recorded |
| Review | Judge Loop | PASS or every failure becomes a bounded task | Review report pushed |
| Stabilize | Stabilization Loop | Canonical gates pass and no P0/P1 findings remain | Stabilization checkpoint pushed |
| Integrate | Commit-Push Checkpoint Loop | Clean worktree matches `origin/dev` | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `spec.md`, run planning/report files | Startup planning and current-state documentation |
| T-002 | Baseline report files only | Read-only validation and classification |
| T-003 | Findings report and queue | Package/bug/architecture evidence |
| T-004 | Confirmed source/test files | Only if baseline or upgrade exposes a reproducible defect |
| T-005 | `package.json`, `package-lock.json` | Bring direct dependencies to current stable releases |
| T-006 | Review/stabilization/integrator reports and any owned fix files | Final judge and quality gates |
