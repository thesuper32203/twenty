import { type ImportedStructuredRow } from '@/spreadsheet-import/types/SpreadsheetImportImportedStructuredRow';

type HomeownerImportSourceRow = {
  __sourceRowNumber?: string | boolean;
  firstName?: string | boolean;
  lastName?: string | boolean;
  phone?: string | boolean;
  email?: string | boolean;
  propertyAddress?: string | boolean;
  city?: string | boolean;
  state?: string | boolean;
  postalCode?: string | boolean;
};

export type HomeownerImportRow = {
  rowNumber: number;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  propertyAddress: string;
  city?: string;
  state?: string;
  postalCode?: string;
};

const stringValue = (value: string | boolean | undefined) =>
  typeof value === 'string' ? value.trim() : undefined;

export const withHomeownerSourceRowNumbers = (
  rows: ImportedStructuredRow[],
  firstDataRowNumber: number,
): ImportedStructuredRow[] =>
  rows.map((row, index) => ({
    ...row,
    __sourceRowNumber: String(firstDataRowNumber + index),
  }));

export const buildHomeownerImportRows = (
  rows: HomeownerImportSourceRow[],
): HomeownerImportRow[] =>
  rows.map((row, index) => ({
    rowNumber: Number(row.__sourceRowNumber) || index + 2,
    firstName: stringValue(row.firstName),
    lastName: stringValue(row.lastName),
    phone: stringValue(row.phone) ?? '',
    email: stringValue(row.email),
    propertyAddress: stringValue(row.propertyAddress) ?? '',
    city: stringValue(row.city),
    state: stringValue(row.state),
    postalCode: stringValue(row.postalCode),
  }));
