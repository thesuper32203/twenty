import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { HomeownerImportRowInput } from 'src/modules/wholesale-import/dtos/homeowner-import-row.input';

@InputType('PreviewHomeownerImportInput')
export class PreviewHomeownerImportInput {
  @Field()
  @IsString()
  @MaxLength(255)
  groupName: string;

  @Field(() => Boolean)
  @IsBoolean()
  overrideDuplicates: boolean;

  @Field(() => [HomeownerImportRowInput])
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => HomeownerImportRowInput)
  rows: HomeownerImportRowInput[];
}

@InputType('CommitHomeownerImportInput')
export class CommitHomeownerImportInput extends PreviewHomeownerImportInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  totalRows?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  mappedColumnCount?: number;

  @Field(() => Boolean)
  @IsBoolean()
  createOpportunities: boolean;

  @Field()
  @IsString()
  @MaxLength(255)
  idempotencyKey: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  originalFilename?: string;
}
