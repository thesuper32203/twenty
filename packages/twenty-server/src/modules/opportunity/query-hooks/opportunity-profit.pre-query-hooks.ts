import { BadRequestException } from '@nestjs/common';
import { type CurrencyMetadata } from 'twenty-shared/types';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import {
  type CreateManyResolverArgs,
  type CreateOneResolverArgs,
  type UpdateManyResolverArgs,
  type UpdateOneResolverArgs,
} from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';
import { type RecordInput } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

type OpportunityInput = RecordInput & {
  assignmentFee?: CurrencyMetadata | null;
  projectedProfit?: CurrencyMetadata | null;
};

export const stampProjectedProfit = <TInput extends OpportunityInput>(
  data: TInput,
  isCreate = false,
): TInput => {
  if ('projectedProfit' in data && !('assignmentFee' in data)) {
    throw new BadRequestException(
      'Projected profit is calculated from assignment fee',
    );
  }

  if (!('assignmentFee' in data) && !isCreate) {
    return data;
  }

  return {
    ...data,
    projectedProfit: data.assignmentFee ?? null,
  };
};

@WorkspaceQueryHook('opportunity.createOne')
export class OpportunityCreateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateOneResolverArgs<OpportunityInput>,
  ): Promise<CreateOneResolverArgs<OpportunityInput>> {
    return { ...payload, data: stampProjectedProfit(payload.data, true) };
  }
}

@WorkspaceQueryHook('opportunity.createMany')
export class OpportunityCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: CreateManyResolverArgs<OpportunityInput>,
  ): Promise<CreateManyResolverArgs<OpportunityInput>> {
    return {
      ...payload,
      data: payload.data.map((record) => stampProjectedProfit(record, true)),
    };
  }
}

@WorkspaceQueryHook('opportunity.updateOne')
export class OpportunityUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateOneResolverArgs<OpportunityInput>,
  ): Promise<UpdateOneResolverArgs<OpportunityInput>> {
    return { ...payload, data: stampProjectedProfit(payload.data) };
  }
}

@WorkspaceQueryHook('opportunity.updateMany')
export class OpportunityUpdateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(
    _authContext: WorkspaceAuthContext,
    _objectName: string,
    payload: UpdateManyResolverArgs<OpportunityInput>,
  ): Promise<UpdateManyResolverArgs<OpportunityInput>> {
    return { ...payload, data: stampProjectedProfit(payload.data) };
  }
}
