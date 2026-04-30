import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash } from 'crypto';
import {
  UploadLogEntity,
  UploadChannel,
  UploadActionType,
} from './upload-log.entity';

export interface LogFileUploadParams {
  deviceId?: number | null;
  userId: number;
  userEmail: string;
  organizationId?: number | null;
  channel?: UploadChannel;
  actionType: UploadActionType;
  fileName?: string | null;
  fileBuffer?: Buffer | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

export interface LogPayloadParams {
  deviceId?: number | null;
  userId: number;
  userEmail: string;
  organizationId?: number | null;
  channel?: UploadChannel;
  actionType: UploadActionType;
  payload: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class UploadLogService {
  private readonly logger = new Logger(UploadLogService.name);

  constructor(
    @InjectRepository(UploadLogEntity)
    private readonly repo: Repository<UploadLogEntity>,
  ) {}

  /**
   * Log a file upload (document, CSV, etc.) with SHA-256 of the file buffer.
   */
  async logFileUpload(params: LogFileUploadParams): Promise<void> {
    try {
      const entry = this.repo.create({
        deviceId: params.deviceId ?? null,
        userId: params.userId,
        userEmail: params.userEmail,
        organizationId: params.organizationId ?? null,
        channel: params.channel ?? UploadChannel.Portal,
        actionType: params.actionType,
        fileName: params.fileName ?? null,
        fileSizeBytes: params.fileBuffer?.length ?? null,
        fileHashSha256: params.fileBuffer
          ? createHash('sha256').update(params.fileBuffer).digest('hex')
          : null,
        payloadHashSha256: null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? null,
      });
      await this.repo.save(entry);
    } catch (err) {
      this.logger.error('Failed to write upload log', err);
    }
  }

  /**
   * Log an API payload submission (JSON body) with SHA-256 of the
   * canonicalized JSON. Used for meter read API submissions where
   * there is no file, only a request body.
   */
  async logPayload(params: LogPayloadParams): Promise<void> {
    try {
      const canonical = JSON.stringify(params.payload);
      const entry = this.repo.create({
        deviceId: params.deviceId ?? null,
        userId: params.userId,
        userEmail: params.userEmail,
        organizationId: params.organizationId ?? null,
        channel: params.channel ?? UploadChannel.Api,
        actionType: params.actionType,
        fileName: null,
        fileSizeBytes: null,
        fileHashSha256: null,
        payloadHashSha256: createHash('sha256').update(canonical).digest('hex'),
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        metadata: params.metadata ?? null,
      });
      await this.repo.save(entry);
    } catch (err) {
      this.logger.error('Failed to write upload log', err);
    }
  }

  /**
   * Retrieve upload log entries for a device (for audit packs).
   */
  async getByDeviceId(deviceId: number): Promise<UploadLogEntity[]> {
    return this.repo.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Retrieve upload log entries for a user.
   */
  async getByUserId(userId: number): Promise<UploadLogEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }
}
