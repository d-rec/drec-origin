/**
 * Curated set of territories where the ISO country returned by a reverse-
 * geocoder is politically disputed, so a mismatch between reverse-geocoded
 * country and registrant-declared country must not auto-reject.
 *
 * Polygons are deliberately coarse (axis-aligned bounding boxes plus simple
 * multi-point polygons). The goal isn't cartographic precision — it's to
 * catch points near any border with an active territorial dispute and
 * surface them to a reviewer with full context instead of failing the check.
 *
 * Sources consulted: UN cartographic section treatment of disputed areas,
 * Natural Earth disputed-areas dataset, Wikipedia territorial-dispute list.
 * Updates welcome when new disputes emerge or existing ones resolve.
 */

export interface DisputedTerritory {
  /** Short identifier for logs / reviewer UI. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** ISO-3 codes of states with competing claims. */
  claimants: string[];
  /** Polygon as [lng, lat] pairs; closed implicitly. Ray-casting test. */
  polygon: Array<[number, number]>;
}

/** Bounding box helper — produces a rectangle polygon. */
function bbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): Array<[number, number]> {
  return [
    [minLng, minLat],
    [maxLng, minLat],
    [maxLng, maxLat],
    [minLng, maxLat],
  ];
}

export const DISPUTED_TERRITORIES: DisputedTerritory[] = [
  {
    id: 'kashmir',
    name: 'Kashmir (Jammu & Kashmir, Azad Kashmir, Gilgit-Baltistan)',
    claimants: ['IND', 'PAK', 'CHN'],
    polygon: bbox(73.0, 32.2, 80.5, 37.1),
  },
  {
    id: 'aksai-chin',
    name: 'Aksai Chin',
    claimants: ['IND', 'CHN'],
    polygon: bbox(78.0, 34.5, 80.5, 36.5),
  },
  {
    id: 'arunachal-pradesh',
    name: 'Arunachal Pradesh / South Tibet',
    claimants: ['IND', 'CHN'],
    polygon: bbox(91.5, 26.6, 97.4, 29.5),
  },
  {
    id: 'kalapani-lipulekh',
    name: 'Kalapani / Lipulekh / Limpiyadhura',
    claimants: ['IND', 'NPL'],
    polygon: bbox(80.0, 29.9, 81.2, 30.6),
  },
  {
    id: 'west-bank',
    name: 'West Bank',
    claimants: ['ISR', 'PSE'],
    polygon: bbox(34.88, 31.35, 35.57, 32.55),
  },
  {
    id: 'gaza',
    name: 'Gaza Strip',
    claimants: ['ISR', 'PSE'],
    polygon: bbox(34.22, 31.22, 34.58, 31.6),
  },
  {
    id: 'golan-heights',
    name: 'Golan Heights',
    claimants: ['ISR', 'SYR'],
    polygon: bbox(35.62, 32.75, 35.92, 33.45),
  },
  {
    id: 'crimea',
    name: 'Crimea',
    claimants: ['UKR', 'RUS'],
    polygon: bbox(32.4, 44.3, 36.7, 46.3),
  },
  {
    id: 'donbas',
    name: 'Donetsk & Luhansk (occupied areas)',
    claimants: ['UKR', 'RUS'],
    polygon: bbox(36.6, 47.0, 40.3, 49.9),
  },
  {
    id: 'western-sahara',
    name: 'Western Sahara',
    claimants: ['MAR', 'ESH'],
    polygon: bbox(-17.1, 20.8, -8.7, 27.7),
  },
  {
    id: 'taiwan',
    name: 'Taiwan (Republic of China)',
    claimants: ['CHN', 'TWN'],
    polygon: bbox(119.3, 21.8, 122.1, 25.4),
  },
  {
    id: 'northern-cyprus',
    name: 'Northern Cyprus',
    claimants: ['CYP', 'TUR'],
    polygon: bbox(32.26, 34.98, 34.6, 35.7),
  },
  {
    id: 'abkhazia',
    name: 'Abkhazia',
    claimants: ['GEO', 'RUS'],
    polygon: bbox(40.0, 42.38, 42.3, 43.6),
  },
  {
    id: 'south-ossetia',
    name: 'South Ossetia',
    claimants: ['GEO', 'RUS'],
    polygon: bbox(43.4, 42.2, 44.6, 42.8),
  },
  {
    id: 'transnistria',
    name: 'Transnistria (Pridnestrovie)',
    claimants: ['MDA', 'RUS'],
    polygon: bbox(28.85, 46.15, 30.15, 48.5),
  },
  {
    id: 'nagorno-karabakh',
    name: 'Nagorno-Karabakh',
    claimants: ['ARM', 'AZE'],
    polygon: bbox(45.9, 39.4, 47.2, 40.45),
  },
];

/** Point-in-polygon test using ray casting. Handles non-convex polygons. */
export function pointInPolygon(
  lng: number,
  lat: number,
  polygon: Array<[number, number]>,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersects =
      yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Returns the first disputed territory containing the point, or null. */
export function findDisputedTerritory(
  lat: number,
  lng: number,
): DisputedTerritory | null {
  for (const t of DISPUTED_TERRITORIES) {
    if (pointInPolygon(lng, lat, t.polygon)) return t;
  }
  return null;
}
