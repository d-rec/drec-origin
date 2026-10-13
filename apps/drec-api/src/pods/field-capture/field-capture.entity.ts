import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum FieldCaptureStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

/** How the serial on a capture was obtained. */
export enum SerialSource {
  /** Decoded from a Code128/QR on the nameplate — exact. */
  Barcode = 'barcode',
  /** Read by OCR and accepted unchanged by the operator. */
  Ocr = 'ocr',
  /** Read by OCR, then edited by the operator before submitting. */
  OcrCorrected = 'ocr-corrected',
  /** Typed from scratch (no camera, or nothing legible). */
  Manual = 'manual',
}

/**
 * A nameplate capture taken in the field by a site operator: one photo, one
 * serial, one GPS fix, plus the handful of fields a device cannot do without.
 *
 * Deliberately NOT a `device` row. A capture carries no authority — it becomes
 * a device only when a reviewer approves it, at which point `deviceId` is set
 * and the capture turns into the provenance record for that device's serial,
 * coordinates and photo.
 */
@Entity({ name: 'field_capture' })
export class FieldCapture {
  @PrimaryGeneratedColumn()
  id: number;

  /** Stable public identifier — what a reviewer link contains. */
  @Column({ type: 'uuid', generated: 'uuid', unique: true })
  @Index({ unique: true })
  uuid: string;

  /**
   * Idempotency key minted on the phone before the first upload attempt.
   *
   * The capture screen queues offline and retries, so without this a flaky
   * uplink turns one panel into three pending captures. A repeat POST with a
   * key we have already stored returns the existing row untouched.
   */
  @Column({ name: 'client_capture_id', type: 'uuid', unique: true })
  @Index({ unique: true })
  clientCaptureId: string;

  @Column({ name: 'organization_id' })
  @Index()
  organizationId: number;

  @Column({ name: 'submitted_by_email' })
  submittedByEmail: string;

  @Column({
    type: 'varchar',
    default: FieldCaptureStatus.Pending,
  })
  @Index()
  status: FieldCaptureStatus;

  /** The serial as submitted — OCR output after any operator correction. */
  @Column({ name: 'serial_number' })
  serialNumber: string;

  /**
   * What the reader actually produced, before correction. Kept separately so a
   * reviewer can see that the operator overrode the scan, and so we can measure
   * how often OCR is wrong without re-deriving it from logs.
   */
  @Column({ name: 'serial_raw', type: 'varchar', nullable: true })
  serialRaw: string | null;

  @Column({ name: 'serial_source', type: 'varchar' })
  serialSource: SerialSource;

  /**
   * Agreement across the OCR burst, 0–1. Null for barcode and manual entry,
   * where the concept does not apply.
   */
  @Column({
    name: 'ocr_confidence',
    type: 'double precision',
    nullable: true,
  })
  ocrConfidence: number | null;

  @Column({ type: 'varchar' })
  latitude: string;

  @Column({ type: 'varchar' })
  longitude: string;

  /**
   * `GeolocationCoordinates.accuracy`, in metres. Stored and shown to the
   * reviewer rather than discarded: a 2,000 m fix and a 6 m fix are not the
   * same evidence, and on iOS a browser without Precise Location still
   * returns a plausible-looking coordinate.
   */
  @Column({ name: 'gps_accuracy_m', type: 'double precision', nullable: true })
  gpsAccuracyM: number | null;

  /** S3 key of the nameplate photo. */
  @Column({ name: 'photo_key' })
  photoKey: string;

  /**
   * The partial device payload (capacity, commissioningDate, fuelCode,
   * deviceTypeCode, siteName, …) as submitted. Held as jsonb rather than
   * columns because the reviewer may edit any of it at approval time and the
   * device DTO keeps growing.
   */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  payload: Record<string, any>;

  /**
   * Existing device whose serial matches this capture, if any. Set at submit
   * time: a hit means the operator is standing in front of hardware we already
   * know about, which is a verification, not a registration.
   */
  @Column({ name: 'matched_device_id', type: 'int', nullable: true })
  matchedDeviceId: number | null;

  /** Device created from this capture on approval. */
  @Column({ name: 'device_id', type: 'int', nullable: true })
  @Index()
  deviceId: number | null;

  @Column({ name: 'review_note', type: 'text', nullable: true })
  reviewNote: string | null;

  @Column({ name: 'reviewed_by_email', type: 'varchar', nullable: true })
  reviewedByEmail: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  /** When the phone took the photo, as opposed to when the upload landed. */
  @Column({ name: 'captured_at', type: 'timestamptz', nullable: true })
  capturedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
