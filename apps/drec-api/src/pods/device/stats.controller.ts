import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Header,
  HttpException,
  HttpStatus,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './device.entity';

interface PlatformStats {
  gwhCommitted: number;
  countries: number;
  devices: number;
  sites: number;
}

@Injectable()
class StatsIpRateLimitGuard implements CanActivate {
  private hits = new Map<string, number[]>();
  private readonly windowMs = 60_000;
  private readonly max = 60;

  canActivate(ctx: ExecutionContext): boolean {
    const req: any = ctx.switchToHttp().getRequest();
    const ip: string = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (this.hits.get(ip) || []).filter(
      (t: number) => now - t < this.windowMs,
    );
    if (recent.length >= this.max) {
      throw new HttpException(
        'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    this.hits.set(ip, recent);
    if (this.hits.size > 1000) {
      for (const [k, v] of this.hits) {
        if (!v.length || now - v[v.length - 1] > this.windowMs) {
          this.hits.delete(k);
        }
      }
    }
    return true;
  }
}

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  private cache: { fetchedAt: number; payload: PlatformStats } | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  @Get()
  @UseGuards(StatsIpRateLimitGuard)
  @ApiOperation({
    summary:
      'Public platform stats for the login page: GWh committed for purchase, distinct countries, total devices, distinct site names.',
  })
  @ApiOkResponse({ type: Object })
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
  )
  async get(): Promise<PlatformStats> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.payload;
    }
    const rows: {
      gwh_committed: string | null;
      countries: string;
      devices: string;
      sites: string;
    }[] = await this.deviceRepo.query(`
      SELECT
        (SELECT COALESCE(SUM("targetVolumeInMegaWattHour"), 0) / 1000
           FROM device_group)                                AS gwh_committed,
        (SELECT COUNT(DISTINCT "countryCode")
           FROM device
          WHERE "countryCode" IS NOT NULL
            AND "countryCode" <> '')                         AS countries,
        (SELECT COUNT(*) FROM device)                        AS devices,
        (SELECT COUNT(DISTINCT "siteName")
           FROM device
          WHERE "siteName" IS NOT NULL
            AND "siteName" <> '')                            AS sites
    `);
    const row = rows[0] || ({} as any);
    const payload: PlatformStats = {
      gwhCommitted: Math.round(parseFloat(row.gwh_committed ?? '0') || 0),
      countries: parseInt(row.countries, 10) || 0,
      devices: parseInt(row.devices, 10) || 0,
      sites: parseInt(row.sites, 10) || 0,
    };
    this.cache = { fetchedAt: now, payload };
    return payload;
  }
}
