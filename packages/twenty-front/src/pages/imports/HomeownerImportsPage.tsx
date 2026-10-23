import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Link } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { Button } from 'twenty-ui/primitives/input';
import { IconFileImport, IconUpload } from 'twenty-ui/icon';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme';

import { HomeownerImportLauncher } from '@/object-record/spreadsheet-import/components/HomeownerImportLauncher';
import { SpreadsheetImportProvider } from '@/spreadsheet-import/provider/components/SpreadsheetImportProvider';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';

const HOMEOWNER_IMPORT_HISTORY = gql`
  query HomeownerImportHistory {
    homeownerImportHistory {
      id
      groupName
      groupId
      originalFilename
      status
      totalRows
      uniqueNumbers
      mappedColumnCount
      errorRows
      duplicateRows
      createdAt
    }
  }
`;

type ImportHistoryItem = {
  id: string;
  groupName: string;
  groupId: string;
  originalFilename: string | null;
  status: string;
  totalRows: number;
  uniqueNumbers: number;
  mappedColumnCount: number;
  errorRows: number;
  duplicateRows: number;
  createdAt: string;
};

const StyledPage = styled.main`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[8]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    padding: ${themeCssVariables.spacing[4]};
  }
`;

const StyledHeader = styled.div`
  align-items: end;
  display: flex;
  justify-content: space-between;
  gap: ${themeCssVariables.spacing[4]};
  margin-bottom: ${themeCssVariables.spacing[6]};
`;

const StyledEyebrow = styled.div`
  color: ${themeCssVariables.color.blue};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

const StyledTitle = styled.h1`
  font-size: 32px;
  margin: ${themeCssVariables.spacing[2]} 0 ${themeCssVariables.spacing[1]};
`;

const StyledMuted = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  margin: 0;
`;

const StyledDropzone = styled.button`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px dashed ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  min-height: 200px;
  padding: ${themeCssVariables.spacing[6]};
  text-align: center;
  width: 100%;

  &:hover {
    border-color: ${themeCssVariables.color.blue};
  }
`;

const StyledUploadIcon = styled.span`
  align-items: center;
  background: ${themeCssVariables.background.transparent.blue};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.color.blue};
  display: flex;
  height: 48px;
  justify-content: center;
  width: 48px;
`;

const StyledSectionTitle = styled.h2`
  font-size: ${themeCssVariables.font.size.lg};
  margin: ${themeCssVariables.spacing[6]} 0 ${themeCssVariables.spacing[3]};
`;

const StyledTableScroll = styled.div`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  overflow: auto;
`;

const StyledTable = styled.table`
  border-collapse: collapse;
  min-width: 850px;
  width: 100%;

  th,
  td {
    border-bottom: 1px solid ${themeCssVariables.border.color.light};
    padding: ${themeCssVariables.spacing[4]};
    text-align: right;
  }

  th {
    background: ${themeCssVariables.background.secondary};
    color: ${themeCssVariables.font.color.secondary};
    font-size: ${themeCssVariables.font.size.sm};
    font-weight: 600;
    text-transform: uppercase;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }
`;

const StyledFile = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 220px;
`;

const StyledStatus = styled.span`
  color: ${themeCssVariables.color.green};
  font-size: ${themeCssVariables.font.size.sm};
`;

const StyledGroupLink = styled(Link)`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const HomeownerImportsPage = () => {
  const { t } = useLingui();
  const { data, loading, error } = useQuery<{
    homeownerImportHistory: ImportHistoryItem[];
  }>(HOMEOWNER_IMPORT_HISTORY, { fetchPolicy: 'cache-and-network' });
  const imports = data?.homeownerImportHistory ?? [];
  const uniqueNumbers = imports.reduce(
    (sum, item) => sum + item.uniqueNumbers,
    0,
  );
  const numberFormat = new Intl.NumberFormat();

  return (
    <SpreadsheetImportProvider>
      <PageTitle title={t`Imports`} />
      <HomeownerImportLauncher>
        {(openImport) => (
          <StyledPage>
            <StyledHeader>
              <div>
                <StyledEyebrow>{t`Contacts & Data`}</StyledEyebrow>
                <StyledTitle>{t`Imports`}</StyledTitle>
                <StyledMuted>{t`${imports.length} files imported · ${numberFormat.format(uniqueNumbers)} unique numbers kept`}</StyledMuted>
              </div>
              <Button
                variant="solid"
                startIcon={<IconUpload />}
                onClick={openImport}
              >
                {t`Upload CSV`}
              </Button>
            </StyledHeader>

            <StyledDropzone type="button" onClick={openImport}>
              <StyledUploadIcon>
                <IconFileImport size={24} />
              </StyledUploadIcon>
              <strong>{t`Upload a CSV file`}</strong>
              <StyledMuted>{t`Choose a file, map its columns, then review duplicates before anything is saved.`}</StyledMuted>
              <strong>{t`Select file`}</strong>
            </StyledDropzone>

            <StyledSectionTitle>{t`Import history`}</StyledSectionTitle>
            {loading && imports.length === 0 ? (
              <StyledMuted>{t`Loading imports…`}</StyledMuted>
            ) : error ? (
              <StyledMuted>{t`Could not load import history. Refresh to try again.`}</StyledMuted>
            ) : imports.length === 0 ? (
              <StyledMuted>{t`No imports yet. Upload a CSV to get started.`}</StyledMuted>
            ) : (
              <StyledTableScroll>
                <StyledTable>
                  <thead>
                    <tr>
                      <th>{t`File`}</th>
                      <th>{t`Rows`}</th>
                      <th>{t`Unique numbers`}</th>
                      <th>{t`Mapped columns`}</th>
                      <th>{t`Errors`}</th>
                      <th>{t`Duplicates`}</th>
                      <th>{t`Uploaded`}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {imports.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <StyledFile>
                            <strong>
                              {item.originalFilename ?? item.groupName}
                            </strong>
                            <StyledStatus>
                              {item.status === 'COMPLETED'
                                ? t`Completed`
                                : item.status}
                            </StyledStatus>
                            <StyledGroupLink
                              to={getAppPath(AppPath.RecordShowPage, {
                                objectNameSingular: 'messageList',
                                objectRecordId: item.groupId,
                              })}
                            >
                              {item.groupName}
                            </StyledGroupLink>
                          </StyledFile>
                        </td>
                        <td>{numberFormat.format(item.totalRows)}</td>
                        <td>{numberFormat.format(item.uniqueNumbers)}</td>
                        <td>{item.mappedColumnCount}</td>
                        <td>{numberFormat.format(item.errorRows)}</td>
                        <td>{numberFormat.format(item.duplicateRows)}</td>
                        <td>
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(new Date(item.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </StyledTableScroll>
            )}
          </StyledPage>
        )}
      </HomeownerImportLauncher>
    </SpreadsheetImportProvider>
  );
};
