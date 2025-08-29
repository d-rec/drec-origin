import { Unit } from '../types/reads';

export const getWhMultiplier = (unit: Unit): number => {
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
export const convertToWh = (
  measurement: number,
  unit: string | Unit,
): number => {
  const multiplier = getWhMultiplier(unit as Unit) || 1;

  return measurement * multiplier;
};

export const convertToPowerUnit = ({
  value,
  unit,
  targetUnit,
}: {
  value: number;
  unit: string | Unit;
  targetUnit: string | Unit;
}): number => {
  const valueInWh = convertToWh(value, unit as Unit);
  const targetMultiplier = getWhMultiplier(targetUnit as Unit);

  return valueInWh / targetMultiplier;
};
