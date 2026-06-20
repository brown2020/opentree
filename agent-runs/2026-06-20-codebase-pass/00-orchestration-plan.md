# Orchestration Plan

## Mode Selection

- Repo: /Users/stephenbrown/Code/OPENSOURCE/opentree
- Branch: dev
- Work mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/opentree/agent-runs/2026-06-20-codebase-pass
- Verifiable gates: git remote read, git fetch/pull --ff-only, git push --dry-run origin dev, npm run lint, npm test, npm run build, git diff --check
- Human-decision blockers: product roadmap direction, Firebase console verification, credentials/secrets, broad architecture decisions, unrelated local changes
- Resume policy: resume from run-state.md plus Git state; push any validated local codebase-improvement commit before new edits

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and lint passes | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop | lint, tests, and build are run or failures classified | Baseline report pushed |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop | Targeted check plus lint pass | Focused fix pushed |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Safe diagnostics recorded; any cleanup verified | Cleanup pushed or deferred |
| Review | Judge Loop | PASS or bounded follow-up tasks | Review report pushed |
| Stabilization Loop | Stabilization Loop, Judge Loop | completion criteria pass or blocker recorded | Stabilization report pushed |
| Integrator | Final Completion Gate | final Git sync and quality gates recorded | Final report pushed |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | agent-runs/2026-06-20-codebase-pass/00-orchestration-plan.md, agent-runs/2026-06-20-codebase-pass/run-state.md, agent-runs/2026-06-20-codebase-pass/task-queue.md, agent-runs/2026-06-20-codebase-pass/01-preflight-and-repo-docs.md, AGENTS.md, spec.md | Startup planning, docs sweep, and resume state |
| T-002 | agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md, agent-runs/2026-06-20-codebase-pass/run-state.md, agent-runs/2026-06-20-codebase-pass/task-queue.md | Baseline validation |
| T-003 | agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md, agent-runs/2026-06-20-codebase-pass/task-queue.md | Findings backlog and scorecard |
| T-004 | Source files named by the selected backlog item, targeted tests, agent-runs/2026-06-20-codebase-pass/04-execute-fixes-and-improvements.md | One focused, verifiable fix |
| T-005 | package.json, package-lock.json, dead-code candidates, agent-runs/2026-06-20-codebase-pass/05-package-and-dead-code-cleanup.md | Safe package/dead-code cleanup only with evidence |
| T-006 | agent-runs/2026-06-20-codebase-pass/06-review.md, task-queue.md | Judge loop report |
| T-007 | Files required by review/stabilization findings, agent-runs/2026-06-20-codebase-pass/07-stabilization-loop.md | Stabilization cycles |
| T-008 | agent-runs/2026-06-20-codebase-pass/08-integrator.md, agent-runs/2026-06-20-codebase-pass/final-report.md, run-state.md | Final gate and report |
