import { EnergyUnit } from '../types/unit';

export const getWhMultiplier = (unit: EnergyUnit): number => {
  switch (unit) {
    case unit.kWh:
      return 10 ** 3;
    case unit.MWh:
      return 10 ** 6;
    case unit.GWh:
      return 10 ** 9;
    default:
      return 1;
  }
};

// Convert to Watt per Hour
export const convertToWh = (
  measurement: number,
  unit: string | EnergyUnit,
): number => {
  const multiplier = getWhMultiplier(unit as EnergyUnit) || 1;

  return measurement * multiplier;
};

export const convertToPowerUnit = ({
  value,
  unit,
  targetUnit,
}: {
  value: number;
  unit: string | EnergyUnit;
  targetUnit: string | EnergyUnit;
}): number => {
  const valueInWh = convertToWh(value, unit as EnergyUnit);
  const targetMultiplier = getWhMultiplier(targetUnit as EnergyUnit);

  return valueInWh / targetMultiplier;
};
