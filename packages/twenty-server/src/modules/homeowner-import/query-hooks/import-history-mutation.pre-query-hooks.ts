import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  WorkspaceQueryHook,
  type WorkspaceQueryHookKey,
} from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';

const MUTATION_METHODS = [
  'createOne',
  'createMany',
  'updateOne',
  'updateMany',
  'deleteOne',
  'deleteMany',
  'restoreOne',
  'restoreMany',
  'destroyOne',
  'destroyMany',
  'mergeMany',
] as const;

const guardHistoryMutation = (key: WorkspaceQueryHookKey) => {
  @WorkspaceQueryHook(key)
  class ImportHistoryMutationPreQueryHook implements WorkspacePreQueryHookInstance {
    async execute(): Promise<never> {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
      );
    }
  }

  return ImportHistoryMutationPreQueryHook;
};

export const IMPORT_HISTORY_MUTATION_HOOKS = [
  ...MUTATION_METHODS.map((method) => guardHistoryMutation(`importBatch.${method}`)),
  ...MUTATION_METHODS.map((method) => guardHistoryMutation(`importRowResult.${method}`)),
];
