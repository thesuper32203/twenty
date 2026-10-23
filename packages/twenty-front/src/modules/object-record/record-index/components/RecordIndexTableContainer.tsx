import { RecordIndexRemoveSortingModal } from '@/object-record/record-index/components/RecordIndexRemoveSortingModal';
import { RecordIndexTableContainerEffect } from '@/object-record/record-index/components/RecordIndexTableContainerEffect';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { RecordTableWithWrappers } from '@/object-record/record-table/components/RecordTableWithWrappers';
import { PeopleTablePagination } from '@/object-record/record-index/components/PeopleTablePagination';
import { hasRecordGroupsComponentSelector } from '@/object-record/record-group/states/selectors/hasRecordGroupsComponentSelector';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { styled } from '@linaria/react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

const StyledPaginatedTableLayout = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  width: 100%;

  .record-table-paginated-scroll {
    flex: 1;
    height: auto;
    min-height: 0;
  }
`;

type RecordIndexTableContainerProps = {
  recordTableId: string;
};

export const RecordIndexTableContainer = ({
  recordTableId,
}: RecordIndexTableContainerProps) => {
  const { objectNameSingular, viewBarInstanceId, recordLimit } =
    useRecordIndexContextOrThrow();
  const hasRecordGroups = useAtomComponentSelectorValue(
    hasRecordGroupsComponentSelector,
    recordTableId,
  );
  const isPaginated =
    objectNameSingular === CoreObjectNameSingular.Person &&
    !hasRecordGroups &&
    !isDefined(recordLimit);

  const table = (
    <RecordTableWithWrappers
      recordTableId={recordTableId}
      objectNameSingular={objectNameSingular}
      viewBarId={viewBarInstanceId}
      isPaginated={isPaginated}
    />
  );

  return (
    <>
      <RecordIndexTableContainerEffect />
      {isPaginated ? (
        <StyledPaginatedTableLayout>
          {table}
          <PeopleTablePagination recordTableId={recordTableId} />
        </StyledPaginatedTableLayout>
      ) : (
        table
      )}
      <RecordIndexRemoveSortingModal />
    </>
  );
};
