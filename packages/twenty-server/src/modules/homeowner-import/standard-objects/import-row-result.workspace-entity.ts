import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ImportBatchWorkspaceEntity } from 'src/modules/homeowner-import/standard-objects/import-batch.workspace-entity';

export class ImportRowResultWorkspaceEntity extends BaseWorkspaceEntity {
  importBatch: EntityRelation<ImportBatchWorkspaceEntity>;
  importBatchId: string;
  rowNumber: number;
  outcome: string;
  reason: string | null;
  normalizedPhone: string | null;
  personId: string | null;
  propertyId: string | null;
  opportunityId: string | null;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  searchVector: string;
}
