import { Module } from '@nestjs/common';

import { ActorModule } from 'src/engine/core-modules/actor/actor.module';
import { TwentyOrmModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { HomeownerImportResolver } from 'src/modules/wholesale-import/resolvers/homeowner-import.resolver';
import { HomeownerImportService } from 'src/modules/wholesale-import/services/homeowner-import.service';

@Module({
  imports: [ActorModule, TwentyOrmModule, PermissionsModule, WorkspaceCacheModule],
  providers: [HomeownerImportResolver, HomeownerImportService],
})
export class WholesaleImportModule {}
