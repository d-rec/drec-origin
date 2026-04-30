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

interface FeaturedSite {
  lat: number;
  lon: number;
}

@Injectable()
class FeaturedSitesIpRateLimitGuard implements CanActivate {
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

@ApiTags('Featured Sites')
@Controller('featured-sites')
export class FeaturedSitesController {
  private cache: { fetchedAt: number; payload: FeaturedSite[] } | null = null;
  private readonly cacheTtlMs = 60 * 60 * 1000;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  @Get()
  @UseGuards(FeaturedSitesIpRateLimitGuard)
  @ApiOperation({
    summary:
      'Public unjittered coordinates for ~20 sites, used by the login-page globe cutaway. Cached server-side for 1h.',
  })
  @ApiOkResponse({ type: Object, isArray: true })
  @Header(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  )
  async list(): Promise<FeaturedSite[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.payload;
    }
    const rows = await this.deviceRepo
      .createQueryBuilder('d')
      .select(['d.latitude AS latitude', 'd.longitude AS longitude'])
      .where('d.latitude IS NOT NULL AND d.longitude IS NOT NULL')
      .andWhere("d.latitude <> ''")
      .andWhere("d.longitude <> ''")
      .orderBy('RANDOM()')
      .limit(20)
      .getRawMany();
    const payload: FeaturedSite[] = rows
      .map((r: any) => ({
        lat: parseFloat(r.latitude),
        lon: parseFloat(r.longitude),
      }))
      .filter(
        (s: FeaturedSite) =>
          Number.isFinite(s.lat) &&
          Number.isFinite(s.lon) &&
          Math.abs(s.lat) <= 90 &&
          Math.abs(s.lon) <= 180,
      );
    this.cache = { fetchedAt: now, payload };
    return payload;
  }
}
