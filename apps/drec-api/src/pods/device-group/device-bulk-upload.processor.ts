import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import { BulkUploadService } from '../bulk-upload/bulk-upload.service';
import {
  BulkUploadStatus,
  BulkUploadType,
} from '../bulk-upload/bulk-uploads.entity';
import { DeviceGroupService } from './device-group.service';
import { Queues } from '../../utils/enums/queues.enum';

@Processor(Queues.DeviceBulkUpload)
export class DeviceBulkUploadProcessor {
  private readonly logger = new Logger(DeviceBulkUploadProcessor.name);

  constructor(
    private readonly fileService: FileService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly deviceGroupService: DeviceGroupService,
  ) {}

  @Process({ concurrency: 1 })
  async process(job: Job<{ s3Key: string }>): Promise<any> {
    const tStart = Date.now();
    const queueWaitMs =
      job.processedOn && job.timestamp ? job.processedOn - job.timestamp : -1;
    this.logger.log(
      `[BULK-TIMING] jobId=${job.id} picked up (queue wait=${queueWaitMs}ms)`,
    );
    const { s3Key } = job.data;
    const tLookup = Date.now();
    const bulkUpload =
      await this.bulkUploadService.bulkUploadRepository.findOne({
        where: {
          jobId: job.id.toString(),
          type: BulkUploadType.Devices,
        },
      });
    this.logger.log(
      `[BULK-TIMING] jobId=${job.id} bulkUpload lookup=${Date.now() - tLookup}ms`,
    );
    if (!bulkUpload) {
      this.logger.error(`Bulk upload not found for jobId: ${job.id}`);
      return;
    }
    try {
      const tS3 = Date.now();
      const fileContent = await this.fileService.getUploadS3(s3Key);
      this.logger.log(
        `[BULK-TIMING] jobId=${job.id} S3 fetch=${Date.now() - tS3}ms`,
      );
      const tCsv = Date.now();
      const result = await this.deviceGroupService.processCsvFileAnotherLibrary(
        fileContent,
        bulkUpload.organizationId,
        bulkUpload,
      );
      this.logger.log(
        `[BULK-TIMING] jobId=${job.id} CSV processing=${Date.now() - tCsv}ms, total=${Date.now() - tStart}ms`,
      );
      return result;
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
}
