import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Queues } from '../../../utils/enums/queues.enum';
import { LateOngoingIssuanceService } from '../services/late-ongoing-issuance.service';

@Processor(Queues.LateOngoingIssuance)
export class LateOngoingIssuanceProcessor {
  private readonly logger = new Logger(LateOngoingIssuanceProcessor.name);
  constructor(
    private readonly lateOngoingIssuanceService: LateOngoingIssuanceService,
  ) {}

  // Concurrency=10 with per-group jobId serialisation (see queue.add
  // sites in late-ongoing-issuance.service.ts). Different groups
  // process in parallel; same-group jobs are deduped/serialised by
  // Bull so the inner group-state mutations in
  // issuer.service.issueCertificate stay race-free.
  @Process({ concurrency: 10 })
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
