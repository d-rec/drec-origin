import { Unit } from '@energyweb/energy-api-influxdb';

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
export const convertToWh = (measurement: number, unit: string): number => {
  const multiplier = getWhMultiplier(unit as Unit) || 1;

  return measurement * multiplier;
};

export const convertToPowerUnit = ({ value, unit, targetUnit }: { value: number, unit: Unit, targetUnit: Unit }): number => {
  const valueInWh = convertToWh(value, unit);
  const targetMultiplier = getWhMultiplier(targetUnit);

  return valueInWh / targetMultiplier;
}