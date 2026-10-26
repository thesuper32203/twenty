export const shouldPreserveOpportunityStageChange = (
  objectSingularName: string,
  diff: object | null | undefined,
): boolean =>
  objectSingularName === 'opportunity' &&
  Object.prototype.hasOwnProperty.call(diff ?? {}, 'stage');
