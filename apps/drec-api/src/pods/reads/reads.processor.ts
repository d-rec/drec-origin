import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import {
  MeterReadingCSV,
  parseMeterReadingCsv,
} from './parser/meter-reading-csv.parser';
import { ReadsService } from './reads.service';
import { BulkUploadStatus } from '../file/bulk-uploads.entity';

@Processor('reads-queue')
export class ReadsProcessor {
  private readonly logger = new Logger(ReadsProcessor.name);

  constructor(
    private readonly readsService: ReadsService,
    private readonly fileService: FileService,
  ) {}

  @Process('meter-reads-csv')
  async handleMeterReadsProcessing(
    job: Job<{ fileId: string; s3Id: string }>,
  ): Promise<{ success: number; failed: Array<{ read: any; error: string }> }> {
    const { fileId, s3Id } = job.data;
    await this.readsService.bulkUploadRepository.update(
      { fileId: fileId },
      { jobId: job.id.toString() },
    );
    const bulkUpload = await this.readsService.bulkUploadRepository.findOne({
      where: { fileId: fileId },
    });
    try {
      this.logger.debug(
        `Starting job processing for fileId: ${job.data.fileId}`,
      );

      const fileContent = await this.fileService.getUploadS3(s3Id);
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
      await this.readsService.bulkUploadRepository.update(
        { fileId: fileId },
        { status: BulkUploadStatus.Completed },
      );
      return;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
      await this.readsService.bulkUploadRepository.update(
        { fileId: fileId },
        { status: BulkUploadStatus.Failed },
      );
      if (bulkUpload) {
        await this.readsService.storeFailedLogsBulkUpload(bulkUpload.id, error);
      }
      throw error;
    }
  }
}
