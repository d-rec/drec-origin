import { SolarYieldService } from './solar-yield.service';
import { SolarGrid } from './npz-reader';
import { SOLAR_MODEL_CONFIG } from './config';

/**
 * Unit tests for the Kartik port. They avoid the real 311-MB grid by
 * injecting a trivial synthetic grid where `interpolate(_, _, m) = m`,
 * which lets us hand-compute every expected value.
 */

const { PF_avg: PF, DF, staticAvg, solarGsaVersion, linearRegressionVersion } =
  SOLAR_MODEL_CONFIG;

const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Build a 2×2×12 grid where pv_data[anyLon, anyLat, monthIdx] = monthIdx + 1.
 * Any query at (lon∈[0,1], lat∈[0,1], month∈[1..12]) yields `month`.
 */
function makeIdentityGrid(): SolarGrid {
  const nLon = 2;
  const nLat = 2;
  const nMonths = 12;
  const pv = new Float32Array(nLon * nLat * nMonths);
  for (let l = 0; l < nLon; l++) {
    for (let k = 0; k < nLat; k++) {
      for (let m = 0; m < nMonths; m++) {
        pv[(l * nLat + k) * nMonths + m] = m + 1;
      }
    }
  }
  return {
    pv,
    lons: new Float64Array([0, 1]),
    lats: new Float64Array([0, 1]),
    nLon,
    nLat,
    nMonths,
  };
}

function makeService(): SolarYieldService {
  const svc = new SolarYieldService();
  // Bypass onModuleInit to avoid touching the disk.
  (svc as unknown as { grid: SolarGrid }).grid = makeIdentityGrid();
  return svc;
}

describe('SolarYieldService', () => {
  const svc = makeService();

  describe('Case A (year > COD year)', () => {
    it('returns a full 12-month vector scaled by PF, DF, capacity, and days-per-month', () => {
      const capacity = 10;
      const year = 2025;
      const codYear = 2024;
      const correction = PF * (1 - DF) ** (year - codYear);

      const result = svc.getSolarEnergy(0, 0, capacity, '2024-01-01', year);

      // With identity grid, monthly = correction * capacity * (month) * daysInMonth
      const expectedMonthly = DAYS.map((d, i) => correction * capacity * (i + 1) * d);
      const expectedYield = Math.round(expectedMonthly.reduce((s, v) => s + v, 0) * 100) / 100;

      expect(result.Model_1_Outputs.Monthly_kWh).toHaveLength(12);
      result.Model_1_Outputs.Monthly_kWh.forEach((v, i) => {
        expect(v).toBeCloseTo(expectedMonthly[i], 6);
      });
      expect(result.Model_1_Outputs.Yield_kWh).toBeCloseTo(expectedYield, 2);
      expect(result.Model_1_Outputs.Version).toBe(solarGsaVersion);

      expect(result.Model_2_Outputs.Yield_kWh).toBeCloseTo(
        correction * capacity * staticAvg,
        6,
      );
      expect(result.Model_2_Outputs.Version).toBe(linearRegressionVersion);
      expect(result.Model_2_Outputs.Static_Average).toBe(staticAvg);
    });

    it('applies the degradation factor per-year-past-COD', () => {
      const y1 = svc.getSolarEnergy(0, 0, 1, '2024-01-01', 2025);
      const y5 = svc.getSolarEnergy(0, 0, 1, '2024-01-01', 2029);
      // Ratio equals (1 - DF)^4 because year-delta differs by 4.
      // Yield_kWh is rounded to 2 decimals, so the ratio can drift by ~1e-6
      // relative to the true DF^4 — 4-digit precision accepts that.
      expect(y5.Model_1_Outputs.Yield_kWh / y1.Model_1_Outputs.Yield_kWh).toBeCloseTo(
        (1 - DF) ** 4,
        4,
      );
    });
  });

  describe('Case B (year == COD year)', () => {
    it('uses relevantDaysVec, not days_vec[i], for the full-months loop (PR#1 fix 1)', () => {
      // COD June 1, 2024 → partial June (30 days) + July..Dec full months.
      // With identity grid, full-months part = Σ PF * cap * month * daysInMonth
      // across months 7..12. If the Python bug were reintroduced (days_vec[i]
      // starting at index 0), it would multiply July by 31, August by 28, etc.,
      // which gives a detectably different total.
      const capacity = 1;
      const result = svc.getSolarEnergy(0, 0, capacity, '2024-06-01', 2024);

      // Partial month: June has 30 days, COD day-of-month = 1, so partialDays = 30.
      const partial = PF * capacity * 6 * 30;
      const fullMonthsExpected =
        PF * capacity * 7 * DAYS[6] + // July
        PF * capacity * 8 * DAYS[7] + // August
        PF * capacity * 9 * DAYS[8] + // September
        PF * capacity * 10 * DAYS[9] + // October
        PF * capacity * 11 * DAYS[10] + // November
        PF * capacity * 12 * DAYS[11]; // December

      const expectedTotal =
        Math.round((partial + Math.round(fullMonthsExpected * 100) / 100) * 100) / 100;

      expect(result.Model_1_Outputs.Yield_kWh).toBeCloseTo(expectedTotal, 2);

      // Monthly_kWh: 12 entries, zeros for Jan..May, partial for June, then Jul..Dec.
      expect(result.Model_1_Outputs.Monthly_kWh).toHaveLength(12);
      for (let i = 0; i < 5; i++) expect(result.Model_1_Outputs.Monthly_kWh[i]).toBe(0);
      expect(result.Model_1_Outputs.Monthly_kWh[5]).toBeCloseTo(partial, 6);
      expect(result.Model_1_Outputs.Monthly_kWh[6]).toBeCloseTo(PF * capacity * 7 * DAYS[6], 6);
      expect(result.Model_1_Outputs.Monthly_kWh[11]).toBeCloseTo(PF * capacity * 12 * DAYS[11], 6);
    });

    it('handles partial-month day count when COD is mid-month', () => {
      // COD June 15, 2024 → partial June covers days 15..30 = 16 days.
      const result = svc.getSolarEnergy(0, 0, 1, '2024-06-15', 2024);
      const expectedPartial = PF * 1 * 6 * 16;
      expect(result.Model_1_Outputs.Monthly_kWh[5]).toBeCloseTo(expectedPartial, 6);
    });

    it('handles December COD (no full months after)', () => {
      // COD Dec 10, 2024 → only partial December; no full months.
      const result = svc.getSolarEnergy(0, 0, 1, '2024-12-10', 2024);
      const expectedPartial = PF * 1 * 12 * (31 - 10 + 1);
      expect(result.Model_1_Outputs.Yield_kWh).toBeCloseTo(expectedPartial, 2);
      // Only December has a non-zero slot.
      for (let i = 0; i < 11; i++) expect(result.Model_1_Outputs.Monthly_kWh[i]).toBe(0);
      expect(result.Model_1_Outputs.Monthly_kWh[11]).toBeCloseTo(expectedPartial, 6);
    });

    it('applies correction to Model 2 Case B (PR#1 fix 3)', () => {
      // In Case B the DF exponent is zero, so correction collapses to PF_avg.
      // Upstream (pre-PR#1) Case B was `capacity * staticAvg * daysElapsed/365`,
      // i.e. no PF factor — which would produce a ~22% higher Model-2 estimate.
      const capacity = 10;
      const result = svc.getSolarEnergy(0, 0, capacity, '2024-06-01', 2024);

      // daysElapsed = 30 (June partial) + 31+31+30+31+30+31 (Jul..Dec) = 30 + 184 = 214.
      const daysElapsed = 30 + 31 + 31 + 30 + 31 + 30 + 31;
      const expected = PF * capacity * staticAvg * (daysElapsed / 365);
      expect(result.Model_2_Outputs.Yield_kWh).toBeCloseTo(expected, 6);

      // Explicitly verify PF was applied (the upstream bug would produce this value).
      const buggy = capacity * staticAvg * (daysElapsed / 365);
      expect(result.Model_2_Outputs.Yield_kWh).not.toBeCloseTo(buggy, 0);
    });
  });

  describe('pre-COD guard (PR#1 fix 2)', () => {
    it('throws RangeError when querying a year before COD', () => {
      expect(() => svc.getSolarEnergy(0, 0, 1, '2024-06-01', 2023)).toThrow(RangeError);
    });

    it('allows year == COD year and year > COD year', () => {
      expect(() => svc.getSolarEnergy(0, 0, 1, '2024-06-01', 2024)).not.toThrow();
      expect(() => svc.getSolarEnergy(0, 0, 1, '2024-06-01', 2025)).not.toThrow();
    });
  });

  describe('out-of-bounds', () => {
    it('returns 0-yield when lat/lon fall outside the grid (fill_value=0 parity)', () => {
      // Query lat=90 (grid max is 1 in our synthetic fixture) → all months yield 0.
      const result = svc.getSolarEnergy(90, 90, 1, '2024-01-01', 2025);
      expect(result.Model_1_Outputs.Yield_kWh).toBe(0);
      result.Model_1_Outputs.Monthly_kWh.forEach((v) => expect(v).toBe(0));
    });
  });
});
