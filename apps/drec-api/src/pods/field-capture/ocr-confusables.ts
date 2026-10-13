/**
 * Confusable-tolerant serial matching, for OCR candidate lookup ONLY.
 *
 * Distinct from `canonicalizeSerialNumber` in lib/device.ts, which folds O→0
 * and nothing else and is documented as duplicate-screening only. That
 * narrowness is correct there: collapsing more characters would make unrelated
 * registrant-typed serials collide and wrongly reject a legitimate device.
 *
 * A camera has the opposite problem. Glare, etching and low contrast make a
 * fixed set of glyph pairs genuinely ambiguous, so the reader's output should
 * be treated as a *shape* and compared against serials we already hold. Used
 * only to propose "did you mean …?" to the operator — never to decide that two
 * devices are the same, and never on a path that writes.
 */

/** Each group collapses to its first member. */
const CONFUSABLE_GROUPS = [
  '0OoDQ',
  '1IilL|',
  '2Zz',
  '5Ss',
  '8B',
  '6Gb',
  '9gq',
  '7T',
  'VU',
  'XK',
];

const FOLD_MAP: Record<string, string> = {};
for (const group of CONFUSABLE_GROUPS) {
  for (const ch of group) {
    FOLD_MAP[ch] = group[0];
  }
}

/**
 * Collapse a serial to a comparison key: strip separators, upper-case, then
 * fold every confusable glyph to its group representative. Two serials with
 * the same key are the same string as far as a camera can tell.
 */
export function ocrShapeKey(serial: string): string {
  const stripped = (serial ?? '').trim().replace(/[\s_.-]/g, '');
  let out = '';
  for (const ch of stripped) {
    out += FOLD_MAP[ch] ?? ch.toUpperCase();
  }
  return out;
}

/** Levenshtein distance, capped — we only ever care about "within 2". */
export function boundedEditDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(v);
      if (v < rowMin) rowMin = v;
    }
    // Whole row already worse than the cap: no completion can beat it.
    if (rowMin > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

export interface SerialMatch {
  deviceId: number;
  serialNumber: string;
  externalId: string | null;
  siteName: string | null;
  /** 'exact' once confusables are folded; 'near' within the edit cap. */
  kind: 'exact' | 'near';
  distance: number;
}

/**
 * Rank known serials against a scanned one. `max` is an edit distance over the
 * folded keys, so an O/0 or 8/B substitution costs nothing and a genuinely
 * different character costs 1.
 */
export function rankSerialCandidates(
  scanned: string,
  known: Array<{
    id: number;
    serialNumber: string | null;
    externalId: string | null;
    siteName: string | null;
  }>,
  max = 2,
): SerialMatch[] {
  const target = ocrShapeKey(scanned);
  if (!target) return [];

  const matches: SerialMatch[] = [];
  for (const device of known) {
    for (const candidate of [device.serialNumber, device.externalId]) {
      if (!candidate) continue;
      const distance = boundedEditDistance(target, ocrShapeKey(candidate), max);
      if (distance > max) continue;
      matches.push({
        deviceId: device.id,
        serialNumber: device.serialNumber ?? candidate,
        externalId: device.externalId,
        siteName: device.siteName,
        kind: distance === 0 ? 'exact' : 'near',
        distance,
      });
      break;
    }
  }

  return matches.sort((a, b) => a.distance - b.distance).slice(0, 5);
}
