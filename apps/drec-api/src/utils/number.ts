export const roundToClosestLower = (
  numberToRound: number,
  toClosest: number,
): number => Math.floor(numberToRound / toClosest) * toClosest;
