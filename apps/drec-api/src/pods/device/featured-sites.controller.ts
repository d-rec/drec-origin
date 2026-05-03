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
  name: string;
  /**
   * If true, the login-globe shows a dot + leader + label for this site, but
   * never fires a satellite cutaway on it. Use for sites that lack the
   * rooftop precision needed to land the cutaway on actual panels —
   * geographic visibility without misleading the viewer.
   */
  labelOnly?: boolean;
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

// OMC mini-grid sites in Uttar Pradesh (D-REC's "Third OMC Purchase" device
// registration batch). Cutaway zoom is z=18 (~82m visible radius). Entries
// with <6 decimal places on either lat or lon are marked labelOnly — at
// that precision the cutaway can land off-roof, so we show a label without
// the satellite zoom.
const FEATURED: FeaturedSite[] = [
  { name: 'Bilgram, IN', lat: 27.17963, lon: 80.03654, labelOnly: true },
  { name: 'Gausganj, IN', lat: 27.082623, lon: 80.288072, labelOnly: true },
  { name: 'Harpalpur, IN', lat: 27.324103, lon: 79.835716 },
  { name: 'Bhagauli, IN', lat: 27.2308042, lon: 80.2977929 },
  { name: 'Bawan, IN', lat: 27.39706, lon: 80.022158, labelOnly: true },
  { name: 'Kalauli, IN', lat: 27.1226161, lon: 80.315018 },
  { name: 'Ganj Muradabad, IN', lat: 26.9587116, lon: 80.1836987, labelOnly: true },
  { name: 'Banda, IN', lat: 28.2411253, lon: 80.11016313, labelOnly: true },
  { name: 'Bihat Gaud, IN', lat: 27.5592695, lon: 80.4899989, labelOnly: true },
  { name: 'Bahai, IN', lat: 26.1289326, lon: 81.001229 },
  { name: 'Dhingwas, IN', lat: 25.8578454, lon: 81.6775614 },
  { name: 'Choudhera, IN', lat: 27.8301199, lon: 79.9180296 },
  { name: 'Bela Bhela, IN', lat: 26.1321835, lon: 81.231451 },
  { name: 'Ramkot, IN', lat: 27.5310623, lon: 80.5876545, labelOnly: true },
  { name: 'Bheetargaon, IN', lat: 26.2987148, lon: 80.9754851 },
  { name: 'Rahi, IN', lat: 26.2362051, lon: 81.301969 },
  { name: 'Abhayapur, IN', lat: 28.1070486, lon: 81.0623941 },
  { name: 'Paliya Paschim, IN', lat: 27.305465, lon: 79.804412 },
  { name: 'Sahrawan, IN', lat: 26.614259, lon: 80.77748, labelOnly: true },
  { name: 'Bhauli, IN', lat: 26.674502, lon: 80.5936351 },
  { name: 'Dhanwar, IN', lat: 27.606983, lon: 80.0421184, labelOnly: true },
  { name: 'Kamaee, IN', lat: 26.4025802, lon: 81.414831 },
  { name: 'Mahadev Atra, IN', lat: 27.8124947, lon: 80.8731186 },
  { name: 'Sarai Ranak, IN', lat: 27.7186179, lon: 80.0296229 },
  { name: 'Tumurkhi, IN', lat: 27.6695469, lon: 80.0179231 },
  { name: 'Sevta, IN', lat: 27.5966931, lon: 81.178008 },
  { name: 'Kafara, IN', lat: 28.067725, lon: 81.0427094 },
  { name: 'Barakalan, IN', lat: 27.7643441, lon: 79.3813437 },
  { name: 'Bansura, IN', lat: 27.3714219, lon: 81.2504196 },
  { name: 'Pratapnagar, IN', lat: 27.32506, lon: 80.42972 },
  { name: 'Pipargaon, IN', lat: 27.1240747, lon: 80.7369858 },
  { name: 'Sansarpur, IN', lat: 28.1399152, lon: 80.3617823 },
  { name: 'Aurangabad Village, IN', lat: 27.34581667, lon: 80.54310278, labelOnly: true },
  { name: 'Hargaon, IN', lat: 27.7603971, lon: 80.7319728 },
  { name: 'Kampil, IN', lat: 27.6096211, lon: 79.2761528 },
  { name: 'Kaant, IN', lat: 27.8067297, lon: 79.7941142 },
  { name: 'Rampur Mathura, IN', lat: 27.3605336, lon: 81.3174024 },
  { name: 'Sanda, IN', lat: 27.577461, lon: 81.0593793 },
  { name: 'Shahbaz Nagar, IN', lat: 27.92563333, lon: 79.88403056, labelOnly: true },
  { name: 'Som, IN', lat: 27.07791389, lon: 80.45518889, labelOnly: true },
  { name: 'Gangsara, IN', lat: 28.1263123, lon: 80.1695645 },
  { name: 'Bangarmou / Naunihalganj, IN', lat: 26.90336667, lon: 80.2151, labelOnly: true },
  { name: 'Bejham, IN', lat: 27.8819991, lon: 80.6348419 },
  { name: 'Belagusisi, IN', lat: 26.112, lon: 81.21024444, labelOnly: true },
  { name: 'Maholi, IN', lat: 27.6560439, lon: 80.474773 },
  { name: 'Veruwa (Berwa), IN', lat: 27.18086111, lon: 80.44775833 },
  { name: 'Atipur, IN', lat: 27.5539738, lon: 79.373053 },
  { name: 'Bhurwara, IN', lat: 28.0731234, lon: 80.5233881 },
  { name: 'Khudaganj, IN', lat: 27.1859559, lon: 79.6665108 },
  { name: 'Ahirori, IN', lat: 27.3420489, lon: 80.2757397 },
  { name: 'Attrauli, IN', lat: 27.171661, lon: 80.6612912 },
  { name: 'Baheria, IN', lat: 27.1885231, lon: 80.610804 },
  { name: 'Bharail, IN', lat: 27.388954, lon: 80.290301, labelOnly: true },
  { name: 'Kalyanmal, IN', lat: 27.233485, lon: 80.5371, labelOnly: true },
  { name: 'Koro Kuinyan, IN', lat: 28.0234077, lon: 80.0281906 },
  { name: 'Lonahara, IN', lat: 27.152927, lon: 80.38882, labelOnly: true },
  { name: 'Meer Nagar, IN', lat: 27.0996364, lon: 80.5495369 },
  { name: 'Mohiddinpur, IN', lat: 28.299256, lon: 80.1134849 },
  { name: 'Samodha, IN', lat: 27.1202312, lon: 80.4219067 },
  { name: 'Trilokpur, IN', lat: 28.3649744, lon: 80.6704214 },
  { name: 'Machrehata, IN', lat: 27.4202048, lon: 80.6435698 },
  { name: 'Markamou, IN', lat: 27.0286693, lon: 81.4458722, labelOnly: true },
  // Okra Solar / PowerTrust rooftop installations in Haiti (Léogâne).
  // 7–8 decimal precision from prod DB; cutaway lands on the residential
  // rooftop arrays.
  { name: 'Okra Solar, HT', lat: 19.20520641, lon: -72.49656819, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.21009143, lon: -72.51078575, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2260702, lon: -72.5219985, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2207567, lon: -72.5163421, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2200273, lon: -72.5162294, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2190693, lon: -72.5157231, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2183035, lon: -72.5154164, labelOnly: true },
  { name: 'Okra Solar, HT', lat: 19.2179321, lon: -72.5148441, labelOnly: true },
  // Visually-confirmed cutaway-eligible sites added 2026-05-03 from a stage-DB
  // candidate sweep (≥6 decimal precision, non-IND/HTI). Each verified at z=19
  // satellite imagery; one Uganda entry recentered onto the panel array.
  // Uganda label shortened from the verbose DB siteName ("SUSTAINABLE
  // ELECTRIFICATION OF HEALTH FACILITIES: UGANDA") for a readable callout.
  { name: 'HMG, NP', lat: 27.437593, lon: 83.644509 },
  { name: 'HMG, NP', lat: 27.199937, lon: 83.640469 },
  { name: 'Health Facility, UG', lat: 0.3411642, lon: 30.7958552 },
  // Kenya placeholders — PT has 3 sites in Kenya pending registration; real
  // coords unknown. The three are spread (central / west / east) so label
  // thinning doesn't collapse them, and named generically ("Kenya, KE")
  // rather than fabricating town names. Replace each lat/lon as PT registers
  // each device.
  { name: 'Kenya, KE', lat: -1.2921, lon: 36.8219, labelOnly: true },
  { name: 'Kenya, KE', lat: -0.0917, lon: 34.7680, labelOnly: true },
  { name: 'Kenya, KE', lat: -0.4569, lon: 39.6583, labelOnly: true },
];

@ApiTags('Featured Sites')
@Controller('featured-sites')
export class FeaturedSitesController {
  // Cache the merged hardcoded + DB result so we hit the DB at most once
  // per cache window. The cutaway-eligible list never changes (hardcoded);
  // only the labelOnly tail refreshes from the live DB.
  private cache: { fetchedAt: number; payload: FeaturedSite[] } | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000;

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  @Get()
  @UseGuards(FeaturedSitesIpRateLimitGuard)
  @ApiOperation({
    summary:
      'Curated panel-precision sites (cutaway) + live DB-pulled named sites for global label coverage.',
  })
  @ApiOkResponse({ type: Object, isArray: true })
  @Header(
    'Cache-Control',
    'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
  )
  async list(): Promise<FeaturedSite[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < this.cacheTtlMs) {
      return this.cache.payload;
    }
    const rows: {
      countryCode: string;
      siteName: string;
      latitude: string;
      longitude: string;
    }[] = await this.deviceRepo.query(`
      WITH dedup AS (
        SELECT DISTINCT ON ("countryCode", "siteName")
               "countryCode", "siteName", latitude, longitude, id
        FROM device
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
          AND latitude <> '' AND longitude <> ''
          AND "siteName" IS NOT NULL
          AND "siteName" NOT IN ('unassigned', 'N/A')
          AND "countryCode" NOT IN ('IND', 'HTI', 'DZA', '')
      ), ranked AS (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY "countryCode" ORDER BY id) AS rn
        FROM dedup
      )
      SELECT "countryCode", "siteName", latitude, longitude
      FROM ranked
      WHERE rn <= 12
      ORDER BY "countryCode", rn
    `);
    const cc2 = (cc: string): string =>
      ({
        BRA: 'BR', GHA: 'GH', GTM: 'GT', IDN: 'ID', KHM: 'KH', MYS: 'MY',
        NGA: 'NG', NPL: 'NP', PHL: 'PH', THA: 'TH', UGA: 'UG', VNM: 'VN',
        ZAF: 'ZA',
      })[cc] || cc;
    const live: FeaturedSite[] = rows
      .map((r) => {
        const lat = parseFloat(r.latitude);
        const lon = parseFloat(r.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
        if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
        const name = r.siteName.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/[,\s]+$/, '');
        if (!name) return null;
        return {
          name: `${name}, ${cc2(r.countryCode)}`,
          lat,
          lon,
          labelOnly: true,
        } as FeaturedSite;
      })
      .filter((x): x is FeaturedSite => x !== null);
    const payload = [...FEATURED, ...live];
    this.cache = { fetchedAt: now, payload };
    return payload;
  }
}
