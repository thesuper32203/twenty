import { BadRequestException } from '@nestjs/common';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { type WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { PropertyAddressQueryHookService } from 'src/modules/property/query-hooks/property-address-query-hook.service';
import { normalizePropertyAddressKey } from 'src/modules/property/utils/normalize-property-address-key.util';

describe('Property address normalization', () => {
  const address = {
    addressStreet1: '  123  Main St ',
    addressCity: ' New York ',
    addressState: ' ny ',
    addressPostcode: ' 10001 ',
  };

  it('creates one canonical key for importer and manual writes', () => {
    expect(normalizePropertyAddressKey(address)).toBe(
      '123 MAIN ST|NEW YORK|NY|10001',
    );
    expect(normalizePropertyAddressKey({ addressStreet1: '  ' })).toBeNull();

    const service = new PropertyAddressQueryHookService({} as WorkspaceOrmManager);

    expect(service.stampCreate({ address, normalizedAddressKey: 'forged' })).toMatchObject({
      normalizedAddressKey: '123 MAIN ST|NEW YORK|NY|10001',
    });
    expect(() => service.stampCreate({ name: 'Missing street' })).toThrow(
      BadRequestException,
    );
  });

  it('merges partial address edits with the saved address', async () => {
    const repository = { findOne: jest.fn().mockResolvedValue({ address }) };
    const manager = {
      executeInWorkspaceContext: jest.fn((callback: () => Promise<unknown>) => callback()),
      getRepositoryWithContextPermissions: jest.fn(() => repository),
    } as unknown as WorkspaceOrmManager;
    const service = new PropertyAddressQueryHookService(manager);

    expect(
      await service.stampUpdateOne(
        'property-id',
        { address: { addressCity: ' Boston ' } },
        {} as WorkspaceAuthContext,
      ),
    ).toMatchObject({
      address: { addressStreet1: address.addressStreet1, addressCity: ' Boston ' },
      normalizedAddressKey: '123 MAIN ST|BOSTON|NY|10001',
    });
    expect(
      await service.stampUpdateOne(
        'property-id',
        { normalizedAddressKey: 'forged' },
        {} as WorkspaceAuthContext,
      ),
    ).toMatchObject({ normalizedAddressKey: '123 MAIN ST|NEW YORK|NY|10001' });
  });

  it('rejects bulk address changes but accepts other bulk edits', () => {
    const service = new PropertyAddressQueryHookService({} as WorkspaceOrmManager);

    expect(() => service.stampUpdateMany({ address })).toThrow(BadRequestException);
    expect(() => service.stampUpdateMany({ normalizedAddressKey: 'forged' })).toThrow(
      BadRequestException,
    );
    expect(service.stampUpdateMany({ name: 'Updated name' })).toEqual({
      name: 'Updated name',
    });
  });
});
