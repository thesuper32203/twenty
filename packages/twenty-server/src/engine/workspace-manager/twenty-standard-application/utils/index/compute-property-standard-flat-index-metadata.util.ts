import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import { IndexType } from 'twenty-shared/types';
import { type CreateStandardIndexArgs, createStandardIndexFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';

export const buildPropertyStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'property'>, 'context'>,
): Record<AllStandardObjectIndexName<'property'>, FlatIndexMetadata> => ({
  normalizedAddressKeyIndex: createStandardIndexFlatMetadata({
    ...args,
    context: { indexName: 'normalizedAddressKeyIndex', relatedFieldNames: ['normalizedAddressKey'], },
  }),
  searchVectorGinIndex: createStandardIndexFlatMetadata({
    ...args,
    context: {
      indexName: 'searchVectorGinIndex',
      relatedFieldNames: ['searchVector'],
      indexType: IndexType.GIN,
      hasDeterministicUniversalIdentifier: true,
    },
  }),
});
