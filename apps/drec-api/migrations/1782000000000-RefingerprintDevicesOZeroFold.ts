import { MigrationInterface, QueryRunner } from 'typeorm';
import { createHash } from 'node:crypto';
import { generateDeviceFingerprint } from '../src/lib/device';

/**
 * Re-fingerprint existing devices after the serial-number canonicalisation
 * change: device fingerprints now fold the letter "O" to the digit "0"
 * (see canonicalizeSerialNumber / generateDeviceFingerprint). Fingerprints
 * stored before this change used the raw (trimmed) serial, so a device whose
 * serial contains an O/o has a stale hash and would not collide with an
 * O/0-confusable twin created after the change.
 *
 * up()   recomputes each fingerprinted device's hash with the CURRENT formula
 *        (imported helper — single source of truth) and updates only the rows
 *        whose hash actually changes (i.e. serials containing O/o).
 * down() restores the pre-change hashes using a frozen inline copy of the OLD
 *        formula (serial trimmed, not folded).
 *
 * Only rows that already have a non-null fingerprint are touched — those are
 * exactly the devices that had the full set of identifying fields at create
 * time. Drafts (fingerprint NULL) are left alone so we don't retroactively
 * give them a fingerprint.
 */
export class RefingerprintDevicesOZeroFold1782000000000
  implements MigrationInterface
{
  // Columns needed to recompute a fingerprint, mapped to their DB names.
  private static readonly SELECT_SQL = `
    SELECT id,
           latitude,
           longitude,
           "commissioningDate" AS "commissioningDate",
           capacity,
           "fuelCode"          AS "fuelCode",
           "deviceTypeCode"    AS "deviceTypeCode",
           serial_number       AS "serialNumber",
           fingerprint
    FROM device
    WHERE fingerprint IS NOT NULL
  `;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{
      id: number;
      latitude: string;
      longitude: string;
      commissioningDate: string;
      capacity: number;
      fuelCode: string;
      deviceTypeCode: string;
      serialNumber: string;
      fingerprint: string;
    }> = await queryRunner.query(
      RefingerprintDevicesOZeroFold1782000000000.SELECT_SQL,
    );

    let updated = 0;
    for (const row of rows) {
      const next = generateDeviceFingerprint({
        latitude: row.latitude,
        longitude: row.longitude,
        commissioningDate: row.commissioningDate,
        capacity: row.capacity,
        fuelCode: row.fuelCode,
        deviceTypeCode: row.deviceTypeCode,
        serialNumber: row.serialNumber,
      });
      if (next === row.fingerprint) continue;
      await queryRunner.query(
        `UPDATE device SET fingerprint = $1 WHERE id = $2`,
        [next, row.id],
      );
      updated++;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[RefingerprintDevicesOZeroFold] re-fingerprinted ${updated} device(s) for O/0 folding`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const rows: Array<{
      id: number;
      latitude: string;
      longitude: string;
      commissioningDate: string;
      capacity: number;
      fuelCode: string;
      deviceTypeCode: string;
      serialNumber: string;
      fingerprint: string;
    }> = await queryRunner.query(
      RefingerprintDevicesOZeroFold1782000000000.SELECT_SQL,
    );

    let reverted = 0;
    for (const row of rows) {
      const prev = this.legacyFingerprint(row);
      if (prev === row.fingerprint) continue;
      await queryRunner.query(
        `UPDATE device SET fingerprint = $1 WHERE id = $2`,
        [prev, row.id],
      );
      reverted++;
    }

    // eslint-disable-next-line no-console
    console.log(
      `[RefingerprintDevicesOZeroFold] reverted ${reverted} device fingerprint(s) to pre-fold formula`,
    );
  }

  /**
   * Frozen copy of generateDeviceFingerprint as it existed BEFORE the O/0
   * fold (serial trimmed only). Used solely by down(); must NOT be changed to
   * track future formula edits.
   */
  private legacyFingerprint(input: {
    latitude: string;
    longitude: string;
    commissioningDate: string | Date;
    capacity: number;
    fuelCode: string;
    deviceTypeCode: string;
    serialNumber: string;
  }): string {
    const normalizedCapacity =
      input.capacity == null
        ? '0'
        : Number.parseFloat(input.capacity.toString()).toString();
    const dateOnly = input.commissioningDate
      ? new Date(input.commissioningDate).toISOString().split('T')[0]
      : '';
    const GRID = 0.0002;
    const snappedLat = input.latitude
      ? (Math.round(Number.parseFloat(input.latitude) / GRID) * GRID).toFixed(4)
      : '0';
    const snappedLng = input.longitude
      ? (Math.round(Number.parseFloat(input.longitude) / GRID) * GRID).toFixed(
          4,
        )
      : '0';
    const combinedString = [
      snappedLat,
      snappedLng,
      dateOnly,
      normalizedCapacity,
      input.fuelCode?.trim() || 'ES100',
      input.deviceTypeCode?.trim() || 'TC110',
      input.serialNumber?.trim() || '',
    ].join('|');
    return createHash('sha256').update(combinedString).digest('hex');
  }
}
