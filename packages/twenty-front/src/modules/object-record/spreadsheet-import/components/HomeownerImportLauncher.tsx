import { gql } from '@apollo/client';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useApolloClient } from '@apollo/client/react';
import { type ReactNode, useState } from 'react';
import { getToastOptionsFromError } from '@/error-handler/utils/getToastOptionsFromError';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import {
  buildHomeownerImportRows,
  type HomeownerImportRow,
  withHomeownerSourceRowNumbers,
} from '@/object-record/spreadsheet-import/utils/buildHomeownerImportRows';
import { useOpenSpreadsheetImportDialog } from '@/spreadsheet-import/hooks/useOpenSpreadsheetImportDialog';
import { SpreadsheetColumnType } from '@/spreadsheet-import/types/SpreadsheetColumnType';
import {
  type ImportedRow,
  type SpreadsheetImportFields,
} from '@/spreadsheet-import/types';
import { useDialogManager } from '@/ui/feedback/dialog-manager/hooks/useDialogManager';
import { TextInput } from '@/ui/input/components/TextInput';
import { DialogInstance } from '@/ui/layout/dialog/components/DialogInstance';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { isNonEmptyString } from '@sniptt/guards';
import { useToast } from 'twenty-ui/components/feedback';
import { Button, Switch } from 'twenty-ui/primitives/input';
import { Dialog } from 'twenty-ui/primitives/surfaces';
import { themeCssVariables } from 'twenty-ui/theme';

const HOMEOWNER_IMPORT_SETTINGS_DIALOG_ID = 'homeowner-import-settings-dialog';
const HOMEOWNER_IMPORT_MAX_ROWS = 100_000;
const HOMEOWNER_IMPORT_CHUNK_SIZE = 500;

const PREVIEW_HOMEOWNER_IMPORT = gql`
  mutation PreviewHomeownerImport($input: PreviewHomeownerImportInput!) {
    previewHomeownerImport(input: $input) {
      rows {
        rowNumber
        outcome
        reason
        personId
      }
      counts {
        create
        update
        skip
        review
        error
      }
    }
  }
`;

const COMMIT_HOMEOWNER_IMPORT = gql`
  mutation CommitHomeownerImport($input: CommitHomeownerImportInput!) {
    commitHomeownerImport(input: $input) {
      batchId
      groupId
      counts {
        create
        update
        skip
        review
        error
      }
    }
  }
`;

type ImportCounts = {
  create: number;
  update: number;
  skip: number;
  review: number;
  error: number;
};

type ImportPreview = {
  rows: { rowNumber: number; outcome: string; reason?: string | null }[];
  counts: ImportCounts;
};

const getIdempotencyKey = async (
  file: File,
  groupName: string,
  overrideDuplicates: boolean,
  createOpportunities: boolean,
  mappedColumnCount: number,
  rows: HomeownerImportRow[],
) => {
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const optionsBytes = new TextEncoder().encode(
    JSON.stringify({
      importProtocol: 2,
      groupName: groupName.trim(),
      overrideDuplicates,
      createOpportunities,
      mappedColumnCount,
      rows,
    }),
  );
  const input = new Uint8Array(fileBytes.length + optionsBytes.length);
  input.set(fileBytes);
  input.set(optionsBytes, fileBytes.length);
  const digest = await crypto.subtle.digest('SHA-256', input);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

const StyledFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
`;

const StyledSwitchRow = styled.label`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledPreviewRows = styled.div`
  max-height: 220px;
  overflow: auto;
`;

const StyledProgress = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  bottom: ${themeCssVariables.spacing[4]};
  left: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[3]};
  position: fixed;
  z-index: 1000;
`;

type PendingImport = {
  groupName: string;
  overrideDuplicates: boolean;
  createOpportunities: boolean;
  rows: HomeownerImportRow[];
  originalFilename: string;
  idempotencyKey: string;
  mappedColumnCount: number;
  nextOffset: number;
};

const HOMEOWNER_IMPORT_FIELDS: SpreadsheetImportFields = [
  {
    key: 'firstName',
    label: t`First name`,
    Icon: null,
    fieldMetadataItemId: 'firstName',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['First Name', 'Owner First Name'],
  },
  {
    key: 'lastName',
    label: t`Last name`,
    Icon: null,
    fieldMetadataItemId: 'lastName',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['Last Name', 'Owner Last Name'],
  },
  {
    key: 'phone',
    label: t`Phone`,
    Icon: null,
    fieldMetadataItemId: 'phone',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['Phone 1', 'Owner Phone', 'Mobile'],
    fieldValidationDefinitions: [{ rule: 'required' }],
  },
  {
    key: 'email',
    label: t`Email`,
    Icon: null,
    fieldMetadataItemId: 'email',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
  },
  {
    key: 'propertyAddress',
    label: t`Property address`,
    Icon: null,
    fieldMetadataItemId: 'propertyAddress',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['Property/Street Address', 'Street Address', 'Address'],
    fieldValidationDefinitions: [{ rule: 'required' }],
  },
  {
    key: 'city',
    label: t`City`,
    Icon: null,
    fieldMetadataItemId: 'city',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['Property City'],
  },
  {
    key: 'state',
    label: t`State`,
    Icon: null,
    fieldMetadataItemId: 'state',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['Property State'],
  },
  {
    key: 'postalCode',
    label: t`ZIP code`,
    Icon: null,
    fieldMetadataItemId: 'postalCode',
    fieldType: { type: 'input' },
    fieldMetadataType: FieldMetadataType.TEXT,
    isNestedField: false,
    alternateMatches: ['ZIP', 'Property ZIP', 'Postal Code'],
  },
];

type HomeownerImportLauncherProps = {
  children: (openImport: () => void) => ReactNode;
};

export const HomeownerImportLauncher = ({
  children,
}: HomeownerImportLauncherProps) => {
  const { t } = useLingui();
  const { openDialog, closeDialog } = useDialog();
  const { enqueueDialog } = useDialogManager();
  const { enqueueToast } = useToast();
  const apolloMetadataClient = useApolloClient();
  const { openSpreadsheetImportDialog } = useOpenSpreadsheetImportDialog();
  const [groupName, setGroupName] = useState('');
  const [overrideDuplicates, setOverrideDuplicates] = useState(false);
  const [createOpportunities, setCreateOpportunities] = useState(true);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );
  const [isImporting, setIsImporting] = useState(false);

  const commit = async (job: PendingImport) => {
    setIsImporting(true);
    try {
      let counts: ImportCounts | null = null;
      for (
        let offset = job.nextOffset;
        offset < job.rows.length;
        offset += HOMEOWNER_IMPORT_CHUNK_SIZE
      ) {
        const result = await apolloMetadataClient.mutate<{
          commitHomeownerImport: { counts: ImportCounts; groupId: string };
        }>({
          mutation: COMMIT_HOMEOWNER_IMPORT,
          variables: {
            input: {
              groupName: job.groupName,
              originalFilename: job.originalFilename,
              idempotencyKey: job.idempotencyKey,
              rows: job.rows.slice(
                offset,
                offset + HOMEOWNER_IMPORT_CHUNK_SIZE,
              ),
              totalRows: job.rows.length,
              offset,
              overrideDuplicates: job.overrideDuplicates,
              createOpportunities: job.createOpportunities,
              mappedColumnCount: job.mappedColumnCount,
            },
          },
        });
        const importResult = result.data?.commitHomeownerImport;
        if (!importResult) {
          throw new Error(t`Import result was empty`);
        }
        counts = importResult.counts;
        setPendingImport({
          ...job,
          nextOffset: Math.min(
            offset + HOMEOWNER_IMPORT_CHUNK_SIZE,
            job.rows.length,
          ),
        });
      }
      if (!counts) {
        throw new Error(t`Import result was empty`);
      }
      setPendingImport(null);
      enqueueToast({
        status: 'success',
        children: t`Imported ${counts.create} owners. Updated ${counts.update}; skipped ${counts.skip}; review or errors ${counts.error}.`,
      });
      await apolloMetadataClient.refetchQueries({ include: 'active' });
    } catch (error) {
      enqueueToast(getToastOptionsFromError({ error }));
    } finally {
      setIsImporting(false);
    }
  };

  const openImportWizard = () => {
    if (!isNonEmptyString(groupName.trim())) {
      return;
    }
    closeDialog(HOMEOWNER_IMPORT_SETTINGS_DIALOG_ID);
    let uploadedRows: ImportedRow[] = [];
    let firstDataRowNumber = 2;
    let mappedColumnCount = 0;
    openSpreadsheetImportDialog({
      spreadsheetImportFields: HOMEOWNER_IMPORT_FIELDS,
      availableFieldMetadataItems: [],
      maxRecords: HOMEOWNER_IMPORT_MAX_ROWS,
      selectHeader: true,
      submitBeforeImportStep: true,
      invalidRowsSubmitMessage: t`Rows with errors will appear as errors in the import preview and history.`,
      uploadStepHook: async (rows) => {
        uploadedRows = rows;
        return rows;
      },
      selectHeaderStepHook: async (headerRow, importedRows) => {
        firstDataRowNumber = Math.max(uploadedRows.indexOf(headerRow), 0) + 2;
        return { headerRow, importedRows };
      },
      matchColumnsStepHook: async (rows, _importedRows, columns) => {
        mappedColumnCount = columns.filter(
          (column) =>
            column.type === SpreadsheetColumnType.matched ||
            column.type === SpreadsheetColumnType.matchedCheckbox ||
            column.type === SpreadsheetColumnType.matchedSelect ||
            column.type === SpreadsheetColumnType.matchedSelectOptions,
        ).length;
        return withHomeownerSourceRowNumbers(rows, firstDataRowNumber);
      },
      onSubmit: async ({ allStructuredRows }, file) => {
        const rows = buildHomeownerImportRows(
          allStructuredRows.map((row) => ({
            __sourceRowNumber: row.__sourceRowNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            phone: row.phone,
            email: row.email,
            propertyAddress: row.propertyAddress,
            city: row.city,
            state: row.state,
            postalCode: row.postalCode,
          })),
        );
        try {
          const idempotencyKey = await getIdempotencyKey(
            file,
            groupName,
            overrideDuplicates,
            createOpportunities,
            mappedColumnCount,
            rows,
          );
          const previewRows = rows.slice(0, HOMEOWNER_IMPORT_CHUNK_SIZE);
          const result = await apolloMetadataClient.mutate<{
            previewHomeownerImport: ImportPreview;
          }>({
            mutation: PREVIEW_HOMEOWNER_IMPORT,
            variables: {
              input: {
                groupName: groupName.trim(),
                rows: previewRows,
                overrideDuplicates,
              },
            },
          });
          const preview = result.data?.previewHomeownerImport;
          if (!preview) {
            throw new Error(t`Import preview was empty`);
          }
          enqueueDialog({
            title: t`Review homeowner import`,
            message: t`Group: ${groupName}. Previewing the first ${previewRows.length} of ${rows.length} rows: create ${preview.counts.create}; update ${preview.counts.update}; skip ${preview.counts.skip}; review ${preview.counts.review}; errors ${preview.counts.error}. Skipped existing owners will still join this group.`,
            children: (
              <StyledPreviewRows>
                {preview.rows.map((row) => (
                  <div key={row.rowNumber}>
                    {t`Row ${row.rowNumber}: ${row.outcome}`}
                    {row.reason ? ` — ${row.reason}` : ''}
                  </div>
                ))}
              </StyledPreviewRows>
            ),
            buttons: [
              { title: t`Cancel` },
              {
                title: t`Import`,
                role: 'confirm',
                variant: 'solid',
                onClick: () => {
                  const job = {
                    groupName: groupName.trim(),
                    overrideDuplicates,
                    createOpportunities,
                    rows,
                    originalFilename: file.name,
                    idempotencyKey,
                    mappedColumnCount,
                    nextOffset: 0,
                  };
                  setPendingImport(job);
                  void commit(job);
                },
              },
            ],
          });
        } catch (error) {
          enqueueToast(getToastOptionsFromError({ error }));
          return false;
        }
      },
    });
  };

  return (
    <>
      {pendingImport && (
        <StyledProgress>
          <span>
            {t`Importing ${pendingImport.originalFilename}: ${pendingImport.nextOffset} of ${pendingImport.rows.length} rows saved`}
          </span>
          {!isImporting &&
            pendingImport.nextOffset < pendingImport.rows.length && (
              <Button
                variant="solid"
                onClick={() => void commit(pendingImport)}
              >
                {t`Retry import`}
              </Button>
            )}
        </StyledProgress>
      )}
      {children(() => {
        if (!pendingImport) {
          openDialog(HOMEOWNER_IMPORT_SETTINGS_DIALOG_ID);
        }
      })}
      <DialogInstance
        dialogId={HOMEOWNER_IMPORT_SETTINGS_DIALOG_ID}
        dismissible
      >
        {({ onKeyDown }) => (
          <Dialog.Popup onKeyDown={onKeyDown} size="sm">
            <Dialog.Header>
              <Dialog.Title>{t`Import homeowners`}</Dialog.Title>
              <Dialog.Description>
                {t`Name this upload or reuse a group. Its owners can be filtered and selected for future campaigns.`}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              <StyledFields>
                <TextInput
                  label={t`Upload group name`}
                  value={groupName}
                  onChange={setGroupName}
                  required
                  fullWidth
                />
                <StyledSwitchRow>
                  <Switch
                    checked={overrideDuplicates}
                    onCheckedChange={setOverrideDuplicates}
                  />
                  <span>{t`Override existing contacts matched by phone`}</span>
                </StyledSwitchRow>
                <StyledSwitchRow>
                  <Switch
                    checked={createOpportunities}
                    onCheckedChange={setCreateOpportunities}
                  />
                  <span>{t`Create opportunities for imported owners`}</span>
                </StyledSwitchRow>
              </StyledFields>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={() => closeDialog(HOMEOWNER_IMPORT_SETTINGS_DIALOG_ID)}
              >
                {t`Cancel`}
              </Button>
              <Button
                variant="solid"
                disabled={!isNonEmptyString(groupName.trim())}
                onClick={openImportWizard}
              >
                {t`Choose CSV`}
              </Button>
            </Dialog.Footer>
          </Dialog.Popup>
        )}
      </DialogInstance>
    </>
  );
};
