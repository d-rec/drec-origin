import { createHash } from 'node:crypto';

interface DeviceFingerprintInput {
  latitude: string;
  longitude: string;
  commissioningDate: string | Date;
  capacity: number;
  fuelCode: string;
  serialNumber: string;
  deviceTypeCode: string;
}

export function generateDeviceFingerprint(
  input: DeviceFingerprintInput,
): string {
  const {
    latitude,
    longitude,
    commissioningDate,
    capacity,
    fuelCode,
    deviceTypeCode,
    serialNumber,
  } = input;

  // Normalize and sanitize inputs
  const normalizedCapacity = removeTrailingZeroes(capacity);
  const dateOnly = commissioningDate
    ? new Date(commissioningDate).toISOString().split('T')[0]
    : '';

  // Snap coords to nearest 0.0002° (~22m grid) so minor GPS drift
  // doesn't produce different fingerprints for the same physical site.
  const GRID = 0.0002;
  const snappedLat = latitude
    ? (Math.round(Number.parseFloat(latitude) / GRID) * GRID).toFixed(4)
    : '0';
  const snappedLng = longitude
    ? (Math.round(Number.parseFloat(longitude) / GRID) * GRID).toFixed(4)
    : '0';

  const combinedString = [
    snappedLat,
    snappedLng,
    dateOnly,
    normalizedCapacity,
    fuelCode?.trim() || 'ES100',
    deviceTypeCode?.trim() || 'TC110',
    // Fold the letter O to digit 0 so an O/0 transcription variant of the
    // same serial yields the same fingerprint (see canonicalizeSerialNumber).
    canonicalizeSerialNumber(serialNumber),
  ].join('|');
  return createHash('sha256').update(combinedString).digest('hex');
}

// Helper to normalize decimal values (e.g., 10.0 → 10, 10.50 → 10.5)
function removeTrailingZeroes(value: number): string {
  if (value == null) return '0';
  return Number.parseFloat(value.toString()).toString();
}

// SQL fragment matching canonicalizeSerialNumber(), for use in query-time
// duplicate checks against the device.serial_number column. Keep the two in
// sync. `col` is the already-quoted column reference (e.g. "device"."serial_number").
export const serialNumberCanonicalSql = (col: string): string =>
  `REPLACE(REPLACE(${col}, 'O', '0'), 'o', '0')`;

/**
 * Canonical form of a serial number for DUPLICATE detection only.
 *
 * Folds the letter "O" (both cases) to the digit "0": the two are visually
 * confusable and registrants routinely transcribe one for the other, so
 * "ABCO123" and "ABC0123" denote the same physical device and must be caught
 * as duplicates. Only the O↔0 confusable is folded — overall case is left
 * untouched so unrelated identifiers aren't collapsed.
 *
 * NOT for device lookup/resolution (resolveDeviceKey, update, etc.), which
 * require an exact identifier — only for the duplicate-screening paths.
 */
export function canonicalizeSerialNumber(serialNumber: string): string {
  return (serialNumber ?? '').trim().replace(/[Oo]/g, '0');
}
