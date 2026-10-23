import { OpportunityContactDetails } from '@/object-record/record-show/components/OpportunityContactDetails';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { render, screen } from '@testing-library/react';

const mockUseFindOneRecord = jest.fn();
const mockUseAtomFamilySelectorValue = jest.fn();

jest.mock('@/object-record/hooks/useFindOneRecord', () => ({
  useFindOneRecord: (...args: unknown[]) => mockUseFindOneRecord(...args),
}));

jest.mock(
  '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue',
  () => ({
    useAtomFamilySelectorValue: (...args: unknown[]) =>
      mockUseAtomFamilySelectorValue(...args),
  }),
);

describe('OpportunityContactDetails', () => {
  it('shows the linked Person details and refreshes when those details change', () => {
    mockUseAtomFamilySelectorValue.mockReturnValue('person-1');
    mockUseFindOneRecord.mockReturnValue({
      record: {
        name: { firstName: 'Ada', lastName: 'Lovelace' },
        phones: { primaryPhoneNumber: '555-0100' },
        emails: { primaryEmail: 'ada@example.com' },
        propertyAddress: {
          addressStreet1: '123 Main St',
          addressCity: 'Albany',
          addressState: 'NY',
          addressPostcode: '12207',
        },
      },
    });

    const { rerender } = render(
      <I18nProvider i18n={i18n}>
        <OpportunityContactDetails opportunityId="opportunity-1" />
      </I18nProvider>,
    );

    expect(mockUseFindOneRecord).toHaveBeenCalledWith({
      objectNameSingular: 'person',
      objectRecordId: 'person-1',
    });
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();

    mockUseFindOneRecord.mockReturnValue({
      record: {
        name: { firstName: 'Ada', lastName: 'Lovelace' },
        phones: { primaryPhoneNumber: '555-0199' },
        emails: { primaryEmail: 'ada@example.com' },
        propertyAddress: {
          addressStreet1: '456 Oak St',
          addressCity: 'Albany',
          addressState: 'NY',
          addressPostcode: '12207',
        },
      },
    });

    rerender(
      <I18nProvider i18n={i18n}>
        <OpportunityContactDetails opportunityId="opportunity-1" />
      </I18nProvider>,
    );

    expect(screen.getByText('555-0199')).toBeInTheDocument();
    expect(screen.getByText('456 Oak St')).toBeInTheDocument();
  });
});
