import { STANDARD_OBJECTS } from 'twenty-shared/metadata';

import { computeTwentyStandardApplicationAllFlatEntityMaps } from 'src/engine/workspace-manager/twenty-standard-application/utils/twenty-standard-application-all-flat-entity-maps.constant';

describe('wholesale first-slice standard metadata', () => {
  const { allFlatEntityMaps } = computeTwentyStandardApplicationAllFlatEntityMaps({
    now: '2024-01-01T00:00:00.000Z',
    workspaceId: '20202020-1111-4111-8111-111111111111',
    twentyStandardApplicationId: '20202020-2222-4222-8222-222222222222',
  });

  it('creates addressable Property, owner link, and import history objects', () => {
    for (const objectName of ['property', 'personProperty', 'importBatch', 'importRowResult'] as const) {
      expect(
        allFlatEntityMaps.flatObjectMetadataMaps.byUniversalIdentifier[
          STANDARD_OBJECTS[objectName].universalIdentifier
        ],
      ).toBeDefined();
    }

    expect(
      allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.importBatch.fields.payloadDigest.universalIdentifier
      ],
    ).toMatchObject({ name: 'payloadDigest' });
  });

  it('links Property to Opportunity and import rows to their batch', () => {
    expect(
      allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.opportunity.fields.property.universalIdentifier
      ],
    ).toMatchObject({ name: 'property' });
    expect(
      allFlatEntityMaps.flatFieldMetadataMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.importRowResult.fields.importBatch.universalIdentifier
      ],
    ).toMatchObject({ name: 'importBatch' });
    expect(
      allFlatEntityMaps.flatViewMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.property.views.allProperties.universalIdentifier
      ],
    ).toBeDefined();
  });

  it('enforces idempotent batches and one result per row', () => {
    expect(
      allFlatEntityMaps.flatIndexMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.importBatch.indexes.checksumUniqueIndex.universalIdentifier
      ],
    ).toMatchObject({ isUnique: true });
    expect(
      allFlatEntityMaps.flatIndexMaps.byUniversalIdentifier[
        STANDARD_OBJECTS.importRowResult.indexes.batchRowUniqueIndex.universalIdentifier
      ],
    ).toMatchObject({ isUnique: true });
  });
});
