import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import {
  MeterReadingCSV,
  parseMeterReadingCsv,
} from './parser/meter-reading-csv.parser';
import { ReadsService } from './reads.service';
import { FileProcessingStatus } from '../file/file-processing.entity';
import { NewIntmediateMeterReadDTO } from './dto/intermediate_meter_read.dto';

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
    try {
      this.logger.debug(
        `Starting job processing for fileId: ${job.data.fileId}`,
      );

      const fileContent = await this.fileService.GetuploadS3(s3Id);
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
          await this.readsService.newstoreRead(record.deviceId, measurement);
          readsCount++;
        } catch (error) {
          this.logger.error(`Error processing read: ${error.message}`);
          this.readsService.storeFailedReads(
            record.deviceId,
            record.reads[readsCount].value,
            record.reads[readsCount].endtimestamp,
            record.unit,
          );
        }
      }
      await this.readsService.fileProcessingRepository.update(
        { fileId: fileId },
        { status: FileProcessingStatus.Completed },
      );
      return;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      await this.readsService.fileProcessingRepository.update(
        { fileId: fileId },
        { status: FileProcessingStatus.Failed },
      );
      throw error;
    }
  }
}
