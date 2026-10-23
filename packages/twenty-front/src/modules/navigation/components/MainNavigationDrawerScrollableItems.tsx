import { NavigationDrawerOpenedSection } from '@/navigation-menu-item/display/sections/components/NavigationDrawerOpenedSection';
import { NavigationMenuItemSection } from '@/navigation-menu-item/display/sections/components/NavigationMenuItemSection';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { useNavigationSection } from '@/ui/navigation/navigation-drawer/hooks/useNavigationSection';
import { NavigationDrawerWorkspaceSectionSkeletonLoader } from '@/object-metadata/components/NavigationDrawerWorkspaceSectionSkeletonLoader';

import { styled } from '@linaria/react';
import { lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { AppPath } from 'twenty-shared/types';
import { IconFileImport } from 'twenty-ui/icon';
import { useLingui } from '@lingui/react/macro';

import { themeCssVariables } from 'twenty-ui/theme';

const FavoritesSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/favorites/components/FavoritesSectionDispatcher').then(
    (module) => ({
      default: module.FavoritesSectionDispatcher,
    }),
  ),
);

const WorkspaceSectionDispatcher = lazy(() =>
  import('@/navigation-menu-item/display/sections/workspace/components/WorkspaceSectionDispatcher').then(
    (module) => ({
      default: module.WorkspaceSectionDispatcher,
    }),
  ),
);

const StyledScrollableItemsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

export const MainNavigationDrawerScrollableItems = () => {
  const { t } = useLingui();
  const location = useLocation();
  const { toggleNavigationSection, isNavigationSectionOpen } =
    useNavigationSection('Contacts & Data');

  return (
    <StyledScrollableItemsContainer>
      <NavigationDrawerOpenedSection />
      <Suspense fallback={<NavigationDrawerWorkspaceSectionSkeletonLoader />}>
        <FavoritesSectionDispatcher />
        <WorkspaceSectionDispatcher />
      </Suspense>
      <NavigationMenuItemSection
        title={t`Contacts & Data`}
        isOpen={isNavigationSectionOpen}
        onToggle={toggleNavigationSection}
      >
        <NavigationDrawerItem
          label={t`Imports`}
          to={AppPath.Imports}
          Icon={IconFileImport}
          active={location.pathname === AppPath.Imports}
        />
      </NavigationMenuItemSection>
    </StyledScrollableItemsContainer>
  );
};
