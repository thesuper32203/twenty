import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const PERSON_PROPERTY_ADDRESS_FIELD_ID =
  STANDARD_OBJECTS.person.fields.propertyAddress.universalIdentifier;
const PERSON_PROPERTY_ADDRESS_VIEW_FIELD_IDS = [
  STANDARD_OBJECTS.person.views.allPeople.viewFields.propertyAddress
    .universalIdentifier,
  STANDARD_OBJECTS.person.views.personRecordPageFields.viewFields.propertyAddress
    .universalIdentifier,
];
const ALL_PEOPLE_VIEW_ID =
  STANDARD_OBJECTS.person.views.allPeople.universalIdentifier;
const VISIBLE_PEOPLE_FIELD_IDS = new Set([
  STANDARD_OBJECTS.person.fields.name.universalIdentifier,
  STANDARD_OBJECTS.person.fields.phones.universalIdentifier,
  STANDARD_OBJECTS.person.fields.emails.universalIdentifier,
  PERSON_PROPERTY_ADDRESS_FIELD_ID,
]);

@RegisteredWorkspaceCommand('2.50.0', 1792446804535)
@Command({
  name: 'upgrade:2-50:add-person-property-address',
  description:
    'Add the Person property address field and People view columns to existing workspaces',
})
export class AddPersonPropertyAddressCommand extends ProvisionedWorkspaceCommandRunner {
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

  async up({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const {
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatViewMaps,
      flatViewFieldMaps,
    } =
      await this.workspaceCacheService.getOrRecompute(workspaceId, [
        'flatObjectMetadataMaps',
        'flatFieldMetadataMaps',
        'flatViewMaps',
        'flatViewFieldMaps',
      ]);

    if (
      !isDefined(
        flatObjectMetadataMaps.byUniversalIdentifier[
          STANDARD_OBJECTS.person.universalIdentifier
        ],
      )
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

    const fieldsToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatFieldMetadata>({
        standardFlatEntityMaps: allFlatEntityMaps.flatFieldMetadataMaps,
        existingFlatEntityMaps: flatFieldMetadataMaps,
        universalIdentifiers: [PERSON_PROPERTY_ADDRESS_FIELD_ID],
      });
    const viewFieldsToCreate =
      getStandardFlatEntitiesToCreateOrThrow<FlatViewField>({
        standardFlatEntityMaps: allFlatEntityMaps.flatViewFieldMaps,
        existingFlatEntityMaps: flatViewFieldMaps,
        universalIdentifiers: PERSON_PROPERTY_ADDRESS_VIEW_FIELD_IDS,
      })
      .filter((viewField) =>
        isDefined(
          flatViewMaps.byUniversalIdentifier[viewField.viewUniversalIdentifier],
        ),
      )
      .map((viewField) => {
        const currentView =
          flatViewMaps.byUniversalIdentifier[viewField.viewUniversalIdentifier];
        const positions = (currentView?.viewFieldUniversalIdentifiers ?? [])
          .map((id) => flatViewFieldMaps.byUniversalIdentifier[id]?.position)
          .filter((position): position is number => isDefined(position));

        return { ...viewField, position: Math.max(-1, ...positions) + 1 };
      });
    const viewFieldsToUpdate = Object.values(
      flatViewFieldMaps.byUniversalIdentifier,
    )
      .filter(isDefined)
      .filter(
        (viewField) =>
          viewField.viewUniversalIdentifier === ALL_PEOPLE_VIEW_ID &&
          viewField.applicationUniversalIdentifier ===
            twentyStandardFlatApplication.universalIdentifier,
      )
      .flatMap((viewField) => {
        const isVisible = VISIBLE_PEOPLE_FIELD_IDS.has(
          viewField.fieldMetadataUniversalIdentifier,
        );

        return viewField.isVisible === isVisible
          ? []
          : [{ ...viewField, isVisible }];
      });

    if (
      fieldsToCreate.length === 0 &&
      viewFieldsToCreate.length === 0 &&
      viewFieldsToUpdate.length === 0
    ) {
      return;
    }

    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${fieldsToCreate.length} field(s), ${viewFieldsToCreate.length} view column(s), ${viewFieldsToUpdate.length} visibility update(s)`,
      );

      return;
    }

    const result =
      await this.workspaceMigrationValidateBuildAndRunService.validateBuildAndRunLegacyWorkspaceMigration(
        {
          workspaceId,
          isSystemBuild: true,
          applicationUniversalIdentifier:
            twentyStandardFlatApplication.universalIdentifier,
          allFlatEntityOperationByMetadataName: {
            fieldMetadata: {
              flatEntityToCreate: fieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: [],
            },
            viewField: {
              flatEntityToCreate: viewFieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: viewFieldsToUpdate,
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        result,
        `Failed to add Person property address for workspace ${workspaceId}`,
      );
    }
  }

  async down(_args: RunOnWorkspaceArgs): Promise<void> {
    // Preserve any property addresses entered after this upgrade.
  }
}
