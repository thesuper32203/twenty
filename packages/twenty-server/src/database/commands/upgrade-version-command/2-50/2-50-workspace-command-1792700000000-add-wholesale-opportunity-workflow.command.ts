import { Command } from 'nest-commander';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { type FieldMetadataComplexOption } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const FIELD_NAMES = [
  'arv',
  'repairs',
  'askingPrice',
  'sellerMinimum',
  'mao',
  'offer',
  'assignmentFee',
  'projectedProfit',
] as const;

const LEGACY_STAGES = [
  {
    id: '20202020-8e01-4afd-9c39-d2063097587a',
    value: 'NEW',
    label: 'New',
    color: 'red',
  },
  {
    id: '20202020-e685-4671-ac32-26d304dacb6e',
    value: 'SCREENING',
    label: 'Screening',
    color: 'purple',
  },
  {
    id: '20202020-dde9-4acc-b5ca-f6531a8ecb4a',
    value: 'MEETING',
    label: 'Meeting',
    color: 'sky',
  },
  {
    id: '20202020-696e-4f6b-91bc-f413e9b2f654',
    value: 'PROPOSAL',
    label: 'Proposal',
    color: 'turquoise',
  },
  {
    id: '20202020-0bb5-4a6f-a8b2-774bbad21104',
    value: 'CUSTOMER',
    label: 'Customer',
    color: 'yellow',
  },
] as const;

const LEGACY_STAGE_REPLACEMENTS: Record<string, string> = {
  SCREENING: 'CONTACTED',
  MEETING: 'FOLLOW_UP',
  PROPOSAL: 'OFFER',
  CUSTOMER: 'ACCEPTED',
};

type EntityLookup<TEntity> = {
  byUniversalIdentifier: Record<string, TEntity | undefined>;
};

type StageOption = FieldMetadataComplexOption;

@RegisteredWorkspaceCommand('2.50.0', 1792700000000)
@Command({ name: 'upgrade:2-50:add-wholesale-opportunity-workflow' })
export class AddWholesaleOpportunityWorkflowCommand extends ProvisionedWorkspaceCommandRunner {
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

  async up({
    workspaceId,
    options,
    dataSource,
  }: RunOnWorkspaceArgs): Promise<void> {
    if (!isDefined(dataSource) && !(options.dryRun ?? false)) {
      throw new Error(`Workspace data source unavailable for ${workspaceId}`);
    }

    const existing = await this.workspaceCacheService.getOrRecompute(
      workspaceId,
      ['flatFieldMetadataMaps', 'flatViewFieldMaps', 'flatViewGroupMaps'],
    );
    const { twentyStandardFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const { allFlatEntityMaps: standard } =
      computeTwentyStandardApplicationAllFlatEntityMaps({
        now: new Date().toISOString(),
        workspaceId,
        twentyStandardApplicationId: twentyStandardFlatApplication.id,
      });

    const existingFields =
      existing.flatFieldMetadataMaps as EntityLookup<FlatFieldMetadata>;
    const standardFields =
      standard.flatFieldMetadataMaps as EntityLookup<FlatFieldMetadata>;
    const existingViewFields =
      existing.flatViewFieldMaps as EntityLookup<FlatViewField>;
    const standardViewFields =
      standard.flatViewFieldMaps as EntityLookup<FlatViewField>;
    const existingViewGroups =
      existing.flatViewGroupMaps as EntityLookup<FlatViewGroup>;
    const standardViewGroups =
      standard.flatViewGroupMaps as EntityLookup<FlatViewGroup>;

    const fieldIds = FIELD_NAMES.map(
      (name) => STANDARD_OBJECTS.opportunity.fields[name].universalIdentifier,
    );
    const fields = fieldIds
      .filter((id) => !isDefined(existingFields.byUniversalIdentifier[id]))
      .map((id) => {
        const field = standardFields.byUniversalIdentifier[id];
        if (!isDefined(field)) {
          throw new Error(`Missing standard Opportunity field ${id}`);
        }
        return field as FlatFieldMetadata & { id: string };
      });
    const stageId =
      STANDARD_OBJECTS.opportunity.fields.stage.universalIdentifier;
    const existingStage = existingFields.byUniversalIdentifier[stageId];
    const standardStage = standardFields.byUniversalIdentifier[stageId];
    const stageUpdate =
      isDefined(existingStage) &&
      isDefined(standardStage) &&
      Array.isArray(existingStage.options) &&
      Array.isArray(standardStage.options)
        ? (() => {
            const currentOptions = existingStage.options as StageOption[];
            const desiredOptions = standardStage.options as StageOption[];
            const usesLegacyDefaults =
              currentOptions.length === 5 &&
              currentOptions.every((option, index) => {
                const legacy = LEGACY_STAGES[index];
                return (
                  isDefined(legacy) &&
                  option.value === legacy.value &&
                  option.id === legacy.id &&
                  option.label === legacy.label &&
                  option.color === legacy.color &&
                  option.position === index
                );
              });
            const mappedOptions = currentOptions.map((option) => {
              const value = LEGACY_STAGE_REPLACEMENTS[option.value];
              if (
                !isDefined(value) ||
                currentOptions.some(
                  (otherOption) =>
                    otherOption !== option && otherOption.value === value,
                )
              ) {
                return option;
              }
              const legacy = LEGACY_STAGES.find(
                (stage) => stage.value === option.value,
              );
              const replacement = desiredOptions.find(
                (stage) => stage.value === value,
              );
              return {
                ...option,
                value,
                label:
                  option.label === legacy?.label
                    ? (replacement?.label ?? option.label)
                    : option.label,
              };
            });
            const nextOptions = usesLegacyDefaults
              ? desiredOptions
              : [
                  ...mappedOptions,
                  ...desiredOptions
                    .filter(
                      (option) =>
                        !mappedOptions.some(
                          (currentOption) =>
                            currentOption.value === option.value,
                        ),
                    )
                    .map((option, index) => ({
                      ...option,
                      position:
                        Math.max(
                          -1,
                          ...mappedOptions.map(
                            (currentOption) => currentOption.position,
                          ),
                        ) +
                        index +
                        1,
                    })),
                ];
            return JSON.stringify(currentOptions) ===
              JSON.stringify(nextOptions)
              ? []
              : [{ ...existingStage, options: nextOptions }];
          })()
        : [];

    const viewFieldIds = [
      ...FIELD_NAMES.map(
        (name) =>
          STANDARD_OBJECTS.opportunity.views.opportunityRecordPageFields
            .viewFields[name].universalIdentifier,
      ),
      STANDARD_OBJECTS.opportunity.views.byStage.viewFields.mao
        .universalIdentifier,
      STANDARD_OBJECTS.opportunity.views.byStage.viewFields.offer
        .universalIdentifier,
    ];
    const viewFields = viewFieldIds
      .filter((id) => !isDefined(existingViewFields.byUniversalIdentifier[id]))
      .map((id) => {
        const field = standardViewFields.byUniversalIdentifier[id];
        if (!isDefined(field)) {
          throw new Error(`Missing standard Opportunity view field ${id}`);
        }
        return field;
      });
    const groupIds = Object.values(
      STANDARD_OBJECTS.opportunity.views.byStage.viewGroups,
    ).map((group) => group.universalIdentifier);
    const groupsToCreate = groupIds
      .filter((id) => !isDefined(existingViewGroups.byUniversalIdentifier[id]))
      .map((id) => {
        const group = standardViewGroups.byUniversalIdentifier[id];
        if (!isDefined(group)) {
          throw new Error(`Missing standard Opportunity view group ${id}`);
        }
        return group;
      });
    const groupsToUpdate = groupIds.flatMap((id) => {
      const current = existingViewGroups.byUniversalIdentifier[id];
      const desired = standardViewGroups.byUniversalIdentifier[id];
      if (
        !isDefined(current) ||
        !isDefined(desired) ||
        LEGACY_STAGE_REPLACEMENTS[current.fieldValue] !== desired.fieldValue
      ) {
        return [];
      }

      return [
        {
          ...current,
          fieldValue: desired.fieldValue,
          position:
            current.fieldValue === 'CUSTOMER' && current.position === 4
              ? desired.position
              : current.position,
        },
      ];
    });

    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: wholesale Opportunity fields and stages`,
      );
      return;
    }
    if (
      fields.length +
        stageUpdate.length +
        viewFields.length +
        groupsToCreate.length +
        groupsToUpdate.length >
      0
    ) {
      const result =
        await this.migrationService.validateBuildAndRunLegacyWorkspaceMigration(
          {
            workspaceId,
            isSystemBuild: true,
            applicationUniversalIdentifier:
              twentyStandardFlatApplication.universalIdentifier,
            allFlatEntityOperationByMetadataName: {
              fieldMetadata: {
                flatEntityToCreate: fields,
                flatEntityToUpdate: stageUpdate,
                flatEntityToDelete: [],
              },
              viewField: {
                flatEntityToCreate: viewFields,
                flatEntityToUpdate: [],
                flatEntityToDelete: [],
              },
              viewGroup: {
                flatEntityToCreate: groupsToCreate,
                flatEntityToUpdate: groupsToUpdate,
                flatEntityToDelete: [],
              },
            },
          },
        );
      if (result.status === 'fail') {
        throw new WorkspaceMigrationBuilderException(
          result,
          `Failed wholesale Opportunity upgrade for workspace ${workspaceId}`,
        );
      }
    }
    // Updating option values by stable ID also migrates stored enum values.
    // A separate SQL update would reference enum labels that no longer exist.
  }

  async down(_args: RunOnWorkspaceArgs): Promise<void> {
    // Preserve opportunity data and custom stage configuration on rollback.
  }
}
