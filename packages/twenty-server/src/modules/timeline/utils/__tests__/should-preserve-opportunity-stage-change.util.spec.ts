import { shouldPreserveOpportunityStageChange } from 'src/modules/timeline/utils/should-preserve-opportunity-stage-change.util';

describe('shouldPreserveOpportunityStageChange', () => {
  it('keeps each Opportunity stage transition separate', () => {
    expect(
      shouldPreserveOpportunityStageChange('opportunity', {
        stage: { before: 'NEW', after: 'CONTACTED' },
      }),
    ).toBe(true);
  });

  it('retains normal merge behavior for other updates', () => {
    expect(
      shouldPreserveOpportunityStageChange('opportunity', { name: {} }),
    ).toBe(false);
    expect(shouldPreserveOpportunityStageChange('person', { stage: {} })).toBe(
      false,
    );
  });
});
