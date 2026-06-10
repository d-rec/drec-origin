import { Column, Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

/**
 * Per-grid-cell monthly mean of NASA POWER's ALLSKY_SFC_SW_DWN
 * (all-sky surface shortwave downward irradiance, kWh/m²/day).
 *
 * Key is the rounded (lat, lon) — POWER's native grid is ~0.5°,
 * so anything finer is spurious precision and would bust the cache
 * for what is the same satellite cell. `latQ` / `lonQ` are stored
 * as the rounded value multiplied by 10 (integer) to keep the
 * primary key free of float-equality hazards.
 *
 * The row caches an entire calendar year for the cell — POWER's
 * monthly endpoint returns 12 months in one call, so we may as well
 * keep them together.
 */
@Entity({ name: 'nasa_power_monthly_cache' })
export class NasaPowerMonthlyCache {
  @PrimaryColumn({ name: 'lat_q', type: 'int' })
  latQ: number;

  @PrimaryColumn({ name: 'lon_q', type: 'int' })
  lonQ: number;

  @PrimaryColumn({ name: 'year', type: 'int' })
  year: number;

  /**
   * 12 monthly means (Jan..Dec), kWh/m²/day. Months for which POWER
   * had no value are stored as null — typically only true for months
   * still in the future at fetch time.
   */
  @Column({ name: 'ghi_kwh_m2_day', type: 'jsonb' })
  ghiKwhM2Day: (number | null)[];

  @CreateDateColumn({ name: 'fetched_at' })
  fetchedAt: Date;
}
