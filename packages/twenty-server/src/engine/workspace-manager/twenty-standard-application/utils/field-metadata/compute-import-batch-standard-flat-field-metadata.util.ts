import { msg } from '@lingui/core/macro';
import {
  DateDisplayFormat,
  FieldMetadataType,
  RelationOnDeleteAction,
  RelationType,
} from 'twenty-shared/types';

import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type AllStandardObjectFieldName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-field-name.type';
import {
  type CreateStandardFieldArgs,
  createStandardFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-field-flat-metadata.util';
import { createStandardRelationFieldFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/field-metadata/create-standard-relation-field-flat-metadata.util';
import { i18nLabel } from 'src/engine/workspace-manager/twenty-standard-application/utils/i18n-label.util';

export const buildImportBatchStandardFlatFieldMetadatas = (
  args: Omit<
    CreateStandardFieldArgs<'importBatch', FieldMetadataType>,
    'context'
  >,
): Record<AllStandardObjectFieldName<'importBatch'>, FlatFieldMetadata> => {
  const createField = (
    context: CreateStandardFieldArgs<
      'importBatch',
      FieldMetadataType
    >['context'],
  ): FlatFieldMetadata => createStandardFieldFlatMetadata({ ...args, context });

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
      fieldName: 'name',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Name`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Name`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconList',
      isNullable: false,
    }),
    originalFilename: createField({
      fieldName: 'originalFilename',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Original filename`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Original filename`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconFile',
      isNullable: true,
    }),
    checksum: createField({
      fieldName: 'checksum',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Checksum`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Checksum`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: true,
    }),
    payloadDigest: createField({
      fieldName: 'payloadDigest',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Payload digest`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Digest of imported rows and options`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'Icon123',
      isNullable: true,
    }),
    status: createField({
      fieldName: 'status',
      type: FieldMetadataType.TEXT,
      label: i18nLabel(
        msg({ message: `Status`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Status`, context: 'fieldMetadata.description' }),
      ),
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: "'PENDING'",
    }),
    overrideDuplicates: createField({
      fieldName: 'overrideDuplicates',
      type: FieldMetadataType.BOOLEAN,
      label: i18nLabel(
        msg({ message: `Override duplicates`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Override duplicates`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconRefresh',
      isNullable: false,
      defaultValue: false,
    }),
    totalRows: createField({
      fieldName: 'totalRows',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Total rows`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Total rows`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: false,
      defaultValue: 0,
    }),
    mappedColumnCount: createField({
      fieldName: 'mappedColumnCount',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Mapped columns`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({
          message: `Number of CSV columns mapped to contact fields`,
          context: 'fieldMetadata.description',
        }),
      ),
      icon: 'IconColumns',
      isNullable: false,
      defaultValue: 0,
    }),
    createdRows: createField({
      fieldName: 'createdRows',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Created rows`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Created rows`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: false,
      defaultValue: 0,
    }),
    updatedRows: createField({
      fieldName: 'updatedRows',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Updated rows`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Updated rows`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: false,
      defaultValue: 0,
    }),
    skippedRows: createField({
      fieldName: 'skippedRows',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Skipped rows`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Skipped rows`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: false,
      defaultValue: 0,
    }),
    errorRows: createField({
      fieldName: 'errorRows',
      type: FieldMetadataType.NUMBER,
      label: i18nLabel(
        msg({ message: `Error rows`, context: 'fieldMetadata.label' }),
      ),
      description: i18nLabel(
        msg({ message: `Error rows`, context: 'fieldMetadata.description' }),
      ),
      icon: 'Icon123',
      isNullable: false,
      defaultValue: 0,
    }),
    messageList: createStandardRelationFieldFlatMetadata({
      ...args,
      context: {
        fieldName: 'messageList',
        type: FieldMetadataType.RELATION,
        morphId: null,
        label: i18nLabel(
          msg({ message: `Group`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({ message: `Group`, context: 'fieldMetadata.description' }),
        ),
        icon: 'IconLink',
        isNullable: false,
        targetObjectName: 'messageList',
        targetFieldName: 'importBatches',
        settings: {
          relationType: RelationType.MANY_TO_ONE,
          onDelete: RelationOnDeleteAction.RESTRICT,
          joinColumnName: 'messageListId',
        },
      },
    }),
    rows: createStandardRelationFieldFlatMetadata({
      ...args,
      context: {
        fieldName: 'rows',
        type: FieldMetadataType.RELATION,
        morphId: null,
        label: i18nLabel(
          msg({ message: `Rows`, context: 'fieldMetadata.label' }),
        ),
        description: i18nLabel(
          msg({ message: `Rows`, context: 'fieldMetadata.description' }),
        ),
        icon: 'IconLink',
        isNullable: true,
        targetObjectName: 'importRowResult',
        targetFieldName: 'importBatch',
        settings: { relationType: RelationType.ONE_TO_MANY },
      },
    }),
  };
};
