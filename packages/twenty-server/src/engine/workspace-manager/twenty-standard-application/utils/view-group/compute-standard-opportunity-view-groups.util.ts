import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

export const computeStandardOpportunityViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {
    byStageNew: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'new',
        isVisible: true,
        fieldValue: 'NEW',
        position: 0,
      },
    }),
    byStageContacted: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'contacted',
        isVisible: true,
        fieldValue: 'CONTACTED',
        position: 1,
      },
    }),
    byStageFollowUp: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'followUp',
        isVisible: true,
        fieldValue: 'FOLLOW_UP',
        position: 2,
      },
    }),
    byStageOffer: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'offer',
        isVisible: true,
        fieldValue: 'OFFER',
        position: 3,
      },
    }),
    byStageDeclined: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'declined',
        isVisible: true,
        fieldValue: 'DECLINED',
        position: 4,
      },
    }),
    byStageAccepted: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'accepted',
        isVisible: true,
        fieldValue: 'ACCEPTED',
        position: 5,
      },
    }),
    byStageUnderContract: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'underContract',
        isVisible: true,
        fieldValue: 'UNDER_CONTRACT',
        position: 6,
      },
    }),
    byStageClosed: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'closed',
        isVisible: true,
        fieldValue: 'CLOSED',
        position: 7,
      },
    }),
    byStageLost: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'lost',
        isVisible: true,
        fieldValue: 'LOST',
        position: 8,
      },
    }),
  };
};
