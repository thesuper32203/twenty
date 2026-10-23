import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type SyncableFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const NEW_OBJECT_IDS = new Set<string>([
  STANDARD_OBJECTS.property.universalIdentifier,
  STANDARD_OBJECTS.personProperty.universalIdentifier,
  STANDARD_OBJECTS.importBatch.universalIdentifier,
  STANDARD_OBJECTS.importRowResult.universalIdentifier,
]);

const EXISTING_OBJECT_FIELD_IDS = new Set<string>([
  STANDARD_OBJECTS.opportunity.fields.property.universalIdentifier,
  STANDARD_OBJECTS.person.fields.propertyLinks.universalIdentifier,
  STANDARD_OBJECTS.messageList.fields.importBatches.universalIdentifier,
]);

const EXISTING_OBJECT_INDEX_IDS = new Set<string>([
  STANDARD_OBJECTS.opportunity.indexes.propertyIdIndex.universalIdentifier,
]);

const EXISTING_VIEW_FIELD_IDS = new Set<string>([
  STANDARD_OBJECTS.opportunity.views.allOpportunities.viewFields.property.universalIdentifier,
  STANDARD_OBJECTS.opportunity.views.byStage.viewFields.property.universalIdentifier,
  STANDARD_OBJECTS.opportunity.views.opportunityRecordPageFields.viewFields.property.universalIdentifier,
  STANDARD_OBJECTS.person.views.allPeople.viewFields.listMemberships.universalIdentifier,
]);

const missing = <TEntity extends SyncableFlatEntity>(
  standard: FlatEntityMaps<TEntity>,
  existing: FlatEntityMaps<TEntity>,
  matches: (entity: TEntity) => boolean,
): TEntity[] =>
  Object.values(standard.byUniversalIdentifier)
    .filter(isDefined)
    .filter(matches)
    .filter((entity) => !isDefined(existing.byUniversalIdentifier[entity.universalIdentifier]));

@RegisteredWorkspaceCommand('2.50.0', 1792682985480)
@Command({
  name: 'upgrade:2-50:add-wholesale-import-objects',
  description: 'Add Property, owner links, import history, and Opportunity property links',
})
export class AddWholesaleImportObjectsCommand extends ProvisionedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly workspaceMigrationValidateBuildAndRunService: WorkspaceMigrationValidateBuildAndRunService,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace(args: RunOnWorkspaceArgs): Promise<void> {
    await this.up(args);
  }

  async up({ workspaceId, options }: RunOnWorkspaceArgs): Promise<void> {
    const existing = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatObjectMetadataMaps',
      'flatFieldMetadataMaps',
      'flatIndexMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
      'flatSearchFieldMetadataMaps',
    ]);

    if (!isDefined(existing.flatObjectMetadataMaps.byUniversalIdentifier[STANDARD_OBJECTS.person.universalIdentifier])) {
      return;
    }

    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow({ workspaceId });
    const { allFlatEntityMaps: standard } = computeTwentyStandardApplicationAllFlatEntityMaps({
      now: new Date().toISOString(),
      workspaceId,
      twentyStandardApplicationId: twentyStandardFlatApplication.id,
    });

    const objects = missing(standard.flatObjectMetadataMaps, existing.flatObjectMetadataMaps,
      (entity) => NEW_OBJECT_IDS.has(entity.universalIdentifier));
    const fields = missing(standard.flatFieldMetadataMaps, existing.flatFieldMetadataMaps,
      (entity) => NEW_OBJECT_IDS.has(entity.objectMetadataUniversalIdentifier) || EXISTING_OBJECT_FIELD_IDS.has(entity.universalIdentifier));
    const indexes = missing(standard.flatIndexMaps, existing.flatIndexMaps,
      (entity) => NEW_OBJECT_IDS.has(entity.objectMetadataUniversalIdentifier) || EXISTING_OBJECT_INDEX_IDS.has(entity.universalIdentifier));
    const views = missing(standard.flatViewMaps, existing.flatViewMaps,
      (entity) => NEW_OBJECT_IDS.has(entity.objectMetadataUniversalIdentifier));
    const viewFields = missing(standard.flatViewFieldMaps, existing.flatViewFieldMaps,
      (entity) =>
        NEW_OBJECT_IDS.has(
          standard.flatViewMaps.byUniversalIdentifier[entity.viewUniversalIdentifier]
            ?.objectMetadataUniversalIdentifier ?? '',
        ) || EXISTING_VIEW_FIELD_IDS.has(entity.universalIdentifier))
      .filter((entity) =>
        isDefined(standard.flatViewMaps.byUniversalIdentifier[entity.viewUniversalIdentifier]) &&
        (isDefined(existing.flatViewMaps.byUniversalIdentifier[entity.viewUniversalIdentifier]) ||
          views.some((view) => view.universalIdentifier === entity.viewUniversalIdentifier)))
      .map((entity): FlatViewField => {
        const existingView = existing.flatViewMaps.byUniversalIdentifier[entity.viewUniversalIdentifier];
        if (!isDefined(existingView)) {
          return entity;
        }
        const positions = (existingView.viewFieldUniversalIdentifiers ?? [])
          .map((identifier) => existing.flatViewFieldMaps.byUniversalIdentifier[identifier]?.position)
          .filter((position): position is number => isDefined(position));
        return { ...entity, position: Math.max(-1, ...positions) + 1 };
      });
    const searchFields = missing(standard.flatSearchFieldMetadataMaps, existing.flatSearchFieldMetadataMaps,
      (entity) => NEW_OBJECT_IDS.has(entity.objectMetadataUniversalIdentifier));

    const count = objects.length + fields.length + indexes.length + views.length + viewFields.length + searchFields.length;
    if (count === 0) {
      return;
    }
    if (options.dryRun ?? false) {
      this.logger.log(`[DRY RUN] Workspace ${workspaceId}: ${count} wholesale metadata entities`);
      return;
    }

    const result = await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration({
      workspaceId,
      isSystemBuild: true,
      applicationUniversalIdentifier: twentyStandardFlatApplication.universalIdentifier,
      allFlatEntityOperationByMetadataName: {
        objectMetadata: { flatEntityToCreate: objects, flatEntityToUpdate: [], flatEntityToDelete: [] },
        fieldMetadata: { flatEntityToCreate: fields, flatEntityToUpdate: [], flatEntityToDelete: [] },
        index: { flatEntityToCreate: indexes, flatEntityToUpdate: [], flatEntityToDelete: [] },
        view: { flatEntityToCreate: views, flatEntityToUpdate: [], flatEntityToDelete: [] },
        viewField: { flatEntityToCreate: viewFields, flatEntityToUpdate: [], flatEntityToDelete: [] },
        searchFieldMetadata: { flatEntityToCreate: searchFields, flatEntityToUpdate: [], flatEntityToDelete: [] },
      },
    });
    if (result.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(result, `Failed to add wholesale objects for workspace ${workspaceId}`);
    }
  }

  async down(_args: RunOnWorkspaceArgs): Promise<void> {
    // Preserve imported records if an upgrade is rolled back.
  }
}
