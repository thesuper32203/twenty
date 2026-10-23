import { Module } from '@nestjs/common';

import { PropertyAddressQueryHookService } from 'src/modules/property/query-hooks/property-address-query-hook.service';
import {
  PropertyCreateManyPreQueryHook,
  PropertyCreateOnePreQueryHook,
  PropertyUpdateManyPreQueryHook,
  PropertyUpdateOnePreQueryHook,
} from 'src/modules/property/query-hooks/property-address.pre-query-hooks';

@Module({
  providers: [
    PropertyAddressQueryHookService,
    PropertyCreateOnePreQueryHook,
    PropertyCreateManyPreQueryHook,
    PropertyUpdateOnePreQueryHook,
    PropertyUpdateManyPreQueryHook,
  ],
})
export class PropertyQueryHookModule {}
