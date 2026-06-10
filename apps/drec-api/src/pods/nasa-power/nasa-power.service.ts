import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { NasaPowerMonthlyCache } from './nasa-power-monthly-cache.entity';

/**
 * Thin client for NASA POWER's monthly point endpoint. Fetches
 * ALLSKY_SFC_SW_DWN (all-sky surface shortwave downward irradiance,
 * kWh/m²/day) for a (lat, lon, year). Cached two ways:
 *
 *   1. In-process Map keyed on (latQ, lonQ, year) — hot path.
 *   2. nasa_power_monthly_cache table — survives restarts.
 *
 * POWER's grid is ~0.5°, so the cache key rounds lat/lon to one
 * decimal place (multiplied by 10 → integer PK). Two sites in the
 * same 0.1° cell share a cache row, which matches the upstream
 * resolution.
 *
 * Past years are treated as immutable: once cached, never refetched.
 * The current year is refetched if the row is older than 24 h, to
 * pick up the rolling ~2-3-day-delayed data updates.
 *
 * This is a ceiling-check input, not a ground-truth estimator;
 * callers should size their tolerances accordingly.
 */
@Injectable()
export class NasaPowerService {
  private readonly logger = new Logger(NasaPowerService.name);
  private readonly memCache = new Map<string, (number | null)[]>();
  private readonly inflight = new Map<string, Promise<(number | null)[]>>();
  private static readonly CURRENT_YEAR_TTL_MS = 24 * 60 * 60 * 1000;
  private static readonly BASE_URL =
    'https://power.larc.nasa.gov/api/temporal/monthly/point';

  constructor(
    @InjectRepository(NasaPowerMonthlyCache)
    private readonly cacheRepo: Repository<NasaPowerMonthlyCache>,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Return 12 monthly mean GHI values (kWh/m²/day) for the given
   * cell and year. Months for which POWER had no value are `null`;
   * the array length is always 12.
   */
  async getMonthlyGhi(
    latitude: number,
    longitude: number,
    year: number,
  ): Promise<(number | null)[]> {
    const { latQ, lonQ } = quantize(latitude, longitude);
    const key = cacheKey(latQ, lonQ, year);

    const hot = this.memCache.get(key);
    if (hot) return hot;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const promise = this.loadOrFetch(latQ, lonQ, year).finally(() =>
      this.inflight.delete(key),
    );
    this.inflight.set(key, promise);
    return promise;
  }

  /** Convenience: single month (1..12). */
  async getGhiForMonth(
    latitude: number,
    longitude: number,
    year: number,
    month: number,
  ): Promise<number | null> {
    if (month < 1 || month > 12) {
      throw new RangeError(`month must be 1..12, got ${month}`);
    }
    const v = await this.getMonthlyGhi(latitude, longitude, year);
    return v[month - 1];
  }

  private async loadOrFetch(
    latQ: number,
    lonQ: number,
    year: number,
  ): Promise<(number | null)[]> {
    const key = cacheKey(latQ, lonQ, year);
    const currentYear = new Date().getUTCFullYear();

    const existing = await this.cacheRepo.findOne({
      where: { latQ, lonQ, year },
    });
    if (existing) {
      const stale =
        year >= currentYear &&
        Date.now() - existing.fetchedAt.getTime() >
          NasaPowerService.CURRENT_YEAR_TTL_MS;
      if (!stale) {
        this.memCache.set(key, existing.ghiKwhM2Day);
        return existing.ghiKwhM2Day;
      }
    }

    const lat = latQ / 10;
    const lon = lonQ / 10;
    const fetched = await this.fetchFromPower(lat, lon, year);

    await this.cacheRepo.save(
      this.cacheRepo.create({
        latQ,
        lonQ,
        year,
        ghiKwhM2Day: fetched,
        fetchedAt: new Date(),
      }),
    );
    this.memCache.set(key, fetched);
    return fetched;
  }

  private async fetchFromPower(
    lat: number,
    lon: number,
    year: number,
  ): Promise<(number | null)[]> {
    const url = NasaPowerService.BASE_URL;
    const params = {
      parameters: 'ALLSKY_SFC_SW_DWN',
      community: 'RE',
      longitude: lon,
      latitude: lat,
      start: String(year),
      end: String(year),
      format: 'JSON',
    };

    const t0 = Date.now();
    const resp = await firstValueFrom(
      this.httpService.get(url, { params, timeout: 20000 }),
    );
    const ms = Date.now() - t0;

    const param = resp?.data?.properties?.parameter?.ALLSKY_SFC_SW_DWN;
    if (!param || typeof param !== 'object') {
      throw new Error(
        `NASA POWER returned no ALLSKY_SFC_SW_DWN data (lat=${lat}, lon=${lon}, year=${year})`,
      );
    }
    const monthly: (number | null)[] = Array<number | null>(12).fill(null);
    for (let m = 1; m <= 12; m++) {
      const k = `${year}${String(m).padStart(2, '0')}`;
      const raw = param[k];
      // POWER uses sentinel values like -999 for missing data.
      if (typeof raw === 'number' && raw > -100) {
        monthly[m - 1] = raw;
      }
    }
    this.logger.log(
      `POWER fetch ok (lat=${lat}, lon=${lon}, year=${year}, ${ms} ms): ` +
        monthly.map((v) => (v == null ? '–' : v.toFixed(2))).join(','),
    );
    return monthly;
  }
}

function quantize(lat: number, lon: number): { latQ: number; lonQ: number } {
  return {
    latQ: Math.round(lat * 10),
    lonQ: Math.round(lon * 10),
  };
}

function cacheKey(latQ: number, lonQ: number, year: number): string {
  return `${latQ}:${lonQ}:${year}`;
}
