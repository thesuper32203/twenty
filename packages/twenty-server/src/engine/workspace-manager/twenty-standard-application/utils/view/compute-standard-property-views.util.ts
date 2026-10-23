import { ViewKey, ViewType } from 'twenty-shared/types';

import { INDEX_VIEW_NAME } from 'src/engine/metadata-modules/view/constants/index-view-name.constant';
import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';
import {
  type CreateStandardViewArgs,
  createStandardViewFlatMetadata,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardPropertyViews = (
  args: Omit<CreateStandardViewArgs<'property'>, 'context'>,
): Record<string, FlatView> => ({
  allProperties: createStandardViewFlatMetadata({
    ...args,
    objectName: 'property',
    context: {
      viewName: 'allProperties',
      name: INDEX_VIEW_NAME,
      type: ViewType.TABLE,
      key: ViewKey.INDEX,
      position: 0,
      icon: 'IconTable',
    },
  }),
});
