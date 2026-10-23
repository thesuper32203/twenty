import { UseGuards, UsePipes } from '@nestjs/common';
import { Args, Mutation, Query } from '@nestjs/graphql';

import { MetadataResolver } from 'src/engine/api/graphql/graphql-config/decorators/metadata-resolver.decorator';
import { getWorkspaceAuthContext } from 'src/engine/core-modules/auth/storage/workspace-auth-context.storage';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { AuthPrincipalGuard } from 'src/engine/guards/auth-principal.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import {
  CommitHomeownerImportInput,
  PreviewHomeownerImportInput,
} from 'src/modules/wholesale-import/dtos/homeowner-import.input';
import {
  HomeownerImportHistoryItemDTO,
  HomeownerImportPreviewDTO,
  HomeownerImportResultDTO,
} from 'src/modules/wholesale-import/dtos/homeowner-import-result.dto';
import { HomeownerImportService } from 'src/modules/wholesale-import/services/homeowner-import.service';

@MetadataResolver()
@UseGuards(
  AuthPrincipalGuard({
    userSession: {
      standard: true,
      impersonated: true,
      playground: true,
      workspaceAgnostic: false,
    },
    apiKey: false,
    oauthClient: false,
    application: false,
  }),
)
@UsePipes(ResolverValidationPipe)
export class HomeownerImportResolver {
  constructor(
    private readonly homeownerImportService: HomeownerImportService,
  ) {}

  @Query(() => [HomeownerImportHistoryItemDTO])
  @UseGuards(NoPermissionGuard)
  async homeownerImportHistory(): Promise<HomeownerImportHistoryItemDTO[]> {
    return this.homeownerImportService.history(getWorkspaceAuthContext());
  }

  @Mutation(() => HomeownerImportPreviewDTO)
  @UseGuards(NoPermissionGuard)
  async previewHomeownerImport(
    @Args('input') input: PreviewHomeownerImportInput,
  ): Promise<HomeownerImportPreviewDTO> {
    return this.homeownerImportService.preview(
      input,
      getWorkspaceAuthContext(),
    );
  }

  @Mutation(() => HomeownerImportResultDTO)
  @UseGuards(NoPermissionGuard)
  async commitHomeownerImport(
    @Args('input') input: CommitHomeownerImportInput,
  ): Promise<HomeownerImportResultDTO> {
    return this.homeownerImportService.commit(input, getWorkspaceAuthContext());
  }
}
