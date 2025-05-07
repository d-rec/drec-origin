import { createHash } from 'crypto';

interface DeviceFingerprintInput {
  latitude: string;
  longitude: string;
  commissioningDate: string | Date;
  capacity: number;
  fuelCode: string;
  deviceTypeCode: string;
  energyStorage: number | null;
}

export function generateDeviceFingerprint(input: DeviceFingerprintInput): string {
  const {
    latitude,
    longitude,
    commissioningDate,
    capacity,
    fuelCode,
    deviceTypeCode,
    energyStorage,
  } = input;

  // Normalize and sanitize inputs
  const normalizedCapacity = stripTrailingZeroes(capacity);
  const normalizedEnergyStorage = energyStorage == null ? 0 : stripTrailingZeroes(energyStorage);

  const combinedString = [
    latitude,
    longitude,
    commissioningDate,
    normalizedCapacity,
    fuelCode.trim(),
    deviceTypeCode.trim(),
    normalizedEnergyStorage,
  ].join('|');

  console.log("data", combinedString)

  return createHash('sha256').update(combinedString).digest('hex');
}

// Helper to normalize decimal values (e.g., 10.0 → 10, 10.50 → 10.5)
function stripTrailingZeroes(value: number): string {
  return parseFloat(value.toString()).toString();
}
