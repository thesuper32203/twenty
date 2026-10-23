import { type ActorMetadata, type AddressMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonPropertyWorkspaceEntity } from 'src/modules/property/standard-objects/person-property.workspace-entity';

export class PropertyWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  address: AddressMetadata;
  normalizedAddressKey: string | null;
  owners: EntityRelation<PersonPropertyWorkspaceEntity[]>;
  opportunities: EntityRelation<OpportunityWorkspaceEntity[]>;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  searchVector: string;
}
