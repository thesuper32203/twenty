import {
  buildHomeownerImportRows,
  withHomeownerSourceRowNumbers,
} from '@/object-record/spreadsheet-import/utils/buildHomeownerImportRows';

describe('buildHomeownerImportRows', () => {
  it('keeps the source row number and trims mapped owner fields', () => {
    expect(
      buildHomeownerImportRows([
        {
          __sourceRowNumber: '4',
          firstName: ' Ada ',
          phone: ' (212) 555-0101 ',
          propertyAddress: ' 10 Main Street ',
          city: ' New York ',
        },
      ]),
    ).toEqual([
      {
        rowNumber: 4,
        firstName: 'Ada',
        lastName: undefined,
        phone: '(212) 555-0101',
        email: undefined,
        propertyAddress: '10 Main Street',
        city: 'New York',
        state: undefined,
        postalCode: undefined,
      },
    ]);
  });

  it('keeps file row numbers after a selected header and validation row removal', () => {
    const rows = withHomeownerSourceRowNumbers(
      [
        { phone: '111', propertyAddress: '1 Main' },
        { phone: '', propertyAddress: '2 Main' },
        { phone: '333', propertyAddress: '3 Main' },
      ],
      4,
    );

    expect(
      buildHomeownerImportRows([rows[0], rows[2]]).map((row) => row.rowNumber),
    ).toEqual([4, 6]);
  });

  it('keeps an invalid row for the server to record as an error', () => {
    const rows = withHomeownerSourceRowNumbers(
      [{ phone: '', propertyAddress: '2 Main' }],
      5,
    );

    expect(buildHomeownerImportRows(rows)).toEqual([
      {
        rowNumber: 5,
        firstName: undefined,
        lastName: undefined,
        phone: '',
        email: undefined,
        propertyAddress: '2 Main',
        city: undefined,
        state: undefined,
        postalCode: undefined,
      },
    ]);
  });
});
