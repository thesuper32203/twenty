# Development guide for Codex sessions

Use this with [CLAUDE.md](../CLAUDE.md), which owns the detailed house rules, commands and gotchas. [SKILLS.md](../SKILLS.md) distinguishes skills for app builders, workspace users and repository contributors. Existing specialized references include [upgrade commands](../packages/twenty-server/docs/UPGRADE_COMMANDS.md), [workflow execution](../packages/twenty-server/docs/WORKFLOW_CORE_EXECUTION.md), the [frontend contributor guide](../packages/twenty-docs/developers/contribute/capabilities/frontend-development/folder-architecture-front.mdx), and the [backend contributor guide](../packages/twenty-docs/developers/contribute/capabilities/backend-development/folder-architecture-server.mdx). Preserve existing decision records wherever a subsystem has them.

## Start a change

1. Pick the subsystem from [FEATURE_MAP.md](FEATURE_MAP.md), then read its specialized map: [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE_MAP.md](DATABASE_MAP.md), or [AGENT_SYSTEM.md](AGENT_SYSTEM.md).
2. Open the cited source, neighboring implementation and tests. Confirm routes, decorators, feature flags and dependency injection in current code; maps can lag a commit.
3. Reuse existing module services, guards, `twenty-shared/utils`, UI controls and queue infrastructure. Follow adjacent naming/patterns and `CLAUDE.md`; add a dependency only when existing packages cannot meet the need.
4. Update the relevant map and any authoritative subsystem document when implementation changes. Keep maps short and path-oriented; do not copy source.

## Common change paths

| Change | Where to start |
| --- | --- |
| Frontend feature | Locate page/route under [`twenty-front/src/pages`](../packages/twenty-front/src/pages/) and feature logic under [`twenty-front/src/modules`](../packages/twenty-front/src/modules/). Check [`WorkspaceAppProviders`](../packages/twenty-front/src/modules/app/components/WorkspaceAppProviders.tsx) and [`ApolloFactory`](../packages/twenty-front/src/modules/apollo/services/ApolloFactory.ts) only if provider or transport behavior changes. Use Lingui and `twenty-ui` conventions from `CLAUDE.md`. |
| CRM object or field | Inspect the standard workspace entity in [`twenty-server/src/modules`](../packages/twenty-server/src/modules/), metadata registration under [`twenty-standard-application`](../packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/), generated workspace schema, related front record configuration, and [DATABASE_MAP.md](DATABASE_MAP.md). Do not treat a TypeScript entity alone as an applied SQL migration. |
| Core database entity | Edit the TypeORM entity, generate a fast/slow instance command with `npx nx run twenty-server:database:migrate:generate --name <name> --type <fast|slow>`, and follow [UPGRADE_COMMANDS.md](../packages/twenty-server/docs/UPGRADE_COMMANDS.md). Never add to historical TypeORM migrations. |
| API endpoint | Choose existing metadata-generated GraphQL/REST for ordinary records. For special behavior, inspect neighboring Nest [`resolvers`](../packages/twenty-server/src/engine/metadata-modules/) or [`controllers`](../packages/twenty-server/src/engine/api/rest/), their auth guards/context, DTOs, service and error filters. Regenerate frontend GraphQL types when the schema changes with `npx nx run twenty-front:graphql:generate` (metadata configuration if relevant). |
| Background or agent action | Check [`MessageQueueService`](../packages/twenty-server/src/engine/core-modules/message-queue/services/message-queue.service.ts), queue worker config and feature jobs for retry/idempotency. For AI tools, also inspect [AGENT_SYSTEM.md](AGENT_SYSTEM.md), grants and workspace context. |

## Verify affected behavior

Prefer one focused test first: `npx jest path/to/file.spec.ts --config=packages/<pkg>/jest.config.mjs`; `twenty-ui` uses `npx vitest run --root packages/twenty-ui --project unit <file>`. Use `npx nx test <pkg>` or integration/E2E targets when the changed boundary warrants it. For schema/auth/queue changes, test the relevant cross-workspace, migration, restart or permission behavior, not only helpers. Run affected package typecheck and diff lint as described in `CLAUDE.md`. Build `twenty-shared` after changing it or switching branches before trusting dependent results; Nx cache may hide a stale pass. Documentation-only edits need path/link checks, not application test suites.
