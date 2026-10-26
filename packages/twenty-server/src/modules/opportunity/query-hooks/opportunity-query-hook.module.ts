import { Module } from '@nestjs/common';

import {
  OpportunityCreateManyPreQueryHook,
  OpportunityCreateOnePreQueryHook,
  OpportunityUpdateManyPreQueryHook,
  OpportunityUpdateOnePreQueryHook,
} from 'src/modules/opportunity/query-hooks/opportunity-profit.pre-query-hooks';

@Module({
  providers: [
    OpportunityCreateOnePreQueryHook,
    OpportunityCreateManyPreQueryHook,
    OpportunityUpdateOnePreQueryHook,
    OpportunityUpdateManyPreQueryHook,
  ],
})
export class OpportunityQueryHookModule {}
