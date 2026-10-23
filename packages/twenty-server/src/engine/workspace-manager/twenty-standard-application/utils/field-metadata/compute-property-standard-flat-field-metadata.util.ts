import { msg } from '@lingui/core/macro';
import { DateDisplayFormat, FieldMetadataType, RelationType } from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import { type CreateStandardFieldArgs, createStandardFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';

export const buildPropertyStandardFlatFieldMetadatas = (
  args: Omit<CreateStandardFieldArgs<'property', FieldMetadataType>, 'context'>,
): Record<AllStandardObjectFieldName<'property'>, FlatFieldMetadata> => {
  const createField = (context: CreateStandardFieldArgs<'property', FieldMetadataType>['context']): FlatFieldMetadata =>
    createStandardFieldFlatMetadata({ ...args, context });

  return {
    id: createField({
      fieldName: 'id',
      type: FieldMetadataType.UUID,
      label: i18nLabel(msg({ message: `ID`, context: 'fieldMetadata.label' })),
      description: i18nLabel(
        msg({ message: `ID`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'uuid',
    }),
    createdAt: createField({
      fieldName: 'createdAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Creation date`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendar',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
    }),
    updatedAt: createField({
      fieldName: 'updatedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Last update`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Last time the link was changed`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCalendarClock',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: 'now',
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
    }),
    deletedAt: createField({
      fieldName: 'deletedAt',
      type: FieldMetadataType.DATE_TIME,
      label: i18nLabel(
        msg({ message: `Deleted at`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Deleted at`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconCalendarMinus',
      isSystem: true,
      isNullable: true,
      isUIEditable: false,
      settings: { displayFormat: DateDisplayFormat.RELATIVE },
    }),
    createdBy: createField({
      fieldName: 'createdBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Created by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The creator of the link`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconCreativeCommonsSa',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
      },
    }),
    updatedBy: createField({
      fieldName: 'updatedBy',
      type: FieldMetadataType.ACTOR,
      label: i18nLabel(
        msg({ message: `Updated by`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `The last editor of the link`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUserCircle',
      isSystem: true,
      isNullable: false,
      isUIEditable: false,
      defaultValue: {
        source: "'MANUAL'",
        name: "'System'",
        workspaceMemberId: null,
      },
    }),
    position: createField({
      fieldName: 'position',
      type: FieldMetadataType.POSITION,
      label: i18nLabel(
        msg({ message: `Position`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Link position`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconHierarchy2',
      isSystem: true,
      isNullable: false,
      defaultValue: 0,
    }),
    searchVector: createField({
      fieldName: 'searchVector',
      type: FieldMetadataType.TS_VECTOR,
      label: i18nLabel(
        msg({ message: `Search vector`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Field used for full-text search`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconUser',
      isSystem: true,
      isNullable: true,
    }),
    name: createField({
      fieldName: 'name', type: FieldMetadataType.TEXT,
      label: i18nLabel(msg({ message: `Name`, context: 'fieldMetadata.label' })),
      description: i18nLabel(msg({ message: `Name`, context: 'fieldMetadata.description' })),
      icon: 'IconHome', isNullable: false,
    }),
    address: createField({
      fieldName: 'address', type: FieldMetadataType.ADDRESS,
      label: i18nLabel(msg({ message: `Address`, context: 'fieldMetadata.label' })),
      description: i18nLabel(msg({ message: `Address`, context: 'fieldMetadata.description' })),
      icon: 'IconMap', isNullable: true,
      settings: { subFields: ['addressStreet1', 'addressCity', 'addressState', 'addressPostcode'] },
    }),
    normalizedAddressKey: createField({
      fieldName: 'normalizedAddressKey', type: FieldMetadataType.TEXT,
      label: i18nLabel(msg({ message: `Normalized address key`, context: 'fieldMetadata.label' })),
      description: i18nLabel(msg({ message: `Normalized address key`, context: 'fieldMetadata.description' })),
      icon: 'IconMap', isNullable: true, isUIEditable: false,
    }),
    owners: createStandardRelationFieldFlatMetadata({
      ...args,
      context: {
        fieldName: 'owners', type: FieldMetadataType.RELATION, morphId: null,
        label: i18nLabel(msg({ message: `Owners`, context: 'fieldMetadata.label' })),
        description: i18nLabel(msg({ message: `Owners`, context: 'fieldMetadata.description' })),
        icon: 'IconLink', isNullable: true,
        targetObjectName: 'personProperty', targetFieldName: 'property',
        settings: { relationType: RelationType.ONE_TO_MANY, },
      },
    }),
    opportunities: createStandardRelationFieldFlatMetadata({
      ...args,
      context: {
        fieldName: 'opportunities', type: FieldMetadataType.RELATION, morphId: null,
        label: i18nLabel(msg({ message: `Opportunities`, context: 'fieldMetadata.label' })),
        description: i18nLabel(msg({ message: `Opportunities`, context: 'fieldMetadata.description' })),
        icon: 'IconLink', isNullable: true,
        targetObjectName: 'opportunity', targetFieldName: 'property',
        settings: { relationType: RelationType.ONE_TO_MANY, },
      },
    }),
  };
};
