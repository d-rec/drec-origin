import { DEVICE_DEGRADATION } from "../constants";

export const computeMaxEnergyCapacity = (
  capacity: number,
  meteredTimePeriod: number,
  deviceAge: number,
  degradationPercentage: number,
  yieldValue: number,
): number => {
  return (
    capacity *
    meteredTimePeriod *
    (yieldValue / 8760) *
    Math.pow(1 - DEVICE_DEGRADATION/100, deviceAge - 1)
);
};
