import { Process, Processor } from '@nestjs/bull';
import { ReadsService } from './reads.service';
import { Job } from 'bull';

@Processor('reads-queue')
export class ReadsProcessor {
  constructor(private readsService: ReadsService) {}

  @Process('meter-reads-csv')
  async handleMeterReadsProcessing(job: Job): Promise<void> {
    const { fileId } = job.data;
    await this.readsService.processMeterReadsFile(fileId);
  }
}
