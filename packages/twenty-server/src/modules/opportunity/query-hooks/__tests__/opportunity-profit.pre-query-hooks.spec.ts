import { stampProjectedProfit } from 'src/modules/opportunity/query-hooks/opportunity-profit.pre-query-hooks';

describe('stampProjectedProfit', () => {
  const fee = { amountMicros: 15000000000, currencyCode: 'USD' };

  it('copies the assignment fee when a deal is created', () => {
    expect(stampProjectedProfit({ assignmentFee: fee }, true)).toEqual({
      assignmentFee: fee,
      projectedProfit: fee,
    });
  });

  it('clears projected profit when the assignment fee is cleared', () => {
    expect(stampProjectedProfit({ assignmentFee: null })).toEqual({
      assignmentFee: null,
      projectedProfit: null,
    });
  });

  it('does not change projected profit on unrelated updates', () => {
    expect(stampProjectedProfit({ stage: 'OFFER' })).toEqual({
      stage: 'OFFER',
    });
  });

  it('rejects a direct projected-profit edit', () => {
    expect(() => stampProjectedProfit({ projectedProfit: fee })).toThrow(
      'Projected profit is calculated from assignment fee',
    );
  });
});
