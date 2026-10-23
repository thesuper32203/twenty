import { useRecordIndexTableLazyQuery } from '@/object-record/record-index/hooks/useRecordIndexTableLazyQuery';
import { usePeopleTablePagination } from '@/object-record/record-index/hooks/usePeopleTablePagination';
import { useCurrentRecordGroupDefinition } from '@/object-record/record-group/hooks/useCurrentRecordGroupDefinition';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';

import { visibleRecordFieldsComponentSelector } from '@/object-record/record-field/states/visibleRecordFieldsComponentSelector';
import { recordTableWentFromEmptyToNotEmptyComponentState } from '@/object-record/record-table/states/recordTableWentFromEmptyToNotEmptyComponentState';
import { useTriggerInitialRecordTableDataLoad } from '@/object-record/record-table/virtualization/hooks/useTriggerInitialRecordTableDataLoad';
import { isInitializingVirtualTableDataLoadingComponentState } from '@/object-record/record-table/virtualization/states/isInitializingVirtualTableDataLoadingComponentState';
import { lastContextStoreVirtualizedViewIdComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedViewIdComponentState';
import { lastContextStoreVirtualizedVisibleRecordFieldsComponentState } from '@/object-record/record-table/virtualization/states/lastContextStoreVirtualizedVisibleRecordFieldsComponentState';
import { lastRecordTableQueryIdentifierComponentState } from '@/object-record/record-table/virtualization/states/lastRecordTableQueryIdentifierComponentState';
import { isFetchingMoreRecordsFamilyState } from '@/object-record/states/isFetchingMoreRecordsFamilyState';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import isEmpty from 'lodash.isempty';
import { useEffect, useState } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// TODO: see if we can merge the initial and load more processes, to have only one load at scroll index effect
export const RecordTableVirtualizedInitialDataLoadEffect = () => {
  const { recordTableId, objectNameSingular } = useRecordTableContextOrThrow();

  const { queryIdentifier } = useRecordIndexTableLazyQuery(objectNameSingular);
  const { recordLimit } = useRecordIndexContextOrThrow();
  const currentRecordGroupDefinition = useCurrentRecordGroupDefinition();
  const { pagination } = usePeopleTablePagination(queryIdentifier);
  const tableQueryIdentifier =
    objectNameSingular === CoreObjectNameSingular.Person &&
    !isDefined(recordLimit) &&
    !isDefined(currentRecordGroupDefinition)
      ? `${queryIdentifier}:${pagination.pageIndex}:${pagination.pageSize}`
      : queryIdentifier;

  const [lastRecordTableQueryIdentifier, setLastRecordTableQueryIdentifier] =
    useAtomComponentState(lastRecordTableQueryIdentifierComponentState);

  const [isInitializedOnMount, setIsInitializedOnMount] = useState(false);

  const visibleRecordFields = useAtomComponentSelectorValue(
    visibleRecordFieldsComponentSelector,
  );
  const [isInitializingVirtualTableDataLoading] = useAtomComponentState(
    isInitializingVirtualTableDataLoadingComponentState,
  );

  const [
    recordTableWentFromEmptyToNotEmpty,
    setRecordTableWentFromEmptyToNotEmpty,
  ] = useAtomComponentState(recordTableWentFromEmptyToNotEmptyComponentState);

  const isFetchingMoreRecords = useAtomFamilyStateValue(
    isFetchingMoreRecordsFamilyState,
    recordTableId,
  );

  const { triggerInitialRecordTableDataLoad } =
    useTriggerInitialRecordTableDataLoad();

  const [
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
  ] = useAtomComponentState(lastContextStoreVirtualizedViewIdComponentState);

  const [
    lastContextStoreVirtualizedVisibleRecordFields,
    setLastContextStoreVirtualizedVisibleRecordFields,
  ] = useAtomComponentState(
    lastContextStoreVirtualizedVisibleRecordFieldsComponentState,
  );

  const { currentView } = useGetCurrentViewOnly();

  useEffect(() => {
    if (isInitializingVirtualTableDataLoading) {
      return;
    }

    // Wait for the atomic batch from loadRecordIndexStates to populate
    // visibleRecordFields before triggering any fetch. This guard must apply
    // to every branch: when the current view is a draft (e.g. an unsaved
    // record-table widget view), it is not in the persisted views store, so
    // currentView is undefined and the view-change branch below never runs.
    if (isEmpty(visibleRecordFields)) {
      return;
    }

    (async () => {
      if ((currentView?.id ?? null) !== lastContextStoreVirtualizedViewId) {
        setLastContextStoreVirtualizedViewId(currentView?.id ?? null);
        setLastRecordTableQueryIdentifier(tableQueryIdentifier);
        setLastContextStoreVirtualizedVisibleRecordFields(visibleRecordFields);

        await triggerInitialRecordTableDataLoad();
      } else if (
        tableQueryIdentifier !== lastRecordTableQueryIdentifier &&
        !isFetchingMoreRecords
      ) {
        setLastRecordTableQueryIdentifier(tableQueryIdentifier);

        await triggerInitialRecordTableDataLoad();
      } else if (recordTableWentFromEmptyToNotEmpty) {
        setRecordTableWentFromEmptyToNotEmpty(false);

        await triggerInitialRecordTableDataLoad();
      } else if (
        JSON.stringify(lastContextStoreVirtualizedVisibleRecordFields) !==
        JSON.stringify(visibleRecordFields)
      ) {
        const lastFields = lastContextStoreVirtualizedVisibleRecordFields ?? [];
        const currentFields = visibleRecordFields ?? [];

        setLastContextStoreVirtualizedVisibleRecordFields(visibleRecordFields);

        const shouldRefetchData = currentFields.length > lastFields.length;

        if (shouldRefetchData) {
          await triggerInitialRecordTableDataLoad({
            shouldScrollToStart: isEmpty(lastFields),
          });
        }
      } else if (!isInitializedOnMount) {
        setIsInitializedOnMount(true);
        await triggerInitialRecordTableDataLoad();
      }
    })();
  }, [
    recordTableWentFromEmptyToNotEmpty,
    setRecordTableWentFromEmptyToNotEmpty,
    tableQueryIdentifier,
    lastRecordTableQueryIdentifier,
    triggerInitialRecordTableDataLoad,
    setLastRecordTableQueryIdentifier,
    isFetchingMoreRecords,
    isInitializingVirtualTableDataLoading,
    currentView,
    lastContextStoreVirtualizedViewId,
    setLastContextStoreVirtualizedViewId,
    lastContextStoreVirtualizedVisibleRecordFields,
    setLastContextStoreVirtualizedVisibleRecordFields,
    visibleRecordFields,
    isInitializedOnMount,
    setIsInitializedOnMount,
  ]);

  return <></>;
};
