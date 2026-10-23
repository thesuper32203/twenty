import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type AllStandardObjectIndexName } from 'src/engine/workspace-manager/twenty-standard-application/types/all-standard-object-index-name.type';
import { type CreateStandardIndexArgs, createStandardIndexFlatMetadata } from 'src/engine/workspace-manager/twenty-standard-application/utils/index/create-standard-index-flat-metadata.util';

export const buildImportBatchStandardFlatIndexMetadatas = (
  args: Omit<CreateStandardIndexArgs<'importBatch'>, 'context'>,
): Record<AllStandardObjectIndexName<'importBatch'>, FlatIndexMetadata> => ({
  messageListIndex: createStandardIndexFlatMetadata({
    ...args,
    context: { indexName: 'messageListIndex', relatedFieldNames: ['messageList'], },
  }),
  checksumUniqueIndex: createStandardIndexFlatMetadata({
    ...args,
    context: {
      indexName: 'checksumUniqueIndex',
      relatedFieldNames: ['checksum'],
      isUnique: true,
      indexWhereClause: '"deletedAt" IS NULL',
    },
  }),
});
