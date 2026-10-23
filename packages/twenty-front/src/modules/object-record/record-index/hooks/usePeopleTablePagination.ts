import { peopleTablePaginationComponentState } from '@/object-record/record-index/states/peopleTablePaginationComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';

export const usePeopleTablePagination = (queryIdentifier: string) => {
  const [storedPagination, setPagination] = useAtomComponentState(
    peopleTablePaginationComponentState,
  );

  const pagination =
    storedPagination.queryIdentifier === queryIdentifier
      ? storedPagination
      : {
          ...storedPagination,
          queryIdentifier,
          pageIndex: 0,
          totalCount: 0,
        };

  return { pagination, setPagination };
};
