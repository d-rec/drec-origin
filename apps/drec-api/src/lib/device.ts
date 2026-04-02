import { createHash } from 'crypto';

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
  const dateOnly = new Date(commissioningDate).toISOString().split('T')[0];

  // Snap coords to nearest 0.0002° (~22m grid) so minor GPS drift
  // doesn't produce different fingerprints for the same physical site.
  const GRID = 0.0002;
  const snappedLat = (Math.round(parseFloat(latitude) / GRID) * GRID).toFixed(4);
  const snappedLng = (Math.round(parseFloat(longitude) / GRID) * GRID).toFixed(4);

  const combinedString = [
    snappedLat,
    snappedLng,
    dateOnly,
    normalizedCapacity,
    fuelCode?.trim() || 'ES100',
    deviceTypeCode?.trim() || 'TC110',
    serialNumber?.trim() || '',
  ].join('|');
  return createHash('sha256').update(combinedString).digest('hex');
}

// Helper to normalize decimal values (e.g., 10.0 → 10, 10.50 → 10.5)
function removeTrailingZeroes(value: number): string {
  return parseFloat(value.toString()).toString();
}
