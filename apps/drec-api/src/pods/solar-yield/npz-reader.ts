import { inflateRawSync } from 'zlib';
import { readFileSync } from 'fs';

/**
 * Minimal stdlib-only reader for `.npz` archives containing the three arrays
 * used by the solar potential grid: `pv_data` (Nlon×Nlat×12, float32),
 * `lons` (Nlon, float64), `lats` (Nlat, float64).
 *
 * `.npz` is a ZIP archive of `.npy` files; we parse only what we need (DEFLATE +
 * the numpy v1 header). Throws on any format deviation instead of silently
 * coercing, since this is deployment-time config, not user input.
 */
export interface SolarGrid {
  pv: Float32Array; // length Nlon * Nlat * 12, C-order (lon, lat, month)
  lons: Float64Array; // Nlon
  lats: Float64Array; // Nlat
  nLon: number;
  nLat: number;
  nMonths: number; // always 12
}

export function readSolarGrid(npzPath: string): SolarGrid {
  const buf = readFileSync(npzPath);
  const entries = readZipEntries(buf);

  const pvEntry = entries.get('pv_data.npy');
  const lonsEntry = entries.get('lons.npy');
  const latsEntry = entries.get('lats.npy');
  if (!pvEntry || !lonsEntry || !latsEntry) {
    throw new Error(
      `solar grid npz missing one of pv_data/lons/lats; got: ${[...entries.keys()].join(', ')}`,
    );
  }

  const { meta: pvMeta, data: pvBytes } = parseNpy(pvEntry);
  const { meta: lonsMeta, data: lonsBytes } = parseNpy(lonsEntry);
  const { meta: latsMeta, data: latsBytes } = parseNpy(latsEntry);

  assertNoFortran(pvMeta, 'pv_data');
  assertNoFortran(lonsMeta, 'lons');
  assertNoFortran(latsMeta, 'lats');

  if (pvMeta.shape.length !== 3 || pvMeta.shape[2] !== 12) {
    throw new Error(
      `pv_data shape expected (Nlon, Nlat, 12); got ${JSON.stringify(pvMeta.shape)}`,
    );
  }
  const [nLon, nLat, nMonths] = pvMeta.shape;

  if (lonsMeta.shape.length !== 1 || lonsMeta.shape[0] !== nLon) {
    throw new Error(
      `lons shape ${JSON.stringify(lonsMeta.shape)} mismatches pv_data Nlon=${nLon}`,
    );
  }
  if (latsMeta.shape.length !== 1 || latsMeta.shape[0] !== nLat) {
    throw new Error(
      `lats shape ${JSON.stringify(latsMeta.shape)} mismatches pv_data Nlat=${nLat}`,
    );
  }

  const pv = toFloat32(pvBytes, pvMeta.descr, nLon * nLat * nMonths);
  const lons = toFloat64(lonsBytes, lonsMeta.descr, nLon);
  const lats = toFloat64(latsBytes, latsMeta.descr, nLat);

  // The upstream `.npz` stores `lats` descending (north→south). Downstream
  // code assumes ascending axes, so we flip in-place here: swap the lat axis
  // in `lats` AND in `pv` (which indexes as [lon, lat, month] C-order).
  // In-place is ~40 M float swaps for the current grid — fast and avoids a
  // 300-MB peak allocation during load.
  if (lons.length > 1 && lons[0] > lons[lons.length - 1])
    reverseLons(pv, lons, nLon, nLat, nMonths);
  if (lats.length > 1 && lats[0] > lats[lats.length - 1])
    reverseLats(pv, lats, nLon, nLat, nMonths);

  return { pv, lons, lats, nLon, nLat, nMonths };
}

function reverseLats(
  pv: Float32Array,
  lats: Float64Array,
  nLon: number,
  nLat: number,
  nMonths: number,
): void {
  // Reverse lats in place.
  for (let i = 0, j = nLat - 1; i < j; i++, j--) {
    const t = lats[i];
    lats[i] = lats[j];
    lats[j] = t;
  }
  // For each (lon, month), swap the values at lat_idx and nLat-1-lat_idx.
  const halfLat = Math.floor(nLat / 2);
  for (let l = 0; l < nLon; l++) {
    const lonBase = l * nLat;
    for (let k = 0; k < halfLat; k++) {
      const aBase = (lonBase + k) * nMonths;
      const bBase = (lonBase + (nLat - 1 - k)) * nMonths;
      for (let m = 0; m < nMonths; m++) {
        const t = pv[aBase + m];
        pv[aBase + m] = pv[bBase + m];
        pv[bBase + m] = t;
      }
    }
  }
}

function reverseLons(
  pv: Float32Array,
  lons: Float64Array,
  nLon: number,
  nLat: number,
  nMonths: number,
): void {
  for (let i = 0, j = nLon - 1; i < j; i++, j--) {
    const t = lons[i];
    lons[i] = lons[j];
    lons[j] = t;
  }
  const halfLon = Math.floor(nLon / 2);
  const stride = nLat * nMonths;
  for (let l = 0; l < halfLon; l++) {
    const aBase = l * stride;
    const bBase = (nLon - 1 - l) * stride;
    for (let k = 0; k < stride; k++) {
      const t = pv[aBase + k];
      pv[aBase + k] = pv[bBase + k];
      pv[bBase + k] = t;
    }
  }
}

// ── npy + zip internals ──────────────────────────────────────────────────────

interface NpyMeta {
  descr: string; // e.g. '<f4', '<f8'
  fortran_order: boolean;
  shape: number[];
}

function parseNpy(raw: Buffer): { meta: NpyMeta; data: Buffer } {
  if (raw.length < 10 || raw.slice(0, 6).toString('latin1') !== '\x93NUMPY') {
    throw new Error('not an .npy file (bad magic)');
  }
  const major = raw[6];
  let headerLen: number;
  let headerStart: number;
  if (major === 1) {
    headerLen = raw.readUInt16LE(8);
    headerStart = 10;
  } else if (major === 2) {
    headerLen = raw.readUInt32LE(8);
    headerStart = 12;
  } else {
    throw new Error(`unsupported .npy version ${major}`);
  }

  const headerStr = raw
    .slice(headerStart, headerStart + headerLen)
    .toString('latin1')
    .trim();
  const meta = parsePythonDictLiteral(headerStr);
  return {
    meta: {
      descr: meta.descr,
      fortran_order: Boolean(meta.fortran_order),
      shape: meta.shape,
    },
    data: raw.slice(headerStart + headerLen),
  };
}

/**
 * Parse the tiny Python-dict literal that npy headers carry. The grammar is
 * restricted: keys are single-quoted strings; values are strings, bools,
 * or a tuple of ints. We hand-roll a small tokenizer rather than eval() the
 * string.
 */
function parsePythonDictLiteral(s: string): {
  descr: string;
  fortran_order: boolean;
  shape: number[];
} {
  const descr = s.match(/'descr'\s*:\s*'([^']+)'/)?.[1];
  const fortranStr = s.match(/'fortran_order'\s*:\s*(True|False)/)?.[1];
  const shapeStr = s.match(/'shape'\s*:\s*\(([^)]*)\)/)?.[1];
  if (!descr || fortranStr === undefined || shapeStr === undefined) {
    throw new Error(`.npy header unparseable: ${s}`);
  }
  const shape = shapeStr
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => {
      const n = Number(t);
      if (!Number.isInteger(n)) throw new Error(`bad shape component: ${t}`);
      return n;
    });
  return { descr, fortran_order: fortranStr === 'True', shape };
}

function assertNoFortran(meta: NpyMeta, name: string): void {
  if (meta.fortran_order) {
    throw new Error(`${name} is fortran-order; reader expects C-order`);
  }
}

function toFloat32(buf: Buffer, descr: string, n: number): Float32Array {
  if (descr === '<f4') {
    if (buf.length < n * 4)
      throw new Error(`float32 buffer short: ${buf.length} < ${n * 4}`);
    return new Float32Array(buf.buffer, buf.byteOffset, n);
  }
  if (descr === '<f8') {
    if (buf.length < n * 8)
      throw new Error(`float64 buffer short: ${buf.length} < ${n * 8}`);
    const src = new Float64Array(buf.buffer, buf.byteOffset, n);
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) out[i] = src[i];
    return out;
  }
  throw new Error(`unsupported dtype for float32 target: ${descr}`);
}

function toFloat64(buf: Buffer, descr: string, n: number): Float64Array {
  if (descr === '<f8') {
    if (buf.length < n * 8)
      throw new Error(`float64 buffer short: ${buf.length} < ${n * 8}`);
    return new Float64Array(buf.buffer, buf.byteOffset, n);
  }
  if (descr === '<f4') {
    if (buf.length < n * 4)
      throw new Error(`float32 buffer short: ${buf.length} < ${n * 4}`);
    const src = new Float32Array(buf.buffer, buf.byteOffset, n);
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = src[i];
    return out;
  }
  throw new Error(`unsupported dtype for float64 target: ${descr}`);
}

// ── minimal zip reader (deflate-or-stored only, no encryption, no zip64) ────

function readZipEntries(zip: Buffer): Map<string, Buffer> {
  // Find End of Central Directory (EOCD): last 22 bytes plus optional comment.
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (
    let i = zip.length - 22;
    i >= Math.max(0, zip.length - 0xffff - 22);
    i--
  ) {
    if (zip.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error('zip: no End of Central Directory found');

  const totalEntries = zip.readUInt16LE(eocdOffset + 10);
  const cdSize = zip.readUInt32LE(eocdOffset + 12);
  const cdOffset = zip.readUInt32LE(eocdOffset + 16);

  const CFH_SIG = 0x02014b50;
  const LFH_SIG = 0x04034b50;
  const out = new Map<string, Buffer>();

  let p = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (zip.readUInt32LE(p) !== CFH_SIG) {
      throw new Error(`zip: bad central-file-header signature at ${p}`);
    }
    const compressionMethod = zip.readUInt16LE(p + 10);
    const compressedSize = zip.readUInt32LE(p + 20);
    const uncompressedSize = zip.readUInt32LE(p + 24);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localHeaderOffset = zip.readUInt32LE(p + 42);
    const name = zip.slice(p + 46, p + 46 + nameLen).toString('utf8');

    // Parse local file header to find the actual data offset.
    if (zip.readUInt32LE(localHeaderOffset) !== LFH_SIG) {
      throw new Error(`zip: bad local-file-header signature for ${name}`);
    }
    const lfhNameLen = zip.readUInt16LE(localHeaderOffset + 26);
    const lfhExtraLen = zip.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
    const dataEnd = dataStart + compressedSize;

    let data: Buffer;
    if (compressionMethod === 0) {
      data = zip.slice(dataStart, dataEnd);
    } else if (compressionMethod === 8) {
      data = inflateRawSync(zip.slice(dataStart, dataEnd));
    } else {
      throw new Error(
        `zip: unsupported compression method ${compressionMethod} for ${name}`,
      );
    }
    if (data.length !== uncompressedSize) {
      throw new Error(
        `zip: ${name} inflated size ${data.length} != expected ${uncompressedSize}`,
      );
    }
    out.set(name, data);

    p += 46 + nameLen + extraLen + commentLen;
    if (p > cdOffset + cdSize) {
      throw new Error('zip: central directory walk overran declared size');
    }
  }

  return out;
}
