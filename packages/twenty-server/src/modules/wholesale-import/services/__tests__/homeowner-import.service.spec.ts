import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { HomeownerImportService } from 'src/modules/wholesale-import/services/homeowner-import.service';

const AUTH_CONTEXT = {
  type: 'user',
  workspace: { id: 'workspace-id' },
  userWorkspaceId: 'user-workspace-id',
} as WorkspaceAuthContext;

const createPermissionMocks = () => ({
  permissionsService: {
    getUserWorkspacePermissions: jest.fn().mockResolvedValue({
      objectsPermissions: Object.fromEntries(
        Array.from({ length: 8 }, (_, index) => [
          `object-${index}`,
          { canReadObjectRecords: true, canUpdateObjectRecords: true },
        ]),
      ),
    }),
  } as unknown as PermissionsService,
  workspaceCacheService: {
    getOrRecompute: jest.fn().mockResolvedValue({
      flatObjectMetadataMaps: {
        byUniversalIdentifier: Object.fromEntries(
          [
            'person',
            'property',
            'personProperty',
            'opportunity',
            'messageList',
            'messageListMember',
            'importBatch',
            'importRowResult',
          ].map((name, index) => [
            name,
            { id: `object-${index}`, nameSingular: name },
          ]),
        ),
      },
    }),
  } as unknown as WorkspaceCacheService,
});

const createService = (people: unknown[]) => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(people),
  };
  const propertyRepository = { find: jest.fn().mockResolvedValue([]) };
  const workspaceOrmManager = {
    executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
      callback(),
    ),
    getRepositoryWithContextPermissions: jest.fn((objectName: string) =>
      objectName === 'person'
        ? { createQueryBuilder: () => queryBuilder }
        : propertyRepository,
    ),
  } as unknown as WorkspaceOrmManager;

  const { permissionsService, workspaceCacheService } = createPermissionMocks();

  return new HomeownerImportService(
    workspaceOrmManager,
    {} as ActorFromAuthContextService,
    permissionsService,
    workspaceCacheService,
  );
};

const row = {
  rowNumber: 2,
  phone: '(212) 555-1234',
  propertyAddress: '10 Main St',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
};

const matchingPerson = {
  id: 'person-id',
  phones: {
    primaryPhoneNumber: '2125551234',
    primaryPhoneCallingCode: '+1',
    primaryPhoneCountryCode: 'US',
    additionalPhones: null,
  },
};

describe('HomeownerImportService preview', () => {
  it('commits ordered chunks once and completes one batch', async () => {
    let batch: Record<string, unknown> | null = null;
    const rowInsert = jest.fn().mockResolvedValue({
      identifiers: [{ id: 'row-id' }],
    });
    const repositories = {
      importBatch: {
        findOne: jest.fn(async () => batch),
        insert: jest.fn(async (record: Record<string, unknown>) => {
          batch = { ...record, id: 'batch-id' };
          return { identifiers: [{ id: 'batch-id' }] };
        }),
        update: jest.fn(async (_id: string, patch: Record<string, unknown>) => {
          Object.assign(batch as object, patch);
        }),
      },
      messageList: {
        find: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockResolvedValue({
          identifiers: [{ id: 'group-id' }],
        }),
      },
      importRowResult: { insert: rowInsert },
    };
    const scope = {
      workspaceId: 'workspace-id',
      executeRawQuery: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        (callback: (scope: unknown) => Promise<unknown>) => callback(scope),
      ),
      getRepositoryWithContextPermissions: jest.fn(
        (name: keyof typeof repositories) => repositories[name],
      ),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {
        injectActorFieldsOnCreate: jest.fn(
          async ({ records }: { records: Record<string, unknown>[] }) =>
            records,
        ),
      } as unknown as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );
    const baseInput = {
      groupName: 'Large upload',
      originalFilename: 'owners.csv',
      idempotencyKey: 'large-upload-key',
      overrideDuplicates: false,
      createOpportunities: false,
      mappedColumnCount: 2,
      totalRows: 2,
    };
    const firstChunk = {
      ...baseInput,
      offset: 0,
      rows: [{ ...row, propertyAddress: '' }],
    };

    await service.commit(firstChunk, AUTH_CONTEXT);
    await service.commit(firstChunk, AUTH_CONTEXT);
    const result = await service.commit(
      { ...baseInput, offset: 1, rows: [{ ...row, rowNumber: 3, phone: '' }] },
      AUTH_CONTEXT,
    );

    expect(repositories.importBatch.insert).toHaveBeenCalledTimes(1);
    expect(rowInsert).toHaveBeenCalledTimes(2);
    expect(batch).toMatchObject({ status: 'COMPLETED', totalRows: 2 });
    expect(result.counts.error).toBe(2);
  });

  it('requires a valid phone and property address', async () => {
    const service = createService([]);

    const result = await service.preview(
      {
        groupName: 'October owners',
        overrideDuplicates: false,
        rows: [{ ...row, propertyAddress: '' }],
      },
      AUTH_CONTEXT,
    );

    expect(result.counts.error).toBe(1);
    expect(result.rows[0].outcome).toBe('ERROR');
  });

  it('skips an unambiguous phone match unless override is enabled', async () => {
    const service = createService([matchingPerson]);
    const baseInput = {
      groupName: 'October owners',
      rows: [row],
    };

    const skipped = await service.preview(
      { ...baseInput, overrideDuplicates: false },
      AUTH_CONTEXT,
    );
    const updated = await service.preview(
      { ...baseInput, overrideDuplicates: true },
      AUTH_CONTEXT,
    );

    expect(skipped.rows[0]).toMatchObject({
      outcome: 'SKIP',
      personId: 'person-id',
    });
    expect(updated.rows[0]).toMatchObject({
      outcome: 'UPDATE',
      personId: 'person-id',
    });
  });

  it('sends a shared phone match to review without choosing a Person', async () => {
    const service = createService([
      matchingPerson,
      { ...matchingPerson, id: 'second-person-id' },
    ]);

    const result = await service.preview(
      { groupName: 'October owners', overrideDuplicates: true, rows: [row] },
      AUTH_CONTEXT,
    );

    expect(result.rows[0]).toMatchObject({
      outcome: 'REVIEW',
      personId: null,
    });
  });

  it('adds a skipped existing Person to the named group without changing the Property or Opportunity', async () => {
    const insertMember = jest.fn().mockResolvedValue({
      identifiers: [{ id: 'membership-id' }],
    });
    const personQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([matchingPerson]),
    };
    const repositories = {
      person: { createQueryBuilder: () => personQueryBuilder },
      importBatch: {
        findOne: jest.fn().mockResolvedValue(null),
        find: jest.fn().mockResolvedValue([]),
        insert: jest
          .fn()
          .mockResolvedValue({ identifiers: [{ id: 'batch-id' }] }),
        update: jest.fn(),
      },
      messageList: {
        find: jest.fn().mockResolvedValue([]),
        insert: jest
          .fn()
          .mockResolvedValue({ identifiers: [{ id: 'group-id' }] }),
      },
      messageListMember: {
        findOne: jest.fn().mockResolvedValue(null),
        insert: insertMember,
      },
      importRowResult: {
        insert: jest
          .fn()
          .mockResolvedValue({ identifiers: [{ id: 'row-id' }] }),
      },
      property: {
        find: jest.fn().mockResolvedValue([]),
        insert: jest.fn(),
      },
      opportunity: { findOne: jest.fn(), insert: jest.fn() },
      personProperty: { findOne: jest.fn(), insert: jest.fn() },
    };
    const scope = {
      workspaceId: 'workspace-id',
      executeRawQuery: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        (callback: (scope: unknown) => Promise<unknown>) => callback(scope),
      ),
      getRepositoryWithContextPermissions: jest.fn(
        (name: keyof typeof repositories) => {
          if (name === 'opportunity') {
            throw new Error('Opportunity access is unavailable');
          }

          return repositories[name];
        },
      ),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {
        injectActorFieldsOnCreate: jest.fn(
          async ({ records }: { records: Record<string, unknown>[] }) =>
            records,
        ),
      } as unknown as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );

    const result = await service.commit(
      {
        groupName: 'October owners',
        originalFilename: 'owners.csv',
        idempotencyKey: 'file-key',
        overrideDuplicates: false,
        createOpportunities: false,
        mappedColumnCount: 3,
        rows: [row],
      },
      AUTH_CONTEXT,
    );

    expect(result.counts.skip).toBe(1);
    expect(insertMember).toHaveBeenCalledWith(
      expect.objectContaining({ listId: 'group-id', personId: 'person-id' }),
    );
    expect(repositories.property.insert).not.toHaveBeenCalled();
    expect(repositories.opportunity.insert).not.toHaveBeenCalled();
  });

  it('uses one phone lookup for all rows in a preview', async () => {
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      getRepositoryWithContextPermissions: jest.fn((name: string) =>
        name === 'person'
          ? { createQueryBuilder: () => queryBuilder }
          : { find: jest.fn().mockResolvedValue([]) },
      ),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {} as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );

    await service.preview(
      {
        groupName: 'October owners',
        overrideDuplicates: false,
        rows: [row, { ...row, rowNumber: 3, phone: '(646) 555-1234' }],
      },
      AUTH_CONTEXT,
    );

    expect(queryBuilder.getMany).toHaveBeenCalledTimes(1);
  });

  it('allows preview with read permission and no update permission', async () => {
    const service = createService([]);
    const permissionsService = service[
      'permissionsService'
    ] as PermissionsService;

    jest
      .spyOn(permissionsService, 'getUserWorkspacePermissions')
      .mockResolvedValue({
        objectsPermissions: Object.fromEntries(
          Array.from({ length: 8 }, (_, index) => [
            `object-${index}`,
            { canReadObjectRecords: true, canUpdateObjectRecords: false },
          ]),
        ),
      } as Awaited<
        ReturnType<PermissionsService['getUserWorkspacePermissions']>
      >);

    const result = await service.preview(
      { groupName: 'October owners', overrideDuplicates: false, rows: [row] },
      AUTH_CONTEXT,
    );

    expect(result.counts.create).toBe(1);
  });

  it('rejects an idempotency key reused with different payload', async () => {
    const scope = {
      workspaceId: 'workspace-id',
      executeRawQuery: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        (callback: (scope: unknown) => Promise<unknown>) => callback(scope),
      ),
      getRepositoryWithContextPermissions: jest.fn(() => ({
        findOne: jest.fn().mockResolvedValue({
          id: 'old-batch',
          payloadDigest: 'different-digest',
        }),
      })),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {} as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );

    await expect(
      service.commit(
        {
          groupName: 'October owners',
          originalFilename: 'owners.csv',
          idempotencyKey: 'reused-key',
          overrideDuplicates: false,
          createOpportunities: false,
          mappedColumnCount: 3,
          rows: [row],
        },
        AUTH_CONTEXT,
      ),
    ).rejects.toThrow('different import payload');
  });

  it('denies an override when the Person update is rejected by scoped permissions', async () => {
    const personUpdate = jest
      .fn()
      .mockRejectedValue(new Error('Person update denied'));
    const queryBuilder = {
      where: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([matchingPerson]),
    };
    const repositories = {
      person: { createQueryBuilder: () => queryBuilder, update: personUpdate },
      property: { find: jest.fn().mockResolvedValue([]) },
      importBatch: {
        findOne: jest.fn().mockResolvedValue(null),
        insert: jest
          .fn()
          .mockResolvedValue({ identifiers: [{ id: 'batch-id' }] }),
      },
      messageList: {
        find: jest.fn().mockResolvedValue([]),
        insert: jest
          .fn()
          .mockResolvedValue({ identifiers: [{ id: 'group-id' }] }),
      },
    };
    const scope = {
      workspaceId: 'workspace-id',
      executeRawQuery: jest.fn().mockResolvedValue([]),
    };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      runInWorkspaceTransaction: jest.fn(
        (callback: (scope: unknown) => Promise<unknown>) => callback(scope),
      ),
      getRepositoryWithContextPermissions: jest.fn(
        (name: keyof typeof repositories) => repositories[name],
      ),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {
        injectActorFieldsOnCreate: jest.fn(
          async ({ records }: { records: unknown[] }) => records,
        ),
        injectUpdatedBy: jest.fn(
          async ({ records }: { records: unknown[] }) => records,
        ),
      } as unknown as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );

    await expect(
      service.commit(
        {
          groupName: 'October owners',
          originalFilename: 'owners.csv',
          idempotencyKey: 'override-key',
          overrideDuplicates: true,
          createOpportunities: false,
          mappedColumnCount: 3,
          rows: [row],
        },
        AUTH_CONTEXT,
      ),
    ).rejects.toThrow('Person update denied');
    expect(personUpdate).toHaveBeenCalledTimes(1);
  });

  it('summarizes saved import rows by distinct phone and skipped duplicates', async () => {
    const createdAt = new Date('2026-10-22T12:00:00Z');
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) =>
        callback(),
      ),
      getRepositoryWithContextPermissions: jest.fn((name: string) =>
        name === 'importBatch'
          ? {
              find: jest.fn().mockResolvedValue([
                {
                  id: 'batch-id',
                  name: 'October owners',
                  messageListId: 'group-id',
                  originalFilename: 'owners.csv',
                  status: 'COMPLETED',
                  totalRows: 4,
                  mappedColumnCount: 3,
                  errorRows: 1,
                  skippedRows: 1,
                  createdAt,
                },
              ]),
            }
          : {
              createQueryBuilder: () => ({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                groupBy: jest.fn().mockReturnThis(),
                getRawMany: jest
                  .fn()
                  .mockResolvedValue([
                    { batchId: 'batch-id', uniqueNumbers: '2' },
                  ]),
              }),
            },
      ),
    };
    const { permissionsService, workspaceCacheService } =
      createPermissionMocks();
    const service = new HomeownerImportService(
      manager as unknown as WorkspaceOrmManager,
      {} as ActorFromAuthContextService,
      permissionsService,
      workspaceCacheService,
    );

    await expect(service.history(AUTH_CONTEXT)).resolves.toEqual([
      {
        id: 'batch-id',
        groupId: 'group-id',
        groupName: 'October owners',
        originalFilename: 'owners.csv',
        status: 'COMPLETED',
        totalRows: 4,
        uniqueNumbers: 2,
        mappedColumnCount: 3,
        errorRows: 1,
        duplicateRows: 1,
        createdAt,
      },
    ]);
  });
});
