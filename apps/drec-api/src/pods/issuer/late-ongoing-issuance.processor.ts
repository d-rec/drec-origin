import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { IssuerService } from './issuer.service';
import { Logger } from '@nestjs/common';
import { Queues } from '../../../src/utils/enums/queues.enum';

@Processor(Queues.LateOngoingIssuance)
export class LateOngoingIssuanceProcessor {
  private readonly logger = new Logger(LateOngoingIssuanceProcessor.name);
  constructor(private readonly issuerService: IssuerService) {}

  @Process({ concurrency: 5 })
  async processLateOngoingIssuance(
    job: Job<{ groupId: number }>,
  ): Promise<void> {
    const { groupId } = job.data;
    this.logger.debug(`Processing late ongoing issuance for group: ${groupId}`);

    try {
      await this.issuerService.handleCronForOngoingLateIssuance(groupId);
    } catch (error) {
      this.logger.error(`Error processing group ${groupId}`, error.stack);
    }
  }
}
