import { FormAddressFieldInput } from '@/object-record/record-field/ui/form-types/components/FormAddressFieldInput';
import { render, screen } from '@testing-library/react';
import { Field } from 'twenty-ui/primitives/input';

jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormTextFieldInput',
  () => ({
    FormTextFieldInput: ({ label }: { label: string }) => <span>{label}</span>,
  }),
);

jest.mock(
  '@/object-record/record-field/ui/form-types/components/FormCountrySelectInput',
  () => ({
    FormCountrySelectInput: ({ label }: { label: string }) => (
      <span>{label}</span>
    ),
  }),
);

describe('FormAddressFieldInput', () => {
  it('shows only configured address parts', () => {
    render(
      <Field.Root>
        <FormAddressFieldInput
          label="Property Address"
          onChange={jest.fn()}
          subFields={[
            'addressStreet1',
            'addressCity',
            'addressState',
            'addressPostcode',
          ]}
          postcodeLabel="ZIP code"
        />
      </Field.Root>,
    );

    expect(screen.getByText('Address 1')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('ZIP code')).toBeInTheDocument();
    expect(screen.queryByText('Address 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Country')).not.toBeInTheDocument();
  });
});
