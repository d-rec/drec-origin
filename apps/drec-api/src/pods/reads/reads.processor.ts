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
import { BulkUploadStatus } from '../bulk-upload/bulk-uploads.entity';

@Processor('reads-queue')
export class ReadsProcessor {
  private readonly logger = new Logger(ReadsProcessor.name);

  constructor(
    private readonly readsService: ReadsService,
    private readonly fileService: FileService,
    private readonly bulkUploadService: BulkUploadService,
  ) {}

  @Process('meter-reads-bulk-upload')
  async handleMeterReadsProcessing(
    job: Job<{ fileId: string; s3Key: string }>,
  ): Promise<{ success: number; failed: Array<{ read: any; error: string }> }> {
    const { fileId, s3Key } = job.data;
    this.logger.debug(`Processing file with s3Key: ${s3Key}`);
    await this.bulkUploadService.bulkUploadRepository.update(
      { fileId: fileId },
      { jobId: job.id.toString() },
    );
    const bulkUpload =
      await this.bulkUploadService.bulkUploadRepository.findOne({
        where: { fileId: fileId },
      });
    try {
      this.logger.debug(
        `Starting job processing for fileId: ${job.data.fileId}`,
      );

      const fileContent = await this.fileService.getUploadS3(s3Key);
      const buffer = Buffer.from(fileContent.data.Body);
      const meterReads = await parseMeterReadingCsv(buffer);

      for (const record of meterReads) {
        let readsCount = 0;
        try {
          const measurement: MeterReadingCSV = {
            type: record.type,
            reads: [
              {
                starttimestamp: record.reads[readsCount].starttimestamp,
                endtimestamp: record.reads[readsCount].endtimestamp,
                value: record.reads[readsCount].value,
              },
            ],
            unit: record.unit,
            timezone: record.timezone,
            deviceId: record.deviceId,
          };
          await this.readsService.newStoreRead(record.deviceId, measurement);
          readsCount++;
        } catch (error) {
          this.logger.error(`Error processing read: ${error.message}`);
          this.readsService.storeFailedReads(
            record.deviceId,
            record.reads[readsCount].value,
            record.reads[readsCount].endtimestamp,
            record.unit,
          );
          throw error.message;
        }
      }
      await this.bulkUploadService.bulkUploadRepository.update(
        { fileId: fileId },
        { status: BulkUploadStatus.Completed },
      );
      return;
    } catch (error) {
      this.logger.error(`Failed to process file: ${error}`);
      await this.bulkUploadService.bulkUploadRepository.update(
        { fileId: fileId },
        { status: BulkUploadStatus.Failed },
      );
      if (bulkUpload) {
        await this.bulkUploadService.storeFailedLogBulkUpload(
          bulkUpload.id,
          error,
        );
      }
      throw error;
    }
  }
}
