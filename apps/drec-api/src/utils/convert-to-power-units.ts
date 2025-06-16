import { Unit } from '../utils/enums/unit.enum';

export const getWhMultiplier = (unit: string): number => {
  switch (unit) {
    case Unit.kWh:
      return 10 ** 3;
    case Unit.MWh:
      return 10 ** 6;
    case Unit.GWh:
      return 10 ** 9;
    default:
      return 1;
  }
};

// Convert to Watt per Hour
export const convertToWh = (measurement: number, unit: Unit): number => {
  const multiplier = getWhMultiplier(unit) || 1;

  return measurement * multiplier;
};
