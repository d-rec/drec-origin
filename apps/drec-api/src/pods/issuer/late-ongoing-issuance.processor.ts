import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { IssuerService } from './issuer.service';
import { Logger } from '@nestjs/common';
import { Queues } from '../../utils/enums/queues.enum';

@Processor(Queues.LateOngoingIssuance)
export class LateOngoingIssuanceProcessor {
  private readonly logger = new Logger(LateOngoingIssuanceProcessor.name);
  constructor(private readonly issuerService: IssuerService) {}

  @Process({ concurrency: 1 })
  async processLateOngoingIssuance(
    job: Job<{ groupId: number }>,
  ): Promise<void> {
    const { groupId } = job.data;
    this.logger.debug(`Processing late ongoing issuance for group: ${groupId}`);
    try {
      await this.issuerService.triggerOngoingLateIssuance(groupId);
    } catch (error) {
      this.logger.error(`Error processing group ${groupId}`, error.stack);
    }
  }
}
