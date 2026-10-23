import { Command } from 'nest-commander';
import isEqual from 'lodash.isequal';
import {
  getSystemFormFieldPageLayoutWidgetUniversalIdentifier,
  getSystemPageLayoutTabUniversalIdentifier,
  getSystemRecordFormPageLayoutUniversalIdentifier,
} from 'twenty-shared/application';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import { isDefined } from 'twenty-shared/utils';
import { v4 } from 'uuid';

import { ProvisionedWorkspaceCommandRunner } from 'src/database/commands/command-runners/provisioned-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { getStandardFlatEntitiesToCreateOrThrow } from 'src/database/commands/upgrade-version-command/2-10/utils/get-standard-flat-entities-to-create-or-throw.util';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RegisteredWorkspaceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-workspace-command.decorator';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import { RECORD_FORM_TAB_PROPS } from 'src/engine/metadata-modules/metadata-side-effect/constants/record-form-tab-props.constant';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';
import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';
import { WorkspaceMigrationBuilderException } from 'src/engine/workspace-manager/workspace-migration/exceptions/workspace-migration-builder-exception';
import { WorkspaceMigrationValidateBuildAndRunService } from 'src/engine/workspace-manager/workspace-migration/services/workspace-migration-validate-build-and-run-service';

const PERSON_FIELD_NAMES = [
  'name',
  'phones',
  'emails',
  'propertyAddress',
] as const;
const OLD_PERSON_FORM_FIELD_NAMES = [
  'company',
  'jobTitle',
  'linkedinLink',
] as const;
const LEGACY_VIEW_FIELD_NAMES = new Set([
  'name',
  'emails',
  'createdBy',
  'company',
  'phones',
  'createdAt',
  'jobTitle',
  'linkedinLink',
  'propertyAddress',
]);

@RegisteredWorkspaceCommand('2.50.0', 1792677914642)
@Command({
  name: 'upgrade:2-50:configure-wholesale-person-layouts',
  description:
    'Configure existing People views and creation forms for wholesale contacts',
})
export class ConfigureWholesalePersonLayoutsCommand extends ProvisionedWorkspaceCommandRunner {
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
    const {
      flatFieldMetadataMaps,
      flatPageLayoutMaps,
      flatPageLayoutWidgetMaps,
      flatViewMaps,
      flatViewFieldMaps,
    } = await this.workspaceCacheService.getOrRecompute(workspaceId, [
      'flatFieldMetadataMaps',
      'flatPageLayoutMaps',
      'flatPageLayoutWidgetMaps',
      'flatViewMaps',
      'flatViewFieldMaps',
    ]);
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
    const fieldsToUpdate = [
      { name: 'emails', previousLabel: 'Emails' },
      { name: 'phones', previousLabel: 'Phones' },
    ].flatMap(({ name, previousLabel }) => {
      const universalIdentifier =
        STANDARD_OBJECTS.person.fields[name as 'emails' | 'phones']
          .universalIdentifier;
      const existingField =
        flatFieldMetadataMaps.byUniversalIdentifier[universalIdentifier];
      const standardField =
        allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
          universalIdentifier
        ];

      return isDefined(existingField) &&
        isDefined(standardField) &&
        existingField.label === previousLabel &&
        existingField.label !== standardField.label
        ? [{ ...existingField, label: standardField.label }]
        : [];
    });
    const formUniversalIdentifier =
      getSystemRecordFormPageLayoutUniversalIdentifier({
        objectMetadataApplicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION.universalIdentifier,
        objectUniversalIdentifier: STANDARD_OBJECTS.person.universalIdentifier,
      });
    const formTabUniversalIdentifier =
      getSystemPageLayoutTabUniversalIdentifier({
        objectMetadataApplicationUniversalIdentifier:
          TWENTY_STANDARD_APPLICATION.universalIdentifier,
        pageLayoutUniversalIdentifier: formUniversalIdentifier,
        title: RECORD_FORM_TAB_PROPS.title,
      });
    const widgetUniversalIdentifierByFieldName = Object.fromEntries(
      [...PERSON_FIELD_NAMES, ...OLD_PERSON_FORM_FIELD_NAMES].map(
        (fieldName) => [
          fieldName,
          getSystemFormFieldPageLayoutWidgetUniversalIdentifier({
            fieldMetadataApplicationUniversalIdentifier:
              TWENTY_STANDARD_APPLICATION.universalIdentifier,
            pageLayoutTabUniversalIdentifier: formTabUniversalIdentifier,
            fieldMetadataUniversalIdentifier:
              STANDARD_OBJECTS.person.fields[fieldName].universalIdentifier,
          }),
        ],
      ),
    );
    const formExists = isDefined(
      flatPageLayoutMaps.byUniversalIdentifier[formUniversalIdentifier],
    );
    const widgetsToCreate = formExists
      ? getStandardFlatEntitiesToCreateOrThrow<FlatPageLayoutWidget>({
          standardFlatEntityMaps: allFlatEntityMaps.flatPageLayoutWidgetMaps,
          existingFlatEntityMaps: flatPageLayoutWidgetMaps,
          universalIdentifiers: [
            widgetUniversalIdentifierByFieldName.propertyAddress,
          ],
        })
      : [];
    const widgetsToUpdate = formExists
      ? [...PERSON_FIELD_NAMES, ...OLD_PERSON_FORM_FIELD_NAMES].flatMap(
          (fieldName) => {
            const universalIdentifier =
              widgetUniversalIdentifierByFieldName[fieldName];
            const existingWidget =
              flatPageLayoutWidgetMaps.byUniversalIdentifier[
                universalIdentifier
              ];
            const standardWidget =
              allFlatEntityMaps.flatPageLayoutWidgetMaps.byUniversalIdentifier[
                universalIdentifier
              ];

            if (!isDefined(existingWidget) || !isDefined(standardWidget)) {
              return [];
            }

            const newPosition = PERSON_FIELD_NAMES.indexOf(
              fieldName as (typeof PERSON_FIELD_NAMES)[number],
            );
            const isActive = newPosition >= 0;
            const position = isActive
              ? standardWidget.position
              : existingWidget.position;

            return existingWidget.isActive === isActive &&
              isEqual(existingWidget.position, position)
              ? []
              : [{ ...existingWidget, isActive, position }];
          },
        )
      : [];

    const personFieldNameByUniversalIdentifier = new Map(
      Object.values(flatFieldMetadataMaps.byUniversalIdentifier)
        .filter(isDefined)
        .filter(
          (field) =>
            field.objectMetadataUniversalIdentifier ===
            STANDARD_OBJECTS.person.universalIdentifier,
        )
        .map((field) => [field.universalIdentifier, field.name]),
    );
    const customPeopleView = Object.values(flatViewMaps.byUniversalIdentifier)
      .filter(isDefined)
      .find((view) => {
        if (
          !view.isCustom ||
          view.name !== 'All People' ||
          view.objectMetadataUniversalIdentifier !==
            STANDARD_OBJECTS.person.universalIdentifier
        ) {
          return false;
        }

        const fields = Object.values(flatViewFieldMaps.byUniversalIdentifier)
          .filter(isDefined)
          .filter(
            (viewField) =>
              viewField.viewUniversalIdentifier === view.universalIdentifier,
          )
          .map((viewField) =>
            personFieldNameByUniversalIdentifier.get(
              viewField.fieldMetadataUniversalIdentifier,
            ),
          );

        return (
          fields.length >= 8 &&
          fields.every(
            (fieldName) =>
              isDefined(fieldName) && LEGACY_VIEW_FIELD_NAMES.has(fieldName),
          )
        );
      });
    const customViewFields = isDefined(customPeopleView)
      ? Object.values(flatViewFieldMaps.byUniversalIdentifier)
          .filter(isDefined)
          .filter(
            (viewField) =>
              viewField.viewUniversalIdentifier ===
              customPeopleView.universalIdentifier,
          )
      : [];
    const customViewFieldNames = new Map(
      customViewFields.map((viewField) => [
        viewField.universalIdentifier,
        personFieldNameByUniversalIdentifier.get(
          viewField.fieldMetadataUniversalIdentifier,
        ),
      ]),
    );
    const hasPropertyAddressViewField = customViewFields.some(
      (viewField) =>
        customViewFieldNames.get(viewField.universalIdentifier) ===
        'propertyAddress',
    );
    const orderedCustomViewFields = [
      ...PERSON_FIELD_NAMES.flatMap((fieldName) =>
        customViewFields.filter(
          (viewField) =>
            customViewFieldNames.get(viewField.universalIdentifier) ===
            fieldName,
        ),
      ),
      ...customViewFields.filter(
        (viewField) =>
          !PERSON_FIELD_NAMES.some(
            (fieldName) =>
              customViewFieldNames.get(viewField.universalIdentifier) ===
              fieldName,
          ),
      ),
    ];
    const customViewFieldsToUpdate = orderedCustomViewFields.flatMap(
      (viewField, index) => {
        const position =
          index >= 3 && !hasPropertyAddressViewField ? index + 1 : index;
        const isVisible = PERSON_FIELD_NAMES.some(
          (fieldName) =>
            customViewFieldNames.get(viewField.universalIdentifier) ===
            fieldName,
        );

        return viewField.position === position &&
          viewField.isVisible === isVisible
          ? []
          : [{ ...viewField, position, isVisible }];
      },
    );
    const propertyAddressViewField =
      allFlatEntityMaps.flatViewFieldMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.person.views.allPeople.viewFields.propertyAddress
          .universalIdentifier
      ];
    const customViewFieldsToCreate: FlatViewField[] =
      isDefined(customPeopleView) &&
      isDefined(propertyAddressViewField) &&
      !hasPropertyAddressViewField
        ? [
            {
              ...propertyAddressViewField,
              id: v4(),
              universalIdentifier: v4(),
              applicationId: customPeopleView.applicationId,
              applicationUniversalIdentifier:
                customPeopleView.applicationUniversalIdentifier,
              viewId: customPeopleView.id,
              viewUniversalIdentifier: customPeopleView.universalIdentifier,
              position: 3,
              isVisible: true,
            },
          ]
        : [];

    if (
      fieldsToUpdate.length === 0 &&
      widgetsToCreate.length === 0 &&
      widgetsToUpdate.length === 0 &&
      customViewFieldsToCreate.length === 0 &&
      customViewFieldsToUpdate.length === 0
    ) {
      return;
    }

    if (options.dryRun ?? false) {
      this.logger.log(
        `[DRY RUN] Workspace ${workspaceId}: ${fieldsToUpdate.length} field label(s), ${widgetsToCreate.length} form widget(s) to create, ${widgetsToUpdate.length} to update, ${customViewFieldsToCreate.length} custom view column(s) to create, ${customViewFieldsToUpdate.length} to update`,
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
              flatEntityToCreate: [],
              flatEntityToDelete: [],
              flatEntityToUpdate: fieldsToUpdate,
            },
            pageLayoutWidget: {
              flatEntityToCreate: widgetsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: widgetsToUpdate,
            },
            viewField: {
              flatEntityToCreate: customViewFieldsToCreate,
              flatEntityToDelete: [],
              flatEntityToUpdate: customViewFieldsToUpdate,
            },
          },
        },
      );

    if (result.status === 'fail') {
      throw new WorkspaceMigrationBuilderException(
        result,
        `Failed to configure wholesale Person layouts for workspace ${workspaceId}`,
      );
    }
  }

  async down(_args: RunOnWorkspaceArgs): Promise<void> {
    // Preserve contact layouts after data has been entered.
  }
}
