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
  { name: 'Gausganj, IN', lat: 27.082623, lon: 80.288072 },
  { name: 'Harpalpur, IN', lat: 27.324103, lon: 79.835716 },
  { name: 'Bhagauli, IN', lat: 27.2308369, lon: 80.2976086 },
  { name: 'Bawan, IN', lat: 27.39706, lon: 80.022158, labelOnly: true },
  { name: 'Kalauli, IN', lat: 27.122526, lon: 80.314862 },
  { name: 'Ganj Muradabad, IN', lat: 26.9587116, lon: 80.1836987 },
  { name: 'Banda, IN', lat: 28.2411253, lon: 80.11016313 },
  { name: 'Bihat Gaud, IN', lat: 27.5592695, lon: 80.4899989 },
  { name: 'Bahai, IN', lat: 26.1291183, lon: 81.00089166 },
  { name: 'Dhingwas, IN', lat: 25.857768, lon: 81.6775866 },
  { name: 'Choudhera, IN', lat: 27.830148, lon: 79.917955 },
  { name: 'Bela Bhela, IN', lat: 26.13223666, lon: 81.23149333 },
  { name: 'Ramkot, IN', lat: 27.5310623, lon: 80.5876545 },
  { name: 'Bheetargaon, IN', lat: 26.2986689, lon: 80.9755703 },
  { name: 'Rahi, IN', lat: 26.236317, lon: 81.301596 },
  { name: 'Abhayapur, IN', lat: 28.1068824, lon: 81.06224521 },
  { name: 'Paliya Paschim, IN', lat: 27.305465, lon: 79.804412 },
  { name: 'Sahrawan, IN', lat: 26.614259, lon: 80.77748, labelOnly: true },
  { name: 'Bhauli, IN', lat: 26.674539, lon: 80.5934196 },
  { name: 'Dhanwar, IN', lat: 27.606983, lon: 80.0421184 },
  { name: 'Kamaee, IN', lat: 26.402531, lon: 81.4149045 },
  { name: 'Mahadev Atra, IN', lat: 27.81257666, lon: 80.873105 },
  { name: 'Sarai Ranak, IN', lat: 27.7187033, lon: 80.0294183 },
  { name: 'Tumurkhi, IN', lat: 27.6695666, lon: 80.0180583 },
  { name: 'Sevta, IN', lat: 27.5966948, lon: 81.1780573 },
  { name: 'Kafara, IN', lat: 28.067628, lon: 81.0427884 },
  { name: 'Barakalan, IN', lat: 27.764378, lon: 79.381184 },
  { name: 'Bansura, IN', lat: 27.37134167, lon: 81.24989444 },
  { name: 'Pratapnagar, IN', lat: 27.32495833, lon: 80.42970278 },
  { name: 'Pipargaon, IN', lat: 27.12405278, lon: 80.73695556 },
  { name: 'Sansarpur, IN', lat: 28.13976389, lon: 80.36169444 },
  { name: 'Aurangabad Village, IN', lat: 27.34581667, lon: 80.54310278 },
  { name: 'Hargaon, IN', lat: 27.76033056, lon: 80.73192222 },
  { name: 'Kampil, IN', lat: 27.60958056, lon: 79.276075 },
  { name: 'Kaant, IN', lat: 27.80678056, lon: 79.79394167 },
  { name: 'Rampur Mathura, IN', lat: 27.36042778, lon: 81.31742222 },
  { name: 'Sanda, IN', lat: 27.577475, lon: 81.05929444 },
  { name: 'Shahbaz Nagar, IN', lat: 27.92563333, lon: 79.88403056 },
  { name: 'Som, IN', lat: 27.07791389, lon: 80.45518889 },
  { name: 'Gangsara, IN', lat: 28.12624444, lon: 80.16950278 },
  { name: 'Bangarmou / Naunihalganj, IN', lat: 26.90336667, lon: 80.2151, labelOnly: true },
  { name: 'Bejham, IN', lat: 27.882025, lon: 80.63476667 },
  { name: 'Belagusisi, IN', lat: 26.112, lon: 81.21024444, labelOnly: true },
  { name: 'Maholi, IN', lat: 27.65593333, lon: 80.47470556 },
  { name: 'Veruwa (Berwa), IN', lat: 27.18086111, lon: 80.44775833 },
  { name: 'Atipur, IN', lat: 27.55395556, lon: 79.37296944 },
  { name: 'Bhurwara, IN', lat: 28.073025, lon: 80.52338611 },
  { name: 'Khudaganj, IN', lat: 27.18598889, lon: 79.66656389 },
  { name: 'Ahirori, IN', lat: 27.341925, lon: 80.275802 },
  { name: 'Attrauli, IN', lat: 27.172073, lon: 80.661793 },
  { name: 'Baheria, IN', lat: 27.188463, lon: 80.610785 },
  { name: 'Bharail, IN', lat: 27.388954, lon: 80.290301 },
  { name: 'Kalyanmal, IN', lat: 27.233485, lon: 80.5371, labelOnly: true },
  { name: 'Koro Kuinyan, IN', lat: 28.023203, lon: 80.028358 },
  { name: 'Lonahara, IN', lat: 27.152927, lon: 80.38882, labelOnly: true },
  { name: 'Meer Nagar, IN', lat: 27.099656, lon: 80.549492 },
  { name: 'Mohiddinpur, IN', lat: 28.299257, lon: 80.113606 },
  { name: 'Samodha, IN', lat: 27.120076, lon: 80.421807 },
  { name: 'Trilokpur, IN', lat: 28.364827, lon: 80.6704293 },
  { name: 'Machrehata, IN', lat: 27.420177, lon: 80.643582 },
  { name: 'Markamou, IN', lat: 27.028801, lon: 81.445924 },
  // Okra Solar / PowerTrust rooftop installations in Haiti (Léogâne).
  // 7–8 decimal precision from prod DB; cutaway lands on the residential
  // rooftop arrays.
  { name: 'Okra Solar, HT', lat: 19.20520641, lon: -72.49656819 },
  { name: 'Okra Solar, HT', lat: 19.21009143, lon: -72.51078575 },
  { name: 'Okra Solar, HT', lat: 19.2260702, lon: -72.5219985 },
  { name: 'Okra Solar, HT', lat: 19.2207567, lon: -72.5163421 },
  { name: 'Okra Solar, HT', lat: 19.2200273, lon: -72.5162294 },
  { name: 'Okra Solar, HT', lat: 19.2190693, lon: -72.5157231 },
  { name: 'Okra Solar, HT', lat: 19.2183035, lon: -72.5154164 },
  { name: 'Okra Solar, HT', lat: 19.2179321, lon: -72.5148441 },
  // Nairobi placeholder — no Kenya devices in DB yet, so this gets a label
  // for geographic coverage without claiming a specific installation site.
  // Update lat/lon to a real Kenyan project once one is onboarded.
  { name: 'Nairobi, KE', lat: -1.2921, lon: 36.8219, labelOnly: true },
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
