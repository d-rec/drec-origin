import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Queues } from '../../utils/enums/queues.enum';
import { LateOngoingIssuanceService } from './late-ongoing-issuance.service';

@Processor(Queues.LateOngoingIssuance)
export class LateOngoingIssuanceProcessor {
  private readonly logger = new Logger(LateOngoingIssuanceProcessor.name);
  constructor(private readonly lateOngoingIssuanceService: LateOngoingIssuanceService) {}

  @Process({ concurrency: 1 })
  async processLateOngoingIssuance(
    job: Job<{ groupId: number }>,
  ): Promise<void> {
    const { groupId } = job.data;
    this.logger.debug(`Processing late ongoing issuance for group: ${groupId}`);
    try {
      await this.lateOngoingIssuanceService.processIssuance(groupId);
    } catch (error) {
      this.logger.error(`Error processing group ${groupId}`, error.stack);
    }
  }
}
