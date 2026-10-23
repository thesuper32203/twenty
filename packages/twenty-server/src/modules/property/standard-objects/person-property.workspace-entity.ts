import { type ActorMetadata } from 'twenty-shared/types';

import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type PropertyWorkspaceEntity } from 'src/modules/property/standard-objects/property.workspace-entity';

export class PersonPropertyWorkspaceEntity extends BaseWorkspaceEntity {
  person: EntityRelation<PersonWorkspaceEntity>;
  personId: string;
  property: EntityRelation<PropertyWorkspaceEntity>;
  propertyId: string;
  role: string;
  position: number;
  createdBy: ActorMetadata;
  updatedBy: ActorMetadata;
  searchVector: string;
}
