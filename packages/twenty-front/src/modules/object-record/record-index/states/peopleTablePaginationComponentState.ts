import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';
import { ViewComponentInstanceContext } from '@/views/states/contexts/ViewComponentInstanceContext';

export type PeopleTablePagination = {
  queryIdentifier: string;
  pageIndex: number;
  pageSize: 20 | 50 | 100;
  totalCount: number;
};

export const peopleTablePaginationComponentState =
  createAtomComponentState<PeopleTablePagination>({
    key: 'peopleTablePaginationComponentState',
    defaultValue: {
      queryIdentifier: '',
      pageIndex: 0,
      pageSize: 20,
      totalCount: 0,
    },
    componentInstanceContext: ViewComponentInstanceContext,
  });
