/**
 * D-REC §3.6: Location-based solar irradiance estimation.
 *
 * Estimates annual solar yield (kWh/kW/year) from latitude using
 * a simplified GHI model with ~0.82 performance ratio.
 *
 * This is a conservative lookup — real projects may use site-specific
 * data from PVGIS, SolarGIS, or NASA POWER. The estimate serves as
 * a ceiling check to flag physically implausible production claims.
 */

interface IrradianceBand {
  maxAbsLat: number;
  yieldHigh: number; // optimistic (clear-sky, good tilt)
  yieldLow: number; // conservative (flat/suboptimal)
}

/**
 * Latitude bands with approximate annual yield range (kWh/kW/year).
 * Sources: PVGIS, World Bank Global Solar Atlas averages.
 */
const BANDS: IrradianceBand[] = [
  { maxAbsLat: 10, yieldHigh: 1900, yieldLow: 1500 },
  { maxAbsLat: 20, yieldHigh: 1750, yieldLow: 1350 },
  { maxAbsLat: 25, yieldHigh: 1600, yieldLow: 1200 },
  { maxAbsLat: 30, yieldHigh: 1500, yieldLow: 1050 },
  { maxAbsLat: 35, yieldHigh: 1400, yieldLow: 950 },
  { maxAbsLat: 40, yieldHigh: 1300, yieldLow: 850 },
  { maxAbsLat: 45, yieldHigh: 1150, yieldLow: 750 },
  { maxAbsLat: 50, yieldHigh: 1000, yieldLow: 650 },
  { maxAbsLat: 55, yieldHigh: 900, yieldLow: 550 },
  { maxAbsLat: 60, yieldHigh: 800, yieldLow: 450 },
  { maxAbsLat: 90, yieldHigh: 650, yieldLow: 300 },
];

export interface IrradianceEstimate {
  /** Absolute latitude used for the lookup */
  absLatitude: number;
  /** Optimistic yield (kWh/kW/year) — used as ceiling */
  yieldHigh: number;
  /** Conservative yield (kWh/kW/year) — typical expectation */
  yieldLow: number;
  /** Annual production ceiling in kWh (capacity × yieldHigh × 1.2 margin) */
  annualCeilingKwh: number;
  /** Monthly production ceiling in kWh */
  monthlyCeilingKwh: number;
}

/**
 * Estimate solar yield and production ceiling from latitude and capacity.
 */
export function estimateIrradiance(
  latitude: number,
  capacityKw: number,
): IrradianceEstimate {
  const absLat = Math.abs(latitude);

  let band = BANDS[BANDS.length - 1];
  let prevBand: IrradianceBand | null = null;

  for (const b of BANDS) {
    if (absLat <= b.maxAbsLat) {
      band = b;
      break;
    }
    prevBand = b;
  }

  // Interpolate within the band for smoother transitions
  let yieldHigh: number;
  let yieldLow: number;
  if (prevBand) {
    const bandStart = prevBand.maxAbsLat;
    const bandEnd = band.maxAbsLat;
    const t = (absLat - bandStart) / (bandEnd - bandStart);
    yieldHigh = prevBand.yieldHigh + t * (band.yieldHigh - prevBand.yieldHigh);
    yieldLow = prevBand.yieldLow + t * (band.yieldLow - prevBand.yieldLow);
  } else {
    yieldHigh = band.yieldHigh;
    yieldLow = band.yieldLow;
  }

  yieldHigh = Math.round(yieldHigh);
  yieldLow = Math.round(yieldLow);

  // Ceiling uses the optimistic yield with a 20% margin (same as computeMaxEnergyCapacity)
  const annualCeilingKwh = Math.round(capacityKw * yieldHigh * 1.2);
  const monthlyCeilingKwh = Math.round(annualCeilingKwh / 12);

  return {
    absLatitude: Math.round(absLat * 100) / 100,
    yieldHigh,
    yieldLow,
    annualCeilingKwh,
    monthlyCeilingKwh,
  };
}
