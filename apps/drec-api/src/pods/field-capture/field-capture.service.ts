import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { FieldCapture, FieldCaptureStatus } from './field-capture.entity';
import { Device } from '../device/device.entity';
import { DeviceService } from '../device/device.service';
import { FileService } from '../file/file.service';
import { CreateFieldCaptureDTO } from './dto/create-field-capture.dto';
import {
  ApproveFieldCaptureDTO,
  RejectFieldCaptureDTO,
} from './dto/review-field-capture.dto';
import { NewDeviceDTO } from '../device/dto/new-device.dto';
import { ILoggedInUser } from '../../models';
import { Role } from '../../utils/enums/role.enum';
import { rankSerialCandidates, SerialMatch } from './ocr-confusables';

/** Photos land under their own prefix so they are easy to lifecycle later. */
const PHOTO_SUBFOLDER = 'field-capture';

/**
 * Above this the GPS fix is too coarse to place a device, and the reviewer is
 * told so. Not a hard rejection: a bad fix with a good nameplate photo is still
 * worth having, and the reviewer can place the site from the photo and the
 * group's known location.
 */
const GPS_ACCURACY_WARN_M = 100;

@Injectable()
export class FieldCaptureService {
  private readonly logger = new Logger(FieldCaptureService.name);

  constructor(
    @InjectRepository(FieldCapture)
    private readonly repository: Repository<FieldCapture>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly deviceService: DeviceService,
    private readonly fileService: FileService,
  ) {}

  /**
   * Store a capture. Idempotent on `clientCaptureId`: the capture screen
   * queues offline and retries, so a repeat upload of the same photo must not
   * produce a second pending row. The stored capture is returned unchanged,
   * including when it has already been reviewed.
   */
  public async create(
    user: ILoggedInUser,
    dto: CreateFieldCaptureDTO,
    photo: Express.Multer.File,
  ): Promise<FieldCapture> {
    const existing = await this.repository.findOne({
      where: { clientCaptureId: dto.clientCaptureId },
    });
    if (existing) {
      this.logger.log(
        `Capture ${dto.clientCaptureId} already stored as ${existing.uuid}; returning it`,
      );
      return existing;
    }

    if (!photo) {
      throw new BadRequestException('A nameplate photo is required');
    }

    const payload = dto.payload ?? {};

    // Site names are unique platform-wide, so check it now rather than letting
    // the operator discover the collision after walking away from the site.
    if (payload.siteName) {
      const clash = await this.deviceRepository.findOne({
        where: { siteName: payload.siteName },
      });
      if (clash) {
        throw new ConflictException({
          success: false,
          message: `A device with site name "${payload.siteName}" already exists`,
        });
      }
    }

    const upload = await this.fileService.upload(photo, PHOTO_SUBFOLDER);
    const photoKey: string | undefined = upload?.Key ?? upload?.key;
    if (!photoKey) {
      throw new BadRequestException('Photo upload failed');
    }

    // An exact hit means the operator is in front of hardware we already know
    // about. Recorded, not rejected: a re-scan of a known device is useful
    // evidence, and a near miss is how a swapped unit shows up.
    const matches = await this.findSerialCandidates(
      user.organizationId,
      dto.serialNumber,
    );
    const exact = matches.find((m) => m.kind === 'exact');

    const capture = this.repository.create({
      clientCaptureId: dto.clientCaptureId,
      organizationId: user.organizationId,
      submittedByEmail: user.email,
      status: FieldCaptureStatus.Pending,
      serialNumber: dto.serialNumber.trim(),
      serialRaw: dto.serialRaw ?? null,
      serialSource: dto.serialSource,
      ocrConfidence: dto.ocrConfidence ?? null,
      latitude: dto.latitude,
      longitude: dto.longitude,
      gpsAccuracyM: dto.gpsAccuracyM ?? null,
      photoKey,
      payload,
      matchedDeviceId: exact ? exact.deviceId : null,
      capturedAt: dto.capturedAt ? new Date(dto.capturedAt) : null,
    });

    const saved = await this.repository.save(capture);

    if (
      saved.gpsAccuracyM != null &&
      saved.gpsAccuracyM > GPS_ACCURACY_WARN_M
    ) {
      this.logger.warn(
        `Capture ${saved.uuid}: GPS accuracy ${saved.gpsAccuracyM}m exceeds ` +
          `${GPS_ACCURACY_WARN_M}m — reviewer will need to place this site`,
      );
    }

    return saved;
  }

  /**
   * Serials we already hold that could be what the camera saw, ranked by edit
   * distance over confusable-folded keys. Scoped to the operator's own
   * organization — a near match in someone else's fleet is not information the
   * operator is entitled to.
   */
  public async findSerialCandidates(
    organizationId: number,
    scanned: string,
  ): Promise<SerialMatch[]> {
    if (!scanned?.trim()) return [];

    const known = await this.deviceRepository.find({
      where: { organizationId, serialNumber: Not(IsNull()) },
      select: ['id', 'serialNumber', 'externalId', 'siteName'],
    });

    return rankSerialCandidates(scanned, known as any);
  }

  public async findOneByUuid(uuid: string): Promise<FieldCapture> {
    const capture = await this.repository.findOne({ where: { uuid } });
    if (!capture) {
      throw new NotFoundException(`Capture ${uuid} not found`);
    }
    return capture;
  }

  /** A capture plus a short-lived signed URL for its photo. */
  public async findOneWithPhoto(
    uuid: string,
  ): Promise<FieldCapture & { photoUrl: string }> {
    const capture = await this.findOneByUuid(uuid);
    const photoUrl = await this.fileService.getSignedUrl(capture.photoKey);
    return { ...capture, photoUrl };
  }

  public async findMany(filter: {
    status?: FieldCaptureStatus;
    organizationId?: number;
  }): Promise<FieldCapture[]> {
    const where: Record<string, any> = {};
    if (filter.status) where.status = filter.status;
    if (filter.organizationId != null) {
      where.organizationId = filter.organizationId;
    }
    return this.repository.find({ where, order: { createdAt: 'DESC' } });
  }

  /**
   * Approve a capture and create the device. This is the only path from a
   * capture to a `device` row.
   */
  public async approve(
    reviewer: ILoggedInUser,
    uuid: string,
    dto: ApproveFieldCaptureDTO,
  ): Promise<FieldCapture> {
    const capture = await this.findOneByUuid(uuid);
    if (capture.status !== FieldCaptureStatus.Pending) {
      throw new ConflictException(
        `Capture ${uuid} is already ${capture.status}`,
      );
    }

    const serialNumber = (dto.serialNumber ?? capture.serialNumber).trim();
    const payload = { ...capture.payload, ...(dto.payload ?? {}) };

    const newDevice: NewDeviceDTO = {
      ...payload,
      serialNumber,
      latitude: capture.latitude,
      longitude: capture.longitude,
    } as NewDeviceDTO;

    // register() owns the serial/siteName uniqueness checks and the
    // fingerprint; let its ConflictException surface rather than duplicating
    // the rules here.
    const device = await this.deviceService.register(
      capture.organizationId,
      newDevice,
      await this.photoAsRegistrationFile(capture),
      undefined,
      Role.SiteOperator,
    );

    await this.recordCaptureProvenance(device.id, capture, serialNumber);

    capture.status = FieldCaptureStatus.Approved;
    capture.serialNumber = serialNumber;
    capture.payload = payload;
    capture.deviceId = device.id;
    capture.reviewNote = dto.reviewNote ?? null;
    capture.reviewedByEmail = reviewer.email;
    capture.reviewedAt = new Date();
    const saved = await this.repository.save(capture);

    await this.audit(device.id, 'FIELD_CAPTURE_APPROVED', reviewer, capture, {
      serialSubmitted: capture.serialRaw ?? capture.serialNumber,
      serialAccepted: serialNumber,
      correctedByReviewer: dto.serialNumber != null,
    });

    return saved;
  }

  public async reject(
    reviewer: ILoggedInUser,
    uuid: string,
    dto: RejectFieldCaptureDTO,
  ): Promise<FieldCapture> {
    const capture = await this.findOneByUuid(uuid);
    if (capture.status !== FieldCaptureStatus.Pending) {
      throw new ConflictException(
        `Capture ${uuid} is already ${capture.status}`,
      );
    }

    capture.status = FieldCaptureStatus.Rejected;
    capture.reviewNote = dto.reviewNote;
    capture.reviewedByEmail = reviewer.email;
    capture.reviewedAt = new Date();
    const saved = await this.repository.save(capture);

    await this.audit(null, 'FIELD_CAPTURE_REJECTED', reviewer, capture, {
      reason: dto.reviewNote,
    });

    return saved;
  }

  /**
   * Re-wrap the stored photo as a multipart file so `register()` attaches it to
   * the device as a project photo. Without this the nameplate image stays
   * reachable only through the capture record, which defeats the point of
   * having an operator photograph it.
   */
  private async photoAsRegistrationFile(
    capture: FieldCapture,
  ): Promise<Parameters<DeviceService['register']>[2]> {
    try {
      const object = await this.fileService.getUploadS3(capture.photoKey);
      const buffer: Buffer = object?.data?.Body;
      if (!buffer) return null;
      const filename = capture.photoKey.split('/').pop() ?? 'nameplate.jpg';
      return {
        PROJECT_PHOTOS: [
          {
            fieldname: 'PROJECT_PHOTOS',
            originalname: filename,
            encoding: '7bit',
            mimetype: object?.data?.ContentType || 'image/jpeg',
            buffer,
            size: buffer.length,
          } as Express.Multer.File,
        ],
      };
    } catch (error) {
      // A missing photo should not block a device the reviewer has already
      // decided to accept — the capture row still holds the key.
      this.logger.warn(
        `Capture ${capture.uuid}: could not re-attach photo ${capture.photoKey}: ${
          (error as Error)?.message
        }`,
      );
      return null;
    }
  }

  /**
   * Mark the fields that came from the field capture as document-backed.
   *
   * This runs on the ADD path, which is exactly where `field_provenance` has
   * historically been dropped: on create it was never persisted and the
   * extraction arrays were cleared, so every field read MANUAL. A serial read
   * off a photographed nameplate is better evidence than a typed one, and the
   * provenance report is where a reviewer sees that.
   */
  private async recordCaptureProvenance(
    deviceId: number,
    capture: FieldCapture,
    serialNumber: string,
  ): Promise<void> {
    const at = new Date().toISOString();
    const entry = (value: any, confidence: number) => ({
      source: 'FIELD_CAPTURE',
      confidence,
      at,
      value,
      captureUuid: capture.uuid,
    });

    // Barcode decodes are exact; an OCR burst is only as good as its agreement.
    const serialConfidence =
      capture.serialSource === 'barcode' ? 1 : capture.ocrConfidence ?? 0.5;

    const provenance: Record<string, any> = {
      serialNumber: entry(serialNumber, serialConfidence),
      latitude: entry(capture.latitude, this.gpsConfidence(capture)),
      longitude: entry(capture.longitude, this.gpsConfidence(capture)),
    };

    try {
      await this.deviceRepository.query(
        `UPDATE device
            SET field_provenance = COALESCE(field_provenance, '{}'::jsonb) || $1::jsonb
          WHERE id = $2`,
        [JSON.stringify(provenance), deviceId],
      );
    } catch (error) {
      this.logger.error(
        `Device ${deviceId}: failed to record capture provenance: ${
          (error as Error)?.message
        }`,
      );
    }
  }

  /** Coarser fix, lower confidence. Linear and deliberately crude. */
  private gpsConfidence(capture: FieldCapture): number {
    const accuracy = capture.gpsAccuracyM;
    if (accuracy == null) return 0.5;
    if (accuracy <= 10) return 1;
    if (accuracy >= 500) return 0.1;
    return Math.max(0.1, 1 - accuracy / 500);
  }

  /**
   * Append to the IDAL audit log. Raw INSERT, matching device-reviews: the
   * `AuditLog` entity exists but is deliberately not registered with the
   * DataSource, and the table is append-only.
   */
  private async audit(
    deviceId: number | null,
    actionType: string,
    reviewer: ILoggedInUser,
    capture: FieldCapture,
    metadata: Record<string, any>,
  ): Promise<void> {
    try {
      await this.deviceRepository.query(
        `INSERT INTO audit_log (device_id, action_type, detail, performed_by, metadata)
         VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [
          deviceId ?? 0,
          actionType,
          `Field capture ${capture.uuid} (${capture.serialNumber})`,
          reviewer.email,
          JSON.stringify({
            ...metadata,
            captureUuid: capture.uuid,
            submittedBy: capture.submittedByEmail,
            serialSource: capture.serialSource,
            ocrConfidence: capture.ocrConfidence,
            gpsAccuracyM: capture.gpsAccuracyM,
            photoKey: capture.photoKey,
          }),
        ],
      );
    } catch (error) {
      this.logger.warn(
        `Could not write audit log for capture ${capture.uuid}: ${
          (error as Error)?.message
        }`,
      );
    }
  }
}
