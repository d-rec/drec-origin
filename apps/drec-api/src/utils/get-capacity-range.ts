import { CapacityRange } from './enums';

export const getCapacityRange = (
  capacityInKiloWatts: number,
): CapacityRange => {
  let capacityWatts = capacityInKiloWatts * 10 ** 3;
  let capacityMegaWatts = capacityInKiloWatts * 10 ** -3;
  if (capacityWatts <= 1000) {
    return CapacityRange.firstRange;
  } else if (
    capacityInKiloWatts > 1.01 &&
    Math.round(capacityInKiloWatts) <= 50
  ) {
    return CapacityRange.secondRange;
  } else if (
    capacityInKiloWatts >= 51 &&
    Math.round(capacityInKiloWatts) <= 500
  ) {
    return CapacityRange.thirdRange;
  } else if (
    Math.round(capacityInKiloWatts) > 500 &&
    Math.round(capacityMegaWatts) <= 5
  ) {
    return CapacityRange.fourthRange;
  } else if (Math.round(capacityMegaWatts) > 5) {
    return CapacityRange.fifthRange;
  }
};
