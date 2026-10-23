import { type FlatViewField } from 'src/engine/metadata-modules/flat-view-field/types/flat-view-field.type';
import {
  type CreateStandardViewFieldArgs,
  createStandardViewFieldFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-field/create-standard-view-field-flat-metadata.util';

export const computeStandardPropertyViewFields = (
  args: Omit<CreateStandardViewFieldArgs<'property'>, 'context'>,
): Record<string, FlatViewField> => ({
  allPropertiesName: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'property',
    context: {
      viewName: 'allProperties',
      viewFieldName: 'name',
      fieldName: 'name',
      position: 0,
      isVisible: true,
      size: 200,
    },
  }),
  allPropertiesAddress: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'property',
    context: {
      viewName: 'allProperties',
      viewFieldName: 'address',
      fieldName: 'address',
      position: 1,
      isVisible: true,
      size: 200,
    },
  }),
  allPropertiesNormalizedAddressKey: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'property',
    context: {
      viewName: 'allProperties',
      viewFieldName: 'normalizedAddressKey',
      fieldName: 'normalizedAddressKey',
      position: 2,
      isVisible: false,
      size: 150,
    },
  }),
  allPropertiesCreatedAt: createStandardViewFieldFlatMetadata({
    ...args,
    objectName: 'property',
    context: {
      viewName: 'allProperties',
      viewFieldName: 'createdAt',
      fieldName: 'createdAt',
      position: 3,
      isVisible: false,
      size: 150,
    },
  }),
});
