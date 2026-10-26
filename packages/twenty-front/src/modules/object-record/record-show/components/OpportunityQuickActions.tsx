import { useCreateActivityForTargetRecord } from '@/activities/hooks/useCreateActivityForTargetRecord';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledActions = styled.div`
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} 0;
`;

const StyledAction = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[2]};
`;

export const OpportunityQuickActions = ({
  opportunityId,
}: {
  opportunityId: string;
}) => {
  const { t } = useLingui();
  const targetRecord = {
    id: opportunityId,
    targetObjectNameSingular: CoreObjectNameSingular.Opportunity,
  };
  const task = useCreateActivityForTargetRecord({
    targetRecord,
    activityObjectNameSingular: CoreObjectNameSingular.Task,
    defaultTaskTitle: t`Follow up with seller`,
  });
  const note = useCreateActivityForTargetRecord({
    targetRecord,
    activityObjectNameSingular: CoreObjectNameSingular.Note,
  });

  if (!task.canCreateActivity && !note.canCreateActivity) {
    return null;
  }

  return (
    <StyledActions>
      {task.canCreateActivity && (
        <StyledAction type="button" onClick={task.createActivity}>
          {t`Follow-up task`}
        </StyledAction>
      )}
      {note.canCreateActivity && (
        <StyledAction type="button" onClick={note.createActivity}>
          {t`Add note`}
        </StyledAction>
      )}
    </StyledActions>
  );
};
