import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import {
  type CreateManyResolverArgs,
  type CreateOneResolverArgs,
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { PropertyAddressQueryHookService } from 'src/modules/property/query-hooks/property-address-query-hook.service';

@WorkspaceQueryHook('property.createOne')
export class PropertyCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly addressHook: PropertyAddressQueryHookService) {}

  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<RecordInput>,
  ): Promise<CreateOneResolverArgs<RecordInput>> {
    return { ...payload, data: this.addressHook.stampCreate(payload.data) };
  }
}

@WorkspaceQueryHook('property.createMany')
export class PropertyCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly addressHook: PropertyAddressQueryHookService) {}

  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<RecordInput>,
  ): Promise<CreateManyResolverArgs<RecordInput>> {
    return {
      ...payload,
      data: payload.data.map((record) => this.addressHook.stampCreate(record)),
    };
  }
}

@WorkspaceQueryHook('property.updateOne')
export class PropertyUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly addressHook: PropertyAddressQueryHookService) {}

  async execute(
    authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<RecordInput>,
  ): Promise<UpdateOneResolverArgs<RecordInput>> {
    return {
      ...payload,
      data: await this.addressHook.stampUpdateOne(payload.id, payload.data, authContext),
    };
  }
}

@WorkspaceQueryHook('property.updateMany')
export class PropertyUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(private readonly addressHook: PropertyAddressQueryHookService) {}

  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<RecordInput>,
  ): Promise<UpdateManyResolverArgs<RecordInput>> {
    return { ...payload, data: this.addressHook.stampUpdateMany(payload.data) };
  }
}
