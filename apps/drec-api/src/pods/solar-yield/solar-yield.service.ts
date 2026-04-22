import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readSolarGrid, SolarGrid } from './npz-reader';
import { SOLAR_MODEL_CONFIG } from './config';

/**
 * TypeScript port of Kartik Naik's `solar-monthly-predictionModel`
 * (prediction_model.py) — specifically the fix branch under review as
 * KNaik1695/solar-monthly-predictionModel PR #1, which includes:
 *
 *   1. Correct days-vec indexing in the Case-B full-months loop
 *      (`relevant_days_vec[i]`, not `days_vec[i]`).
 *   2. A `ValueError` guard on pre-COD queries (`year < cod.year`).
 *   3. The `correction = PF * (1 - DF)^(year - cod.year)` factor applied to
 *      Model 2 Case B as well, so Model 2 is continuous across the COD-year
 *      boundary (Case B collapses to PF since the DF exponent is zero).
 *
 * The model is a typical-year climatology over a lat/lon/month grid — it does
 * not reflect actual weather in the queried year. Use it for past-generation
 * confirmations against tolerance bands sized to absorb ±10–15% inter-annual
 * variability, not as a ground-truth estimator.
 */
export interface SolarYieldResult {
  Model_1_Outputs: {
    Yield_kWh: number;
    Monthly_kWh: number[];
    Version: string;
    Name: string;
  };
  Model_2_Outputs: {
    Yield_kWh: number;
    Version: string;
    Static_Average: number;
    Name: string;
  };
}

const DAYS_VEC = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

@Injectable()
export class SolarYieldService implements OnModuleInit {
  private readonly logger = new Logger(SolarYieldService.name);
  private grid: SolarGrid | null = null;

  onModuleInit(): void {
    // Fail lazily: if the grid file isn't provisioned we want the rest of
    // drec-api to boot normally; only callers that hit getSolarEnergy() see
    // the error. See README for how to provision the .npz.
    const p = process.env.SOLAR_GRID_NPZ_PATH;
    if (!p) {
      this.logger.warn(
        'SOLAR_GRID_NPZ_PATH not set — solar-yield service is inert. Any getSolarEnergy() call will throw.',
      );
      return;
    }
    const t0 = Date.now();
    try {
      this.grid = readSolarGrid(p);
      const ms = Date.now() - t0;
      this.logger.log(
        `loaded solar grid: ${this.grid.nLon}×${this.grid.nLat}×${this.grid.nMonths} (${ms} ms)`,
      );
    } catch (e: any) {
      this.logger.error(
        `failed to load solar grid from ${p}: ${e?.message || e}`,
      );
    }
  }

  /**
   * Compute yearly + monthly yield (Wh-output aggregated per month) for a
   * single site. Mirrors `SolarEnergyInterpolator.get_solar_energy` from
   * the Python reference.
   *
   * @param latitude   decimal degrees, [-60, 65]
   * @param longitude  decimal degrees, [-180, 180]
   * @param capacity   nameplate AC capacity in kW
   * @param cod        Commercial Operation Date (Date or parseable string)
   * @param year       the year to predict yield for
   */
  getSolarEnergy(
    latitude: number,
    longitude: number,
    capacity: number,
    cod: Date | string,
    year: number,
  ): SolarYieldResult {
    if (!this.grid) {
      throw new Error(
        'solar-yield: grid not loaded (SOLAR_GRID_NPZ_PATH unset or load failed). See apps/drec-api/src/pods/solar-yield/README.md.',
      );
    }
    const codDate = cod instanceof Date ? cod : new Date(cod);
    if (Number.isNaN(codDate.getTime())) {
      throw new Error(`cod unparseable: ${cod}`);
    }
    const codYear = codDate.getUTCFullYear();

    // PR #1 fix (2): loud failure for pre-COD queries instead of silent nonsense.
    if (year < codYear) {
      throw new RangeError(
        `year (${year}) is before COD year (${codYear}); cannot predict yield prior to commissioning.`,
      );
    }

    // Coordinate-bounds guard. Scipy's RegularGridInterpolator(fill_value=0)
    // silently returns 0 for OOB queries — same as the Python reference. That
    // conflates a legitimate zero (polar winter) with a typo'd coordinate, so
    // we raise here instead and let callers decide how to surface "not
    // covered by the grid" vs a modelled zero.
    const g = this.grid;
    if (
      latitude < g.lats[0] ||
      latitude > g.lats[g.nLat - 1] ||
      longitude < g.lons[0] ||
      longitude > g.lons[g.nLon - 1]
    ) {
      throw new RangeError(
        `coordinates out of grid bounds: lat=${latitude} lon=${longitude}; ` +
          `grid covers lat [${g.lats[0]}, ${g.lats[g.nLat - 1]}] lon [${g.lons[0]}, ${g.lons[g.nLon - 1]}].`,
      );
    }

    const { PF_avg, DF, staticAvg, solarGsaVersion, linearRegressionVersion } =
      SOLAR_MODEL_CONFIG;

    if (year !== codYear) {
      // Case A: full-year yield (year strictly after COD year).
      const specEnergy = Array.from({ length: 12 }, (_, i) =>
        this.interpolate(longitude, latitude, i + 1),
      );
      const correction = PF_avg * (1 - DF) ** (year - codYear);
      const monthly = specEnergy.map(
        (e, i) => correction * capacity * e * DAYS_VEC[i],
      );
      const yieldKwh = round2(monthly.reduce((s, v) => s + v, 0));

      // Model 2 (linear regression): same correction factor, static avg * capacity.
      const model2Yield = correction * capacity * staticAvg;

      return {
        Model_1_Outputs: {
          Yield_kWh: yieldKwh,
          Monthly_kWh: monthly,
          Version: solarGsaVersion,
          Name: 'Solar GSA Model',
        },
        Model_2_Outputs: {
          Yield_kWh: model2Yield,
          Version: linearRegressionVersion,
          Static_Average: staticAvg,
          Name: 'Linear regression model',
        },
      };
    }

    // Case B: COD year — partial first month + whole months to end of year.
    const month = codDate.getUTCMonth() + 1; // 1..12
    const daysInCodMonth = DAYS_VEC[month - 1];
    const partialMonthDays = daysInCodMonth - codDate.getUTCDate() + 1;

    const specEnergyPartial = this.interpolate(longitude, latitude, month);
    const partialMonthGen =
      PF_avg * capacity * specEnergyPartial * partialMonthDays;

    let fullMonthsVec: number[] = [];
    let fullMonthsGen = 0;
    let relevantDaysVec: number[] = [0];
    if (month < 12) {
      const remainingMonths = Array.from(
        { length: 12 - month },
        (_, i) => month + 1 + i,
      );
      const specEnergy = remainingMonths.map((m) =>
        this.interpolate(longitude, latitude, m),
      );
      // days_vec slice matching remainingMonths (month+1 .. 12, 1-based → days_vec indices month .. 11)
      relevantDaysVec = DAYS_VEC.slice(month, 12);
      // PR #1 fix (1): use relevantDaysVec[i], not DAYS_VEC[i]. The upstream bug
      // shifted day counts by `month` — a June COD multiplied July's specific
      // energy by January's 31 days, August by February's 28, and so on.
      fullMonthsVec = specEnergy.map(
        (e, i) => PF_avg * capacity * e * relevantDaysVec[i],
      );
      fullMonthsGen = round2(fullMonthsVec.reduce((s, v) => s + v, 0));
    }
    const codToEoyTotal = round2(partialMonthGen + fullMonthsGen);

    // Pad zeros so the returned Monthly_kWh has 12 entries with the partial
    // month landing in its correct calendar slot.
    const codToEoyVec = [partialMonthGen, ...fullMonthsVec];
    const padded = Array<number>(12 - codToEoyVec.length)
      .fill(0)
      .concat(codToEoyVec);

    // PR #1 fix (3): Model 2 Case B applies `correction` too. With year == codYear
    // the DF exponent is zero, so correction collapses to PF_avg.
    const correction = PF_avg * (1 - DF) ** (year - codYear);
    const fullMonthDays = relevantDaysVec.reduce((s, v) => s + v, 0);
    const daysElapsed = partialMonthDays + fullMonthDays;
    const model2Yield = correction * capacity * staticAvg * (daysElapsed / 365);

    return {
      Model_1_Outputs: {
        Yield_kWh: codToEoyTotal,
        Monthly_kWh: padded,
        Version: solarGsaVersion,
        Name: 'Solar GSA Model',
      },
      Model_2_Outputs: {
        Yield_kWh: model2Yield,
        Version: linearRegressionVersion,
        Static_Average: staticAvg,
        Name: 'Linear regression model',
      },
    };
  }

  /**
   * Nearest-neighbour lookup into the 3D grid at (lon, lat, month). Assumes
   * bounds have already been validated by the caller (`getSolarEnergy` does
   * this once up-front). NaN grid values — which the upstream dataset uses
   * over oceans — surface as 0, matching the Python reference.
   */
  private interpolate(lon: number, lat: number, month: number): number {
    const g = this.grid!;
    const lonIdx = nearestIndex(g.lons, lon);
    const latIdx = nearestIndex(g.lats, lat);
    const monthIdx = month - 1;
    const flat = (lonIdx * g.nLat + latIdx) * g.nMonths + monthIdx;
    const v = g.pv[flat];
    return Number.isFinite(v) ? v : 0;
  }
}

/** Nearest-neighbour index into a monotonically increasing grid. */
function nearestIndex(grid: Float64Array, x: number): number {
  // Binary search for the first index > x.
  let lo = 0;
  let hi = grid.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (grid[mid] <= x) lo = mid + 1;
    else hi = mid;
  }
  // `lo` now points to the first element strictly greater than x, or grid.length.
  if (lo === 0) return 0;
  if (lo === grid.length) return grid.length - 1;
  return x - grid[lo - 1] <= grid[lo] - x ? lo - 1 : lo;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
