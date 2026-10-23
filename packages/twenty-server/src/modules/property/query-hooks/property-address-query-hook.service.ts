import { BadRequestException, Injectable } from '@nestjs/common';
import { type AddressMetadata } from 'twenty-shared/types';

import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { type PropertyWorkspaceEntity } from 'src/modules/property/standard-objects/property.workspace-entity';
import { normalizePropertyAddressKey } from 'src/modules/property/utils/normalize-property-address-key.util';

type PropertyMutationInput = RecordInput & {
  address?: Partial<AddressMetadata> | null;
  normalizedAddressKey?: string | null;
};

@Injectable()
export class PropertyAddressQueryHookService {
  constructor(private readonly workspaceOrmManager: WorkspaceOrmManager) {}

  stampCreate(data: PropertyMutationInput): PropertyMutationInput {
    return { ...data, normalizedAddressKey: this.requireAddressKey(data.address) };
  }

  async stampUpdateOne(
    id: string,
    data: PropertyMutationInput,
    authContext: WorkspaceAuthContext,
  ): Promise<PropertyMutationInput> {
    if (!('address' in data) && !('normalizedAddressKey' in data)) {
      return data;
    }

    if ('address' in data && !data.address) {
      throw new BadRequestException('Property street address is required');
    }

    const property = await this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager
          .getRepositoryWithContextPermissions<PropertyWorkspaceEntity>('property')
          .findOne({ where: { id } }),
      authContext,
    );

    if (!property) {
      return data;
    }

    const address = 'address' in data
      ? { ...property.address, ...data.address }
      : property.address;

    return {
      ...data,
      ...('address' in data ? { address } : {}),
      normalizedAddressKey: this.requireAddressKey(address),
    };
  }

  stampUpdateMany(data: PropertyMutationInput): PropertyMutationInput {
    if ('address' in data || 'normalizedAddressKey' in data) {
      throw new BadRequestException('Bulk property address changes are not supported');
    }

    return data;
  }

  private requireAddressKey(address: Partial<AddressMetadata> | null | undefined): string {
    const key = normalizePropertyAddressKey(address);

    if (!key) {
      throw new BadRequestException('Property street address is required');
    }

    return key;
  }
}
