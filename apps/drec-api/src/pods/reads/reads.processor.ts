import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import {
  MeterReadingCSV,
  parseMeterReadingCsv,
} from './parser/meter-reading-csv.parser';
import { ReadsService } from './reads.service';
import { BulkUploadService } from '../bulk-upload/bulk-upload.service';
import {
  BulkUploadEntity,
  BulkUploadStatus,
} from '../bulk-upload/bulk-uploads.entity';
import { BullConfig } from '../../config/bull.config';

@Processor(BullConfig.queues.reads)
export class ReadsProcessor {
  private readonly logger = new Logger(ReadsProcessor.name);

  constructor(
    private readonly readsService: ReadsService,
    private readonly fileService: FileService,
    private readonly bulkUploadService: BulkUploadService,
  ) {}

  @Process(BullConfig.jobNames.readsBulkUpload)
  async handleMeterReadsProcessing(
    job: Job<{ fileId: string; s3Key: string }>,
  ): Promise<{ success: number; failed: Array<{ read: any; error: string }> }> {
    const { fileId, s3Key } = job.data;
    this.logger.debug(`Processing file with s3Key: ${s3Key}`);
    const bulkUpload =
      await this.bulkUploadService.bulkUploadRepository.findOne({
        where: { jobId: job.id.toString() },
      });

    if (!bulkUpload) {
      this.logger.error(`Bulk upload not found for jobId: ${job.id}`);
      return;
    }

    try {
      this.logger.debug(
        `Starting job processing for fileId: ${job.data.fileId}`,
      );

      const fileContent = await this.fileService.getUploadS3(s3Key);
      const buffer = Buffer.from(fileContent.data.Body);
      const meterReads = await parseMeterReadingCsv(buffer);

      await this.bulkUploadService.bulkUploadRepository.update(
        { jobId: job.id.toString() },
        { status: BulkUploadStatus.InProgress },
      );

      await this.processReads(meterReads, bulkUpload);

      await this.bulkUploadService.bulkUploadRepository.update(
        { jobId: job.id.toString() },
        { status: BulkUploadStatus.Completed },
      );
    } catch (error) {
      this.logger.error(`Failed to process file: ${error}`);
      await Promise.all([
        this.bulkUploadService.bulkUploadRepository.update(
          { jobId: job.id.toString() },
          { status: BulkUploadStatus.Failed },
        ),
        this.bulkUploadService.storeFailedLogBulkUpload(bulkUpload.id, error),
      ]);
    }
  }

  async processReads(
    meterReads: MeterReadingCSV[],
    bulkUpload: BulkUploadEntity,
  ): Promise<void> {
    for (const record of meterReads) {
      try {
        await this.readsService.validateAndStoreReads({
          deviceExternalId: record.deviceExternalId,
          measurements: record.measurements,
          organizationId: bulkUpload.organizationId,
        });
      } catch (error) {
        this.logger.error(`Error processing read: ${error.message}`);
        throw error.message;
      }
    }
  }
}
