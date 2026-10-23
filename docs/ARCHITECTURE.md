# Architecture map

Navigation map for this checkout, not a deployment guarantee. Start with [CLAUDE.md](../CLAUDE.md) for conventions and [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md) for the deeper source audit and its verification limits. The public contributor guides live under [`packages/twenty-docs/developers/contribute/capabilities`](../packages/twenty-docs/developers/contribute/capabilities/).

## Runtime layout

| Layer | Entry points and responsibility |
| --- | --- |
| Web client | [`packages/twenty-front/src/modules/app/components/App.tsx`](../packages/twenty-front/src/modules/app/components/App.tsx) mounts providers; [`WorkspaceAppProviders.tsx`](../packages/twenty-front/src/modules/app/components/WorkspaceAppProviders.tsx) composes authenticated workspace services. [`useCreateWorkspaceAppRouter.tsx`](../packages/twenty-front/src/modules/app/hooks/useCreateWorkspaceAppRouter.tsx) and [`createWorkspaceRouteObjects.tsx`](../packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx) are route navigation points. Reusable UI is in [`packages/twenty-ui`](../packages/twenty-ui/). |
| API server | [`packages/twenty-server/src/main.ts`](../packages/twenty-server/src/main.ts) bootstraps Nest; [`app.module.ts`](../packages/twenty-server/src/app.module.ts) composes API, ORM, core and business modules. Business features are under [`src/modules`](../packages/twenty-server/src/modules/) and platform services under [`src/engine`](../packages/twenty-server/src/engine/). |
| Worker | [`queue-worker.ts`](../packages/twenty-server/src/queue-worker/queue-worker.ts) starts a separate Nest context; [`queue-worker.module.ts`](../packages/twenty-server/src/queue-worker/queue-worker.module.ts) composes processors. [`MessageQueueService`](../packages/twenty-server/src/engine/core-modules/message-queue/services/message-queue.service.ts) exposes `add`, `bulkAdd`, `addCron`, and `work`. |
| Shared packages | [`twenty-shared`](../packages/twenty-shared/) supplies shared types/utilities, [`twenty-sdk`](../packages/twenty-sdk/) and [`twenty-cli`](../packages/twenty-cli/) support applications, and [`twenty-e2e-testing`](../packages/twenty-e2e-testing/) contains browser tests. |

## Request and event paths

1. Frontend local state uses Jotai; [`ApolloFactory`](../packages/twenty-front/src/modules/apollo/services/ApolloFactory.ts) builds remote-data clients. [`SSEProvider`](../packages/twenty-front/src/modules/sse-db-event/components/SSEProvider.tsx) handles live event updates.
2. The server serves core GraphQL via [`GraphQLConfigService`](../packages/twenty-server/src/engine/api/graphql/graphql-config/graphql-config.service.ts). [`WorkspaceGraphQLSchemaFactory`](../packages/twenty-server/src/engine/api/graphql/workspace-schema-builder/workspace-graphql-schema.factory.ts) derives workspace schema from metadata, and [`WorkspaceResolverBuilderService`](../packages/twenty-server/src/engine/api/graphql/workspace-resolver-builder/workspace-resolver-builder.service.ts) wires record operations. [`RestApiCoreController`](../packages/twenty-server/src/engine/api/rest/core/controllers/rest-api-core.controller.ts) and [`RestApiCoreService`](../packages/twenty-server/src/engine/api/rest/core/services/rest-api-core.service.ts) handle generic REST records. MCP is composed in `AppModule`; inspect its current module before changing it.
3. Authentication and workspace context are established by middleware/guards; [`WorkspaceRepository`](../packages/twenty-server/src/engine/twenty-orm/repository/workspace-repository.ts) applies record access patterns. See [DATABASE_MAP.md](DATABASE_MAP.md) before changing persistence or permissions.
4. Domain listeners, resolvers and services may enqueue jobs. [`MessageQueueExplorer`](../packages/twenty-server/src/engine/core-modules/message-queue/message-queue.explorer.ts) discovers decorated processors; [`BullMQDriver`](../packages/twenty-server/src/engine/core-modules/message-queue/drivers/bullmq.driver.ts) uses Redis. Workflow orchestration starts at [`WorkflowRunnerWorkspaceService`](../packages/twenty-server/src/modules/workflow/workflow-runner/workspace-services/workflow-runner.workspace-service.ts); see [`WORKFLOW_CORE_EXECUTION.md`](../packages/twenty-server/docs/WORKFLOW_CORE_EXECUTION.md).

## Persistence and integrations

PostgreSQL `core` stores TypeORM entities and metadata via [`core.datasource.ts`](../packages/twenty-server/src/database/typeorm/core/core.datasource.ts). Workspace CRM records use metadata-driven TwentyORM and [`WorkspaceDataSourceService`](../packages/twenty-server/src/engine/twenty-orm/datasource/workspace-data-source.service.ts). Redis backs queues, sessions, cache and locks; the queue is a separate worker process. Source also contains optional ClickHouse telemetry under [`database/clickhouse`](../packages/twenty-server/src/database/clickhouse/). Do not assume a given deployment enables it.

External integrations are feature-specific: Google/Microsoft connected accounts and messaging/calendar sync under [`modules/connected-account`](../packages/twenty-server/src/modules/connected-account/) and [`modules/messaging`](../packages/twenty-server/src/modules/messaging/)/[`calendar`](../packages/twenty-server/src/modules/calendar/); webhooks under [`engine/metadata-modules/webhook`](../packages/twenty-server/src/engine/metadata-modules/webhook/); applications and logic functions under [`engine/core-modules/application`](../packages/twenty-server/src/engine/core-modules/application/) and [`logic-function`](../packages/twenty-server/src/engine/core-modules/logic-function/); AI model providers under [`sdk-provider-factory.service.ts`](../packages/twenty-server/src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service.ts). Provider configuration and runtime health are deployment-dependent.

## Related maps

- [FEATURE_MAP.md](FEATURE_MAP.md): user-facing capabilities and their implementation paths.
- [DATABASE_MAP.md](DATABASE_MAP.md): entities, relationships, constraints and migrations.
- [AGENT_SYSTEM.md](AGENT_SYSTEM.md): AI agent state, tools and recovery.
