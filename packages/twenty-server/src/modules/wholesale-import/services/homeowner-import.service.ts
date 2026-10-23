import { createHash } from 'crypto';

import { BadRequestException, Injectable } from '@nestjs/common';
import { isNonEmptyString } from '@sniptt/guards';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { In } from 'typeorm';
import { isDefined } from 'twenty-shared/utils';

import {
  type UserWorkspaceAuthContext,
  type WorkspaceAuthContext,
} from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { ActorFromAuthContextService } from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceTransactionScope } from 'src/engine/twenty-orm/types/workspace-transaction-scope.type';
import { WorkspaceOrmManager } from 'src/engine/twenty-orm/workspace-orm.manager';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { normalizePropertyAddressKey } from 'src/modules/property/utils/normalize-property-address-key.util';
import {
  type CommitHomeownerImportInput,
  type PreviewHomeownerImportInput,
} from 'src/modules/wholesale-import/dtos/homeowner-import.input';
import { type HomeownerImportRowInput } from 'src/modules/wholesale-import/dtos/homeowner-import-row.input';
import {
  type HomeownerImportCountsDTO,
  type HomeownerImportHistoryItemDTO,
  type HomeownerImportPreviewDTO,
  type HomeownerImportResultDTO,
  type HomeownerImportRowResultDTO,
} from 'src/modules/wholesale-import/dtos/homeowner-import-result.dto';

type NormalizedRow = {
  source: HomeownerImportRowInput;
  phone: string;
  nationalNumber: string;
  callingCode: string;
  countryCode: string;
  addressKey: string;
};

type ResolvedRow = HomeownerImportRowResultDTO & {
  normalizedRow?: NormalizedRow;
  person?: PersonWorkspaceEntity;
};

type MatchIndex = {
  people: Map<string, PersonWorkspaceEntity[]>;
  properties: Map<string, string[]>;
};

const blankCounts = (): HomeownerImportCountsDTO => ({
  create: 0,
  update: 0,
  skip: 0,
  review: 0,
  error: 0,
});

const countRows = (
  rows: HomeownerImportRowResultDTO[],
): HomeownerImportCountsDTO =>
  rows.reduce((counts, row) => {
    const key = row.outcome.toLowerCase() as keyof HomeownerImportCountsDTO;

    counts[key]++;

    return counts;
  }, blankCounts());

const normalizeRow = (row: HomeownerImportRowInput): NormalizedRow | null => {
  const phone = parsePhoneNumberFromString(row.phone.trim(), 'US');
  const addressKey = normalizePropertyAddressKey({
    addressStreet1: row.propertyAddress,
    addressCity: row.city,
    addressState: row.state,
    addressPostcode: row.postalCode,
  });

  if (!isDefined(phone) || !phone.isValid() || !isDefined(addressKey)) {
    return null;
  }

  return {
    source: row,
    phone: phone.number,
    nationalNumber: phone.nationalNumber,
    callingCode: `+${phone.countryCallingCode}`,
    countryCode: phone.country ?? 'US',
    addressKey,
  };
};

@Injectable()
export class HomeownerImportService {
  constructor(
    private readonly workspaceOrmManager: WorkspaceOrmManager,
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
    private readonly permissionsService: PermissionsService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  async history(
    authContext: WorkspaceAuthContext,
  ): Promise<HomeownerImportHistoryItemDTO[]> {
    this.assertUserAuthContext(authContext);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const batches = await this.workspaceOrmManager
        .getRepositoryWithContextPermissions('importBatch')
        .find({ order: { createdAt: 'DESC' }, take: 50 });
      if (batches.length === 0) {
        return [];
      }

      const summaries = await this.workspaceOrmManager
        .getRepositoryWithContextPermissions('importRowResult')
        .createQueryBuilder('row')
        .select('row.importBatchId', 'batchId')
        .addSelect('COUNT(DISTINCT row.normalizedPhone)', 'uniqueNumbers')
        .where('row.importBatchId IN (:...batchIds)', {
          batchIds: batches.map((batch) => batch.id),
        })
        .andWhere('row.personId IS NOT NULL')
        .groupBy('row.importBatchId')
        .getRawMany<{ batchId: string; uniqueNumbers: string }>();
      const uniqueByBatch = new Map(
        summaries.map((summary) => [
          summary.batchId,
          Number(summary.uniqueNumbers),
        ]),
      );

      return batches.map((batch) => {
        return {
          id: batch.id,
          groupId: batch.messageListId,
          groupName: batch.name,
          originalFilename: batch.originalFilename,
          status: batch.status,
          totalRows: Number(batch.totalRows),
          uniqueNumbers: uniqueByBatch.get(batch.id) ?? 0,
          mappedColumnCount: Number(batch.mappedColumnCount ?? 0),
          errorRows: Number(batch.errorRows),
          duplicateRows: Number(batch.skippedRows),
          createdAt: batch.createdAt,
        };
      });
    }, authContext);
  }

  async preview(
    input: PreviewHomeownerImportInput,
    authContext: WorkspaceAuthContext,
  ): Promise<HomeownerImportPreviewDTO> {
    this.assertInput(input);
    await this.assertPreviewPermissions(authContext);

    return this.workspaceOrmManager.executeInWorkspaceContext(async () => {
      const index = await this.loadMatchIndex(input.rows);
      const resolvedRows = input.rows.map((row) =>
        this.resolveRow(row, input.overrideDuplicates, index),
      );

      return { rows: resolvedRows, counts: countRows(resolvedRows) };
    }, authContext);
  }

  async commit(
    input: CommitHomeownerImportInput,
    authContext: WorkspaceAuthContext,
  ): Promise<HomeownerImportResultDTO> {
    this.assertInput(input);
    this.assertUserAuthContext(authContext);

    if (!isNonEmptyString(input.idempotencyKey.trim())) {
      throw new BadRequestException('An import idempotency key is required');
    }

    const isChunked = input.totalRows !== undefined;
    const totalRows = input.totalRows ?? input.rows.length;
    const offset = input.offset ?? 0;

    if (
      (isChunked && offset + input.rows.length > totalRows) ||
      (!isChunked && offset !== 0)
    ) {
      throw new BadRequestException('Invalid import chunk range');
    }

    const payloadDigest = createHash('sha256')
      .update(
        JSON.stringify({
          groupName: input.groupName.trim(),
          originalFilename: input.originalFilename?.trim() || null,
          overrideDuplicates: input.overrideDuplicates,
          createOpportunities: input.createOpportunities,
          mappedColumnCount: input.mappedColumnCount ?? 0,
          ...(isChunked
            ? { totalRows }
            : {
                rows: [...input.rows]
                  .sort((a, b) => a.rowNumber - b.rowNumber)
                  .map((row) => ({
                    rowNumber: row.rowNumber,
                    firstName: row.firstName?.trim() || '',
                    lastName: row.lastName?.trim() || '',
                    phone: row.phone.trim(),
                    email: row.email?.trim() || '',
                    propertyAddress: row.propertyAddress.trim(),
                    city: row.city?.trim() || '',
                    state: row.state?.trim() || '',
                    postalCode: row.postalCode?.trim() || '',
                  })),
              }),
        }),
      )
      .digest('hex');

    return this.workspaceOrmManager.executeInWorkspaceContext(
      () =>
        this.workspaceOrmManager.runInWorkspaceTransaction(async (scope) => {
          await scope.executeRawQuery(
            'SELECT pg_advisory_xact_lock(hashtext($1))',
            [`${scope.workspaceId}:${input.idempotencyKey}`],
          );

          const batchRepository =
            this.workspaceOrmManager.getRepositoryWithContextPermissions(
              'importBatch',
              scope,
            );
          const existingBatch = await batchRepository.findOne({
            where: { checksum: input.idempotencyKey },
          });

          if (isDefined(existingBatch)) {
            if (existingBatch.payloadDigest !== payloadDigest) {
              throw new BadRequestException(
                'This idempotency key was used for a different import payload',
              );
            }
            if (isChunked) {
              const processed =
                Number(existingBatch.createdRows) +
                Number(existingBatch.updatedRows) +
                Number(existingBatch.skippedRows) +
                Number(existingBatch.errorRows);
              if (
                offset > processed ||
                (offset < processed && offset + input.rows.length > processed)
              ) {
                throw new BadRequestException(
                  'Import chunks must be uploaded in order',
                );
              }
              if (offset < processed || existingBatch.status === 'COMPLETED') {
                return {
                  batchId: existingBatch.id,
                  groupId: String(existingBatch.messageListId),
                  rows: [],
                  counts: this.batchCounts(existingBatch),
                };
              }
            } else {
              const existingRows = await this.workspaceOrmManager
                .getRepositoryWithContextPermissions('importRowResult', scope)
                .find({ where: { importBatchId: existingBatch.id } });
              const rows = existingRows.map((row) => ({
                rowNumber: Number(row.rowNumber),
                outcome: String(row.outcome),
                reason: isNonEmptyString(row.reason) ? row.reason : null,
                personId: isNonEmptyString(row.personId) ? row.personId : null,
              }));

              return {
                batchId: existingBatch.id,
                groupId: String(existingBatch.messageListId),
                rows,
                counts: countRows(rows),
              };
            }
          } else if (offset !== 0) {
            throw new BadRequestException('The first import chunk is missing');
          }

          const matchKeys = input.rows.flatMap((row) => {
            const normalized = normalizeRow(row);

            return isDefined(normalized)
              ? [
                  `person:${normalized.phone}`,
                  `property:${normalized.addressKey}`,
                ]
              : [];
          });

          matchKeys.push(`group:${input.groupName.trim().toUpperCase()}`);

          for (const key of [...new Set(matchKeys)].sort()) {
            await scope.executeRawQuery(
              'SELECT pg_advisory_xact_lock(hashtext($1))',
              [`${scope.workspaceId}:${key}`],
            );
          }

          const groupId =
            existingBatch?.messageListId ??
            (await this.createGroup(
              input.groupName.trim(),
              scope,
              authContext,
            ));
          const batchId =
            existingBatch?.id ??
            (await this.insertWithActor(
              'importBatch',
              {
                name: input.groupName.trim(),
                originalFilename: input.originalFilename?.trim() || null,
                checksum: input.idempotencyKey,
                payloadDigest,
                status: 'PROCESSING',
                overrideDuplicates: input.overrideDuplicates,
                messageListId: groupId,
                totalRows,
                mappedColumnCount: input.mappedColumnCount ?? 0,
                createdRows: 0,
                updatedRows: 0,
                skippedRows: 0,
                errorRows: 0,
              },
              scope,
              authContext,
            ));
          const createdThisBatch = new Set<string>();
          if (isDefined(existingBatch)) {
            const phones = [
              ...new Set(
                input.rows
                  .map(normalizeRow)
                  .filter(isDefined)
                  .map((row) => row.phone),
              ),
            ];
            if (phones.length > 0) {
              const earlierCreatedRows = await this.workspaceOrmManager
                .getRepositoryWithContextPermissions('importRowResult', scope)
                .find({
                  where: {
                    importBatchId: batchId,
                    outcome: 'CREATE',
                    normalizedPhone: In(phones),
                  },
                });
              for (const earlierRow of earlierCreatedRows) {
                if (isNonEmptyString(earlierRow.normalizedPhone)) {
                  createdThisBatch.add(earlierRow.normalizedPhone);
                }
              }
            }
          }
          const index = await this.loadMatchIndex(input.rows, scope);
          const results: HomeownerImportRowResultDTO[] = [];

          for (const row of input.rows) {
            const resolved = this.resolveRow(
              row,
              input.overrideDuplicates,
              index,
            );
            const normalized = resolved.normalizedRow;
            const isNewPersonFromThisBatch =
              isDefined(normalized) && createdThisBatch.has(normalized.phone);

            if (
              isDefined(normalized) &&
              isNewPersonFromThisBatch &&
              (resolved.outcome === 'SKIP' || resolved.outcome === 'UPDATE')
            ) {
              resolved.outcome = 'CREATE';
              resolved.reason = null;
            }

            let personId = resolved.person?.id ?? null;
            let propertyId: string | null = null;
            let opportunityId: string | null = null;

            if (isDefined(normalized) && resolved.outcome === 'CREATE') {
              if (!isDefined(personId)) {
                personId = await this.createPerson(
                  normalized,
                  scope,
                  authContext,
                );
                createdThisBatch.add(normalized.phone);
                index.people.set(normalized.phone, [
                  { id: personId } as PersonWorkspaceEntity,
                ]);
              }
            } else if (
              isDefined(normalized) &&
              resolved.outcome === 'UPDATE' &&
              isDefined(resolved.person)
            ) {
              await this.updatePerson(
                resolved.person,
                normalized,
                scope,
                authContext,
              );
            }

            if (isDefined(personId)) {
              await this.ensureGroupMember(
                groupId,
                personId,
                scope,
                authContext,
              );
            }

            if (
              isDefined(normalized) &&
              isDefined(personId) &&
              (resolved.outcome === 'CREATE' || resolved.outcome === 'UPDATE')
            ) {
              propertyId = await this.ensureProperty(
                normalized,
                index,
                scope,
                authContext,
              );
              await this.ensureOwnerLink(
                personId,
                propertyId,
                scope,
                authContext,
              );

              if (input.createOpportunities) {
                opportunityId = await this.ensureOpportunity(
                  personId,
                  propertyId,
                  normalized,
                  scope,
                  authContext,
                );
              }
            }

            const result: HomeownerImportRowResultDTO = {
              rowNumber: row.rowNumber,
              outcome: resolved.outcome,
              reason: resolved.reason,
              personId,
            };

            results.push(result);
            await this.insertWithActor(
              'importRowResult',
              {
                importBatchId: batchId,
                rowNumber: row.rowNumber,
                outcome: result.outcome,
                reason: result.reason,
                normalizedPhone: normalized?.phone ?? null,
                personId,
                propertyId,
                opportunityId,
              },
              scope,
              authContext,
            );
          }

          const counts = countRows(results);

          const cumulative = {
            create: Number(existingBatch?.createdRows ?? 0) + counts.create,
            update: Number(existingBatch?.updatedRows ?? 0) + counts.update,
            skip: Number(existingBatch?.skippedRows ?? 0) + counts.skip,
            review: 0,
            error:
              Number(existingBatch?.errorRows ?? 0) +
              counts.error +
              counts.review,
          };
          await batchRepository.update(batchId, {
            status:
              offset + input.rows.length === totalRows
                ? 'COMPLETED'
                : 'PROCESSING',
            createdRows: cumulative.create,
            updatedRows: cumulative.update,
            skippedRows: cumulative.skip,
            errorRows: cumulative.error,
          });

          return {
            batchId,
            groupId,
            rows: results,
            counts: isChunked ? cumulative : counts,
          };
        }),
      authContext,
    );
  }

  private batchCounts(batch: {
    createdRows: number;
    updatedRows: number;
    skippedRows: number;
    errorRows: number;
  }): HomeownerImportCountsDTO {
    return {
      create: Number(batch.createdRows),
      update: Number(batch.updatedRows),
      skip: Number(batch.skippedRows),
      review: 0,
      error: Number(batch.errorRows),
    };
  }

  private assertInput(input: PreviewHomeownerImportInput): void {
    if (!isNonEmptyString(input.groupName.trim())) {
      throw new BadRequestException('An upload group name is required');
    }

    if (
      new Set(input.rows.map((row) => row.rowNumber)).size !== input.rows.length
    ) {
      throw new BadRequestException('CSV row numbers must be unique');
    }
  }

  private assertUserAuthContext(
    authContext: WorkspaceAuthContext,
  ): asserts authContext is UserWorkspaceAuthContext {
    if (authContext.type !== 'user') {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
      );
    }
  }

  private async assertPreviewPermissions(
    authContext: WorkspaceAuthContext,
  ): Promise<void> {
    this.assertUserAuthContext(authContext);

    const workspaceId = authContext.workspace.id;
    const [{ objectsPermissions }, { flatObjectMetadataMaps }] =
      await Promise.all([
        this.permissionsService.getUserWorkspacePermissions({
          workspaceId,
          userWorkspaceId: authContext.userWorkspaceId,
        }),
        this.workspaceCacheService.getOrRecompute(workspaceId, [
          'flatObjectMetadataMaps',
        ]),
      ]);

    for (const objectName of ['person', 'property']) {
      const objectMetadata = Object.values(
        flatObjectMetadataMaps.byUniversalIdentifier,
      ).find((object) => object?.nameSingular === objectName);
      const permission = isDefined(objectMetadata)
        ? objectsPermissions[objectMetadata.id]
        : undefined;

      if (!permission?.canReadObjectRecords) {
        throw new PermissionsException(
          PermissionsExceptionMessage.PERMISSION_DENIED,
          PermissionsExceptionCode.PERMISSION_DENIED,
        );
      }
    }
  }

  private resolveRow(
    row: HomeownerImportRowInput,
    overrideDuplicates: boolean,
    index: MatchIndex,
  ): ResolvedRow {
    const normalizedRow = normalizeRow(row);

    if (!isDefined(normalizedRow)) {
      return {
        rowNumber: row.rowNumber,
        outcome: 'ERROR',
        reason: 'A valid phone number and property address are required',
        personId: null,
      };
    }

    const matches = index.people.get(normalizedRow.phone) ?? [];

    if (matches.length > 1) {
      return {
        rowNumber: row.rowNumber,
        outcome: 'REVIEW',
        reason: 'More than one Person has this phone number',
        personId: null,
        normalizedRow,
      };
    }

    const person = matches[0];
    const outcome = !isDefined(person)
      ? 'CREATE'
      : overrideDuplicates
        ? 'UPDATE'
        : 'SKIP';

    if (outcome !== 'SKIP') {
      if ((index.properties.get(normalizedRow.addressKey)?.length ?? 0) > 1) {
        return {
          rowNumber: row.rowNumber,
          outcome: 'REVIEW',
          reason: 'More than one Property matches the address',
          personId: person?.id ?? null,
          normalizedRow,
          person,
        };
      }
    }

    return {
      rowNumber: row.rowNumber,
      outcome,
      reason:
        isDefined(person) && !overrideDuplicates ? 'Existing Person' : null,
      personId: person?.id ?? null,
      normalizedRow,
      person,
    };
  }

  private async loadMatchIndex(
    rows: HomeownerImportRowInput[],
    scope?: WorkspaceTransactionScope,
  ): Promise<MatchIndex> {
    const normalizedRows = rows.map(normalizeRow).filter(isDefined);
    const index: MatchIndex = { people: new Map(), properties: new Map() };

    if (normalizedRows.length === 0) {
      return index;
    }

    const nationalNumbers = [
      ...new Set(
        normalizedRows.flatMap((row) => [
          row.nationalNumber,
          `${row.callingCode.slice(1)}${row.nationalNumber}`,
        ]),
      ),
    ];
    const requestedPhones = new Set(normalizedRows.map((row) => row.phone));
    const addressKeys = [
      ...new Set(normalizedRows.map((row) => row.addressKey)),
    ];
    const personRepository =
      this.workspaceOrmManager.getRepositoryWithContextPermissions<PersonWorkspaceEntity>(
        'person',
        scope,
      );
    const people = await personRepository
      .createQueryBuilder('person')
      .where(
        `regexp_replace(COALESCE(person."phonesPrimaryPhoneNumber", ''), '[^0-9]', '', 'g') IN (:...nationalNumbers)`,
        { nationalNumbers },
      )
      .orWhere(
        `EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(person."phonesAdditionalPhones"::jsonb, '[]'::jsonb)) AS phone WHERE regexp_replace(COALESCE(phone->>'number', ''), '[^0-9]', '', 'g') IN (:...nationalNumbers))`,
        { nationalNumbers },
      )
      .getMany<PersonWorkspaceEntity>();

    for (const person of people) {
      const phoneValues = [
        {
          number: person.phones?.primaryPhoneNumber,
          callingCode: person.phones?.primaryPhoneCallingCode,
        },
        ...(person.phones?.additionalPhones ?? []),
      ];

      for (const value of phoneValues) {
        if (!isNonEmptyString(value.number)) {
          continue;
        }

        const e164 = parsePhoneNumberFromString(
          `${value.callingCode ?? ''}${value.number}`,
          'US',
        )?.number;

        if (isDefined(e164) && requestedPhones.has(e164)) {
          const matches = index.people.get(e164) ?? [];

          if (!matches.some((match) => match.id === person.id)) {
            matches.push(person);
            index.people.set(e164, matches);
          }
        }
      }
    }

    const properties = await this.workspaceOrmManager
      .getRepositoryWithContextPermissions('property', scope)
      .find({ where: { normalizedAddressKey: In(addressKeys) } });

    for (const property of properties) {
      const matches = index.properties.get(property.normalizedAddressKey) ?? [];

      matches.push(property.id);
      index.properties.set(property.normalizedAddressKey, matches);
    }

    return index;
  }

  private async insertWithActor(
    objectName: string,
    record: Record<string, unknown>,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    const [withActor] =
      await this.actorFromAuthContextService.injectActorFieldsOnCreate({
        records: [record],
        objectMetadataNameSingular: objectName,
        authContext,
      });
    const result = await this.workspaceOrmManager
      .getRepositoryWithContextPermissions(objectName, scope)
      .insert(withActor);

    return String(result.identifiers[0].id);
  }

  private async createGroup(
    groupName: string,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    const existing = await this.workspaceOrmManager
      .getRepositoryWithContextPermissions('messageList', scope)
      .find({ where: { name: groupName } });

    if (existing.length > 0) {
      if (existing.length > 1) {
        throw new BadRequestException(
          'More than one List has this import group name',
        );
      }

      const batches = await this.workspaceOrmManager
        .getRepositoryWithContextPermissions('importBatch', scope)
        .find({
          where: { messageListId: In(existing.map((list) => list.id)) },
        });
      const ownedGroupIds = [
        ...new Set(batches.map((batch) => batch.messageListId)),
      ];

      if (ownedGroupIds.length === 1) {
        return ownedGroupIds[0];
      }

      throw new BadRequestException(
        'A different List already uses this import group name',
      );
    }

    return this.insertWithActor(
      'messageList',
      { name: groupName, description: 'Homeowner import group', position: 0 },
      scope,
      authContext,
    );
  }

  private async ensureGroupMember(
    groupId: string,
    personId: string,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<void> {
    const repository =
      this.workspaceOrmManager.getRepositoryWithContextPermissions(
        'messageListMember',
        scope,
      );

    if (
      isDefined(
        await repository.findOne({ where: { listId: groupId, personId } }),
      )
    ) {
      return;
    }

    await this.insertWithActor(
      'messageListMember',
      { listId: groupId, personId, position: 0 },
      scope,
      authContext,
    );
  }

  private async createPerson(
    row: NormalizedRow,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    return this.insertWithActor(
      'person',
      {
        name: {
          firstName: row.source.firstName?.trim() ?? '',
          lastName: row.source.lastName?.trim() ?? '',
        },
        phones: {
          primaryPhoneNumber: row.nationalNumber,
          primaryPhoneCallingCode: row.callingCode,
          primaryPhoneCountryCode: row.countryCode,
          additionalPhones: null,
        },
        ...(isNonEmptyString(row.source.email?.trim())
          ? {
              emails: {
                primaryEmail: row.source.email?.trim(),
                additionalEmails: null,
              },
            }
          : {}),
        propertyAddress: this.addressValue(row.source),
      },
      scope,
      authContext,
    );
  }

  private async updatePerson(
    person: PersonWorkspaceEntity,
    row: NormalizedRow,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<void> {
    const update: Record<string, unknown> = {
      propertyAddress: {
        addressStreet1: row.source.propertyAddress.trim(),
        addressCity:
          row.source.city?.trim() || person.propertyAddress?.addressCity || '',
        addressState:
          row.source.state?.trim() ||
          person.propertyAddress?.addressState ||
          '',
        addressPostcode:
          row.source.postalCode?.trim() ||
          person.propertyAddress?.addressPostcode ||
          '',
      },
    };

    if (
      isNonEmptyString(row.source.firstName?.trim()) ||
      isNonEmptyString(row.source.lastName?.trim())
    ) {
      update.name = {
        firstName: row.source.firstName?.trim() || person.name?.firstName || '',
        lastName: row.source.lastName?.trim() || person.name?.lastName || '',
      };
    }

    if (isNonEmptyString(row.source.email?.trim())) {
      update.emails = {
        primaryEmail: row.source.email.trim(),
        additionalEmails: person.emails?.additionalEmails ?? null,
      };
    }

    const [withActor] = await this.actorFromAuthContextService.injectUpdatedBy({
      records: [update],
      objectMetadataNameSingular: 'person',
      authContext,
    });

    await this.workspaceOrmManager
      .getRepositoryWithContextPermissions('person', scope)
      .update(person.id, withActor);

    if (isDefined(update.name)) {
      person.name = update.name as PersonWorkspaceEntity['name'];
    }

    if (isDefined(update.emails)) {
      person.emails = update.emails as PersonWorkspaceEntity['emails'];
    }

    person.propertyAddress =
      update.propertyAddress as PersonWorkspaceEntity['propertyAddress'];
  }

  private addressValue(source: HomeownerImportRowInput) {
    return {
      addressStreet1: source.propertyAddress.trim(),
      addressCity: source.city?.trim() ?? '',
      addressState: source.state?.trim() ?? '',
      addressPostcode: source.postalCode?.trim() ?? '',
    };
  }

  private async ensureProperty(
    row: NormalizedRow,
    index: MatchIndex,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    const candidates = index.properties.get(row.addressKey) ?? [];

    if (isDefined(candidates[0])) {
      return candidates[0];
    }

    const propertyId = await this.insertWithActor(
      'property',
      {
        name: [
          row.source.propertyAddress.trim(),
          row.source.city?.trim(),
          row.source.state?.trim(),
          row.source.postalCode?.trim(),
        ]
          .filter(isNonEmptyString)
          .join(', '),
        address: this.addressValue(row.source),
        normalizedAddressKey: row.addressKey,
      },
      scope,
      authContext,
    );

    index.properties.set(row.addressKey, [propertyId]);

    return propertyId;
  }

  private async ensureOwnerLink(
    personId: string,
    propertyId: string,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<void> {
    const repository =
      this.workspaceOrmManager.getRepositoryWithContextPermissions(
        'personProperty',
        scope,
      );

    if (
      isDefined(
        await repository.findOne({
          where: { personId, propertyId, role: 'OWNER' },
        }),
      )
    ) {
      return;
    }

    await this.insertWithActor(
      'personProperty',
      { personId, propertyId, role: 'OWNER' },
      scope,
      authContext,
    );
  }

  private async ensureOpportunity(
    personId: string,
    propertyId: string,
    row: NormalizedRow,
    scope: WorkspaceTransactionScope,
    authContext: WorkspaceAuthContext,
  ): Promise<string> {
    const repository =
      this.workspaceOrmManager.getRepositoryWithContextPermissions(
        'opportunity',
        scope,
      );
    const existing = await repository.findOne({
      where: { pointOfContactId: personId, propertyId },
    });

    if (isDefined(existing)) {
      return existing.id;
    }

    const ownerName = [row.source.firstName, row.source.lastName]
      .filter(isNonEmptyString)
      .join(' ');

    return this.insertWithActor(
      'opportunity',
      {
        name: `${ownerName || row.phone} — ${row.source.propertyAddress.trim()}`,
        pointOfContactId: personId,
        propertyId,
        stage: 'NEW',
      },
      scope,
      authContext,
    );
  }
}
