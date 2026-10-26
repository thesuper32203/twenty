import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { isObjectMetadataReadOnly } from '@/object-record/read-only/utils/isObjectMetadataReadOnly';
import { useOpenCreateActivityDrawer } from '@/activities/hooks/useOpenCreateActivityDrawer';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { useCanUpdateObjectRecords } from '@/object-record/hooks/useCanUpdateObjectRecords';
import { type CoreObjectNameSingular } from 'twenty-shared/types';

type UseCreateActivityForTargetRecordParams = {
  targetRecord: ActivityTargetableObject;
  defaultTaskTitle?: string;
  activityObjectNameSingular:
    | CoreObjectNameSingular.Note
    | CoreObjectNameSingular.Task;
};

// Attaching to the target needs update permission on its object, not just create on the activity.
export const useCreateActivityForTargetRecord = ({
  targetRecord,
  activityObjectNameSingular,
  defaultTaskTitle,
}: UseCreateActivityForTargetRecordParams) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: targetRecord.targetObjectNameSingular,
  });
  const { canUpdateObjectRecords } = useCanUpdateObjectRecords(
    targetRecord.targetObjectNameSingular,
  );

  const openCreateActivityDrawer = useOpenCreateActivityDrawer({
    activityObjectNameSingular,
  });

  const createActivity = () =>
    openCreateActivityDrawer({
      targetableObjects: [targetRecord],
      defaultTaskTitle,
    });

  return {
    canCreateActivity:
      canUpdateObjectRecords &&
      !isObjectMetadataReadOnly({ objectMetadataItem }),
    createActivity,
  };
};
