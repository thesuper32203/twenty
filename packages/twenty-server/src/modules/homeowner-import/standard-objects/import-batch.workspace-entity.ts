import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type ImportRowResultWorkspaceEntity } from 'src/modules/homeowner-import/standard-objects/import-row-result.workspace-entity';
import { type MessageListWorkspaceEntity } from 'src/modules/emailing/standard-objects/message-list.workspace-entity';

export class ImportBatchWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  originalFilename: string | null;
  checksum: string | null;
  payloadDigest: string | null;
  status: string;
  overrideDuplicates: boolean;
  messageList: EntityRelation<MessageListWorkspaceEntity>;
  messageListId: string;
  totalRows: number;
  mappedColumnCount: number;
  createdRows: number;
  updatedRows: number;
  skippedRows: number;
  errorRows: number;
  rows: EntityRelation<ImportRowResultWorkspaceEntity[]>;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  searchVector: string;
}
