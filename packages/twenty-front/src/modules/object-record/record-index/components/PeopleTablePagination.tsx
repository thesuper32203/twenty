import { useRecordIndexTableLazyQuery } from '@/object-record/record-index/hooks/useRecordIndexTableLazyQuery';
import { usePeopleTablePagination } from '@/object-record/record-index/hooks/usePeopleTablePagination';
import { useResetRecordSelection } from '@/object-record/record-selection/hooks/useResetRecordSelection';
import { isInitializingVirtualTableDataLoadingComponentState } from '@/object-record/record-table/virtualization/states/isInitializingVirtualTableDataLoadingComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledPagination = styled.div`
  align-items: center;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-end;
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledPageSizeSelect = styled.select`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: inherit;
  padding: ${themeCssVariables.spacing[1]};
`;

type PeopleTablePaginationProps = {
  recordTableId: string;
};

export const PeopleTablePagination = ({
  recordTableId,
}: PeopleTablePaginationProps) => {
  const { t } = useLingui();
  const { queryIdentifier } = useRecordIndexTableLazyQuery(
    CoreObjectNameSingular.Person,
  );
  const { pagination, setPagination } =
    usePeopleTablePagination(queryIdentifier);
  const { resetRecordSelection } = useResetRecordSelection(recordTableId);
  const isLoading = useAtomComponentStateValue(
    isInitializingVirtualTableDataLoadingComponentState,
    recordTableId,
  );

  const firstRecord =
    pagination.totalCount === 0
      ? 0
      : pagination.pageIndex * pagination.pageSize + 1;
  const lastRecord = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    pagination.totalCount,
  );

  const changePage = (pageIndex: number) => {
    resetRecordSelection();
    setPagination({ ...pagination, pageIndex });
  };

  return (
    <StyledPagination>
      <label htmlFor={`people-page-size-${recordTableId}`}>
        {t`Rows per page`}
      </label>
      <StyledPageSizeSelect
        id={`people-page-size-${recordTableId}`}
        value={pagination.pageSize}
        disabled={isLoading}
        onChange={(event) => {
          resetRecordSelection();
          setPagination({
            ...pagination,
            pageIndex: 0,
            pageSize: Number(event.target.value) as 20 | 50 | 100,
          });
        }}
      >
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </StyledPageSizeSelect>
      <span>{t`${firstRecord}–${lastRecord} of ${pagination.totalCount}`}</span>
      <Button
        size="sm"
        variant="ghost"
        disabled={isLoading || pagination.pageIndex === 0}
        onClick={() => changePage(pagination.pageIndex - 1)}
      >
        {t`Previous`}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isLoading || lastRecord >= pagination.totalCount}
        onClick={() => changePage(pagination.pageIndex + 1)}
      >
        {t`Next`}
      </Button>
    </StyledPagination>
  );
};
