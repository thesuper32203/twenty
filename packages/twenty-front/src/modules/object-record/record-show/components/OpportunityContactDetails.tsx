import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { type FieldAddressValue } from '@/object-record/record-field/ui/types/FieldMetadata';
import { recordStoreFamilySelector } from '@/object-record/record-store/states/selectors/recordStoreFamilySelector';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilySelectorValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import {
  CoreObjectNameSingular,
  type EmailsMetadata,
  type FullNameMetadata,
  type PhonesMetadata,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { themeCssVariables } from 'twenty-ui/theme';

type PersonContactRecord = ObjectRecord & {
  name?: FullNameMetadata | null;
  phones?: PhonesMetadata | null;
  emails?: EmailsMetadata | null;
  propertyAddress?: FieldAddressValue | null;
};

const StyledContainer = styled.section`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  margin: ${themeCssVariables.spacing[4]};
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: 14px;
  margin: 0 0 ${themeCssVariables.spacing[3]};
`;

const StyledDetails = styled.dl`
  display: grid;
  gap: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  margin: 0;
`;

const StyledDetail = styled.div`
  min-width: 0;
`;

const StyledLabel = styled.dt`
  color: ${themeCssVariables.font.color.secondary};
  font-size: 12px;
`;

const StyledValue = styled.dd`
  color: ${themeCssVariables.font.color.primary};
  margin: ${themeCssVariables.spacing[1]} 0 0;
  overflow-wrap: anywhere;
`;

export const OpportunityContactDetails = ({
  opportunityId,
}: {
  opportunityId: string;
}) => {
  const { t } = useLingui();
  const pointOfContactId = useAtomFamilySelectorValue(
    recordStoreFamilySelector,
    {
      recordId: opportunityId,
      fieldName: 'pointOfContactId',
    },
  ) as string | null;
  const { record: person } = useFindOneRecord<PersonContactRecord>({
    objectNameSingular: CoreObjectNameSingular.Person,
    objectRecordId: pointOfContactId ?? undefined,
  });

  if (!isDefined(pointOfContactId) || !isDefined(person)) {
    return null;
  }

  const fields = [
    { label: t`First name`, value: person?.name?.firstName },
    { label: t`Last name`, value: person?.name?.lastName },
    { label: t`Phone number`, value: person?.phones?.primaryPhoneNumber },
    { label: t`Email`, value: person?.emails?.primaryEmail },
    {
      label: t`Property address`,
      value: person?.propertyAddress?.addressStreet1,
    },
    { label: t`City`, value: person?.propertyAddress?.addressCity },
    { label: t`State`, value: person?.propertyAddress?.addressState },
    { label: t`ZIP code`, value: person?.propertyAddress?.addressPostcode },
  ];

  return (
    <StyledContainer aria-label={t`Contact details`}>
      <StyledTitle>{t`Contact details`}</StyledTitle>
      <StyledDetails>
        {fields.map(({ label, value }) => (
          <StyledDetail key={label}>
            <StyledLabel>{label}</StyledLabel>
            <StyledValue>{value || '—'}</StyledValue>
          </StyledDetail>
        ))}
      </StyledDetails>
    </StyledContainer>
  );
};
