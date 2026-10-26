import { useTasks } from '@/activities/tasks/hooks/useTasks';
import { nextOpenTask } from '@/object-record/record-board/record-board-card/utils/nextOpenTask';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { OpportunityQuickActions } from '@/object-record/record-show/components/OpportunityQuickActions';
import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import {
  CoreObjectNameSingular,
  type FullNameMetadata,
  type PhonesMetadata,
  type AddressMetadata,
} from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';

type OpportunityCardRecord = ObjectRecord & {
  pointOfContactId?: string | null;
  propertyId?: string | null;
  pointOfContact?: { id: string } | null;
  property?: { id: string } | null;
};

type SellerRecord = ObjectRecord & {
  name?: FullNameMetadata | null;
  phones?: PhonesMetadata | null;
};

type PropertyRecord = ObjectRecord & {
  address?: AddressMetadata | null;
};

const StyledDetails = styled.div`
  border-top: 1px solid ${themeCssVariables.border.color.medium};
  color: ${themeCssVariables.font.color.secondary};
  display: grid;
  font-size: 12px;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[2]};
`;

export const OpportunityBoardCardDetails = ({
  opportunityId,
}: {
  opportunityId: string;
}) => {
  const { t } = useLingui();
  const opportunity = useAtomFamilyStateValue(
    recordStoreFamilyState,
    opportunityId,
  ) as OpportunityCardRecord | null | undefined;
  const { record: seller } = useFindOneRecord<SellerRecord>({
    objectNameSingular: CoreObjectNameSingular.Person,
    objectRecordId:
      opportunity?.pointOfContactId ?? opportunity?.pointOfContact?.id,
  });
  const { record: property } = useFindOneRecord<PropertyRecord>({
    objectNameSingular: 'property',
    objectRecordId: opportunity?.propertyId ?? opportunity?.property?.id,
  });
  const { tasks, hasNextPage, fetchMoreTasks } = useTasks({
    targetableObjects: [
      {
        id: opportunityId,
        targetObjectNameSingular: CoreObjectNameSingular.Opportunity,
      },
    ],
  });
  const lastRequestedTaskCount = useRef<number | null>(null);

  useEffect(() => {
    if (!hasNextPage || lastRequestedTaskCount.current === tasks.length) {
      return;
    }

    // A later page can contain an earlier due task because targets sort by activity time.
    lastRequestedTaskCount.current = tasks.length;
    void fetchMoreTasks();
  }, [fetchMoreTasks, hasNextPage, tasks.length]);

  const nextTask = nextOpenTask(tasks);
  const sellerName = [seller?.name?.firstName, seller?.name?.lastName]
    .filter(Boolean)
    .join(' ');
  const address = property?.address;
  const propertyAddress = [
    address?.addressStreet1,
    address?.addressCity,
    address?.addressState,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <StyledDetails
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <span>
        {t`Seller`}: {sellerName || '—'}
      </span>
      <span>
        {t`Property`}: {propertyAddress || '—'}
      </span>
      <span>
        {t`Phone`}: {seller?.phones?.primaryPhoneNumber || '—'}
      </span>
      <span>
        {t`Next task`}:{' '}
        {nextTask
          ? `${nextTask.title || t`Untitled task`} · ${new Date(nextTask.dueAt ?? '').toLocaleDateString()}`
          : '—'}
      </span>
      <OpportunityQuickActions opportunityId={opportunityId} />
    </StyledDetails>
  );
};
