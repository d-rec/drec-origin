 export const computeMaxEnergyCapacity = (
      capacity: number,
      meteredTimePeriod: number,
      deviceAge: number,
      degradationPercentage: number,
      yieldValue: number,
    ) => {
      return (
        capacity *
        meteredTimePeriod *
        (yieldValue / 8760) *
        Math.pow(1 - degradationPercentage, deviceAge - 1)
      );
    };