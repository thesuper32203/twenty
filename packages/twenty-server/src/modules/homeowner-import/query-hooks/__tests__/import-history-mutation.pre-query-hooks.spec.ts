import { PermissionsExceptionCode } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { WORKSPACE_QUERY_HOOK_METADATA } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/workspace-query-hook.constants';
import { IMPORT_HISTORY_MUTATION_HOOKS } from 'src/modules/homeowner-import/query-hooks/import-history-mutation.pre-query-hooks';

describe('import history mutation query hooks', () => {
  it('registers guards for every generic mutation on both history objects', () => {
    const keys = IMPORT_HISTORY_MUTATION_HOOKS.map((Hook) =>
      Reflect.getMetadata(WORKSPACE_QUERY_HOOK_METADATA, Hook)?.key,
    );

    expect(keys).toHaveLength(22);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual(
      expect.arrayContaining([
        'importBatch.createOne',
        'importBatch.updateMany',
        'importBatch.destroyOne',
        'importRowResult.createMany',
        'importRowResult.deleteMany',
        'importRowResult.mergeMany',
      ]),
    );
  });

  it('rejects generic mutations without affecting repository writes', async () => {
    for (const Hook of IMPORT_HISTORY_MUTATION_HOOKS) {
      await expect(new Hook().execute()).rejects.toMatchObject({
        code: PermissionsExceptionCode.PERMISSION_DENIED,
      });
    }
  });
});
