import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Queues } from '../../../utils/enums/queues.enum';
import { LateOngoingIssuanceService } from '../services/late-ongoing-issuance.service';

@Processor(Queues.MissingCycles)
export class MissingCyclesProcessor {
  private readonly logger = new Logger(MissingCyclesProcessor.name);
  constructor(
    private readonly lateOngoingIssuanceService: LateOngoingIssuanceService,
  ) {}

  @Process({ concurrency: 1 })
  async processMissingCycles(job: Job<{ groupId: number }>): Promise<void> {
    const { groupId } = job.data;
    this.logger.debug(`Processing missing cycles for group: ${groupId}`);
    try {
      await this.lateOngoingIssuanceService.createMissingCycles(groupId);
    } catch (error) {
      this.logger.error(`Error processing group ${groupId}`, error.stack);
    }
  }
}
