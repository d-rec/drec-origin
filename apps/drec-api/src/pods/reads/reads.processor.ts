import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { FileService } from '../file';
import { parseMeterReadingCsv } from './parser/meter-reading-csv.parser';
import { MeasurementDTO, Unit } from '@energyweb/energy-api-influxdb';
import { ReadsService } from './reads.service';
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
    job: Job<{ fileId: string }>,
  ): Promise<{ success: number; failed: Array<{ read: any; error: string }> }> {
    const { fileId } = job.data;

    const fileContent = await this.fileService.GetuploadS3(fileId);
    const buffer = Buffer.from(fileContent.data.Body);
    const meterReads = await parseMeterReadingCsv(buffer);

    const results = {
      success: 0,
      failed: [],
    };

    for (const read of meterReads) {
      try {
        const measurement: NewIntmediateMeterReadDTO = {
          reads: [
            {
              starttimestamp: read.startTimestamp,
              endtimestamp: read.endTimestamp,
              value: read.value,
            },
          ],
          unit: Unit[read.unit as unknown as keyof typeof Unit],
          type: read.type,
        };

        await this.readsService.newstoreRead(
          read.deviceId.toString(),
          measurement,
        );
        results.success++;
      } catch (error) {
        this.logger.error(`Error processing read: ${error.message}`);
        results.failed.push({
          read,
          error: error.message,
        });
      }
    }

    return results;
  }
}
