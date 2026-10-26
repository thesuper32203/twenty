import { Module } from '@nestjs/common';

import { WorkspaceIteratorModule } from 'src/database/commands/command-runners/workspace-iterator.module';
import { AddPersonPropertyAddressCommand } from 'src/database/commands/upgrade-version-command/2-50/2-50-workspace-command-1792446804535-add-person-property-address.command';
import { ConfigureWholesalePersonLayoutsCommand } from 'src/database/commands/upgrade-version-command/2-50/2-50-workspace-command-1792677914642-configure-wholesale-person-layouts.command';
import { AddWholesaleImportObjectsCommand } from 'src/database/commands/upgrade-version-command/2-50/2-50-workspace-command-1792682985480-add-wholesale-import-objects.command';
import { AddImportMappedColumnCountCommand } from 'src/database/commands/upgrade-version-command/2-50/2-50-workspace-command-1792690634489-add-import-mapped-column-count.command';
import { AddWholesaleOpportunityWorkflowCommand } from 'src/database/commands/upgrade-version-command/2-50/2-50-workspace-command-1792700000000-add-wholesale-opportunity-workflow.command';
import { ApplicationModule } from 'src/engine/core-modules/application/application.module';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';
import { WorkspaceMigrationModule } from 'src/engine/workspace-manager/workspace-migration/workspace-migration.module';

@Module({
  imports: [
    ApplicationModule,
    WorkspaceCacheModule,
    WorkspaceIteratorModule,
    WorkspaceMigrationModule,
  ],
  providers: [
    AddPersonPropertyAddressCommand,
    ConfigureWholesalePersonLayoutsCommand,
    AddWholesaleImportObjectsCommand,
    AddImportMappedColumnCountCommand,
    AddWholesaleOpportunityWorkflowCommand,
  ],
})
export class V2_50_UpgradeVersionCommandModule {}
