import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import { BulkUploadService } from '../bulk-upload/bulk-upload.service';
import { BulkUploadStatus } from '../bulk-upload/bulk-uploads.entity';
import { DeviceGroupService } from './device-group.service';

@Processor('device-queue')
export class DeviceProcessor {
  private readonly logger = new Logger(DeviceProcessor.name);

  constructor(
    private readonly fileService: FileService,
    private readonly bulkUploadService: BulkUploadService,
    private readonly deviceGroupService: DeviceGroupService,
  ) {}
  @Process('device-bulk-upload')
  async handleMeterReadsProcessing(
    job: Job<{ fileId: string; s3Key: string }>,
  ): Promise<any> {
    const { fileId, s3Key } = job.data;
    const bulkUpload =
      await this.bulkUploadService.bulkUploadRepository.findOne({
        where: { jobId: job.id.toString() },
      });

    if (!bulkUpload) {
      this.logger.error(`Bulk upload not found for jobId: ${job.id}`);
      return;
    }
    try {
      const fileContent = await this.fileService.getUploadS3(s3Key);
      return await this.deviceGroupService.processCsvFileAnotherLibrary(
        fileContent,
        bulkUpload.organizationId,
        bulkUpload,
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
}
