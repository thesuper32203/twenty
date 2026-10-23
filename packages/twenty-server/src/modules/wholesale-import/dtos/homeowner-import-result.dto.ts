import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('HomeownerImportCounts')
export class HomeownerImportCountsDTO {
  @Field(() => Int)
  create: number;

  @Field(() => Int)
  update: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  review: number;

  @Field(() => Int)
  error: number;
}

@ObjectType('HomeownerImportRowResult')
export class HomeownerImportRowResultDTO {
  @Field(() => Int)
  rowNumber: number;

  @Field()
  outcome: string;

  @Field(() => String, { nullable: true })
  reason: string | null;

  @Field(() => String, { nullable: true })
  personId: string | null;
}

@ObjectType('HomeownerImportPreview')
export class HomeownerImportPreviewDTO {
  @Field(() => HomeownerImportCountsDTO)
  counts: HomeownerImportCountsDTO;

  @Field(() => [HomeownerImportRowResultDTO])
  rows: HomeownerImportRowResultDTO[];
}

@ObjectType('HomeownerImportResult')
export class HomeownerImportResultDTO extends HomeownerImportPreviewDTO {
  @Field()
  batchId: string;

  @Field()
  groupId: string;
}

@ObjectType('HomeownerImportHistoryItem')
export class HomeownerImportHistoryItemDTO {
  @Field()
  id: string;

  @Field()
  groupId: string;

  @Field()
  groupName: string;

  @Field(() => String, { nullable: true })
  originalFilename: string | null;

  @Field()
  status: string;

  @Field(() => Int)
  totalRows: number;

  @Field(() => Int)
  uniqueNumbers: number;

  @Field(() => Int)
  mappedColumnCount: number;

  @Field(() => Int)
  errorRows: number;

  @Field(() => Int)
  duplicateRows: number;

  @Field()
  createdAt: Date;
}
