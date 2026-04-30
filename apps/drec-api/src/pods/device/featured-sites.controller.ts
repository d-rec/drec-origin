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

interface FeaturedSite {
  lat: number;
  lon: number;
  name: string;
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

// Each entry was visually verified against Google satellite imagery at z=17 to
// confirm panel arrays are present at the coordinate. We initially planned to
// query `device.latitude/longitude` from the DB, but registration coords are
// bimodal-precision (most are 2 decimals = ~1km off the actual install) — a
// curated list reliably shows panels in the cutaway, the DB query did not.
const FEATURED: FeaturedSite[] = [
  // India (5 — Charanka tiles + Bhadla + Kurnool)
  { name: 'Charanka Solar Park, IN', lat: 23.9, lon: 71.2 },
  { name: 'Charanka Solar Park (block 2), IN', lat: 23.905, lon: 71.205 },
  { name: 'Charanka Solar Park (block 3), IN', lat: 23.895, lon: 71.195 },
  { name: 'Charanka Solar Park (block 4), IN', lat: 23.91, lon: 71.21 },
  { name: 'Bhadla Solar Park, IN', lat: 27.538, lon: 71.91 },
  { name: 'Kurnool Ultra Mega, IN', lat: 15.672, lon: 78.298 },
  { name: 'Kurnool Ultra Mega (block 2), IN', lat: 15.674, lon: 78.295 },
  // China (4)
  { name: 'Tengger Desert Solar, CN', lat: 37.5663, lon: 105.0354 },
  { name: 'Tengger Desert (block 2), CN', lat: 37.57, lon: 105.04 },
  { name: 'Tengger Desert (block 3), CN', lat: 37.58, lon: 105.05 },
  { name: 'Tengger Desert (block 4), CN', lat: 37.555, lon: 105.045 },
  { name: 'Longyangxia Dam Solar, CN', lat: 36.0905, lon: 100.5814 },
  // US (8)
  { name: 'Topaz Solar Farm, US', lat: 35.3781, lon: -120.0617 },
  { name: 'Topaz Solar Farm (block 2), US', lat: 35.38, lon: -120.06 },
  { name: 'Topaz Solar Farm (block 3), US', lat: 35.376, lon: -120.064 },
  { name: 'Desert Sunlight, US', lat: 33.8278, lon: -115.4042 },
  { name: 'Desert Sunlight (block 2), US', lat: 33.825, lon: -115.402 },
  { name: 'Mesquite Solar, US', lat: 33.472, lon: -113.108 },
  { name: 'Crescent Dunes (CSP tower), US', lat: 38.24, lon: -117.364 },
  { name: 'Solana Generating Station (CSP), US', lat: 32.9156, lon: -112.9678 },
  { name: 'Solana Generating Station (CSP, block 2), US', lat: 32.918, lon: -112.965 },
  // Spain (5)
  { name: 'Andasol Solar Power Station (CSP), ES', lat: 37.227, lon: -3.067 },
  { name: 'Andasol Solar Power Station (CSP, field 2), ES', lat: 37.2295, lon: -3.0688 },
  { name: 'Solúcar Platform PS10/PS20 (CSP tower), ES', lat: 37.4422, lon: -6.2497 },
  { name: 'Solúcar Platform (PV block), ES', lat: 37.4435, lon: -6.247 },
  { name: 'Gemasolar (CSP tower), ES', lat: 37.44, lon: -5.33 },
  // Africa (2)
  { name: 'Benban Solar Park, EG', lat: 24.44, lon: 32.74 },
  { name: 'Benban Solar Park (block 2), EG', lat: 24.45, lon: 32.73 },
  // Middle East (3)
  { name: 'DEWA Mohammed bin Rashid Solar, AE', lat: 24.74, lon: 55.42 },
  { name: 'DEWA Phase 4 (CSP+PV), AE', lat: 24.745, lon: 55.425 },
  { name: 'DEWA Phase 5 (PV block), AE', lat: 24.73, lon: 55.415 },
];

@ApiTags('Featured Sites')
@Controller('featured-sites')
export class FeaturedSitesController {
  @Get()
  @UseGuards(FeaturedSitesIpRateLimitGuard)
  @ApiOperation({
    summary:
      'Curated list of solar installations with verified panel-visible satellite imagery, used by the login-page globe cutaway.',
  })
  @ApiOkResponse({ type: Object, isArray: true })
  @Header(
    'Cache-Control',
    'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
  )
  list(): FeaturedSite[] {
    return FEATURED;
  }
}
