import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

@RegisteredWorkspaceCommand('2.50.0', 1792690634489)
@Command({ name: 'upgrade:2-50:add-import-mapped-column-count' })
export class AddImportMappedColumnCountCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly migrationService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, options }: RunOnWorkspaceArgs): Promise<void> {
    const existing = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatFieldMetadataMaps'],
    );
    const fieldId =
      STANDARD_OBJECTS.importBatch.fields.mappedColumnCount.universalIdentifier;
    if (
      isDefined(existing.flatFieldMetadataMaps.byUniversalIdentifier[fieldId])
    ) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const { allFlatEntityMaps } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });
    const field =
      allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[fieldId];
    if (!isDefined(field)) {
      return;
    }
    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: mapped column count field`,
      );
      return;
    }

    const result =
      await this.migrationService.validateBuildAndRunLegacyWorkspaceMigration({
        workspaceId,
        isSystemBuild: true,
        applicationUniversalIdentifier:
          twentyStandardFlatApplication.universalIdentifier,
        allFlatEntityOperationByMetadataName: {
          fieldMetadata: {
            flatEntityToCreate: [field],
            flatEntityToUpdate: [],
            flatEntityToDelete: [],
          },
        },
      });
    if (result.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        result,
        `Failed to add mapped column count for workspace ${workspaceId}`,
      );
    }
  }

  async down(_args: RunOnWorkspaceArgs): Promise<void> {
    // Preserve import history on rollback.
  }
}
