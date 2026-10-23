import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ButtonHTMLAttributes } from 'react';

import { PeopleTablePagination } from '@/object-record/record-index/components/PeopleTablePagination';
import { type PeopleTablePagination as PeopleTablePaginationState } from '@/object-record/record-index/states/peopleTablePaginationComponentState';

const mockResetRecordSelection = jest.fn();

jest.mock(
  'twenty-ui/primitives/input',
  () => ({
    Button: ({
      children,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button {...props}>{children}</button>
    ),
  }),
  { virtual: true },
);

jest.mock(
  'twenty-ui/theme',
  () => ({
    themeCssVariables: {
      border: { color: { light: '#ddd' }, radius: { sm: '4px' } },
      spacing: { 1: '4px', 2: '8px' },
    },
  }),
  { virtual: true },
);

jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue',
  () => ({
    useAtomComponentStateValue: () => false,
  }),
);

jest.mock(
  '@/object-record/record-index/hooks/useRecordIndexTableLazyQuery',
  () => ({
    useRecordIndexTableLazyQuery: () => ({ queryIdentifier: 'people-query' }),
  }),
);

jest.mock(
  '@/object-record/record-index/hooks/usePeopleTablePagination',
  () => ({
    usePeopleTablePagination: () => {
      const [pagination, setPagination] = jest
        .requireActual<typeof import('react')>('react')
        .useState<PeopleTablePaginationState>({
          queryIdentifier: 'people-query',
          pageIndex: 0,
          pageSize: 20,
          totalCount: 125,
        });

      return { pagination, setPagination };
    },
  }),
);

jest.mock(
  '@/object-record/record-selection/hooks/useResetRecordSelection',
  () => ({
    useResetRecordSelection: () => ({
      resetRecordSelection: mockResetRecordSelection,
    }),
  }),
);

describe('PeopleTablePagination', () => {
  beforeEach(() => {
    mockResetRecordSelection.mockClear();
  });

  it('moves between pages of 20 records', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider i18n={i18n}>
        <PeopleTablePagination recordTableId="people-table" />
      </I18nProvider>,
    );

    expect(screen.getByText('1–20 of 125')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('21–40 of 125')).toBeInTheDocument();
    expect(mockResetRecordSelection).toHaveBeenCalledTimes(1);
  });

  it('resets to the first page when page size changes', async () => {
    const user = userEvent.setup();

    render(
      <I18nProvider i18n={i18n}>
        <PeopleTablePagination recordTableId="people-table" />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.selectOptions(screen.getByLabelText('Rows per page'), '50');

    expect(screen.getByText('1–50 of 125')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });
});
