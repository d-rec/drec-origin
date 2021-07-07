export const roundToClosestLower = (numberToRound: number, toClosest: number) =>
  Math.floor(numberToRound / toClosest) * toClosest;
