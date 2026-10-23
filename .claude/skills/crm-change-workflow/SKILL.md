---
name: crm-change-workflow
description: Plan, implement, verify, and document changes to this CRM checkout. Use for future application feature, bug fix, schema, API, or worker changes; not for building a separate Twenty app or performing PR browser QA.
---

# CRM change workflow

Apply this process to changes in this repository. Follow [CLAUDE.md](../../../CLAUDE.md) for coding rules and commands, [the development guide](../../../docs/DEVELOPMENT_GUIDE.md) for subsystem paths, and any narrower `AGENTS.md` or specialized skill for the affected area. Documentation-only changes use the relevant discovery, review, and link checks without application test suites.

## 1. Discover

- Read the relevant architecture, feature, database, or agent map and authoritative subsystem documentation. Treat maps as pointers; inspect current source and neighboring tests.
- Find related implementations and decide whether existing components, services, guards, utilities, schemas, or queue jobs can be extended.
- Trace the affected frontend, API/backend, persistence/migration, and worker/background paths. Record which layers are unaffected and why. Check authorization, workspace boundaries, error handling, retries, and feature flags where relevant.

## 2. Plan

Before editing application code, explain the proposed implementation, why it fits the existing architecture, and the expected files to change. State any database migration and API/schema changes, compatibility or breaking changes, security and performance considerations, and verification plan. Mark unknowns that require source inspection or tests.

If the plan makes a significant architectural change—such as replacing a shared service, changing a public interface, altering data ownership or migration strategy, or adding a major dependency—wait for the user's approval before implementing that change. Routine changes within existing patterns may proceed after the plan is communicated. Revisit the plan if discovery changes its scope.

## 3. Implement

- Follow adjacent code and `CLAUDE.md`; reuse established services and components and avoid dependencies unless justified.
- Keep edits within the requested feature and preserve existing interfaces unless a change was approved. Maintain auth, permission, workspace isolation, validation, and safe background-job behavior.
- Never modify production data or run destructive operations without explicit approval. Migration generation or review is distinct from applying a migration to a production database.

## 4. Verify

- Add meaningful tests for new behavior and run focused existing tests, then broader integration or end-to-end tests when the changed boundary warrants them. Cover permission, tenant isolation, migration, and retry behavior when applicable.
- Run the affected packages' repository-supported TypeScript and lint commands, accounting for the `twenty-shared` build and Nx cache notes in `CLAUDE.md`. Verify generated API types and migration `up`/`down` behavior when applicable, using disposable/local environments only unless separately authorized.
- Check nearby flows for regressions. Record each command and result, including tests that could not run and why. Do not claim a cached or skipped check as a fresh pass.

## 5. Document

Update [FEATURE_MAP.md](../../../docs/FEATURE_MAP.md) for changed feature entry points. Update architecture and database maps or subsystem docs when their descriptions change. Document new data models and API contracts at the existing documentation location. Record significant architectural decisions using any existing convention in that subsystem; if none exists, explain the decision and tradeoffs in its architecture documentation.

## 6. Complete

Report a summary, files modified, verification commands and results, potential risks, remaining issues, and recommended next steps. Distinguish unverified assumptions from observed behavior.
