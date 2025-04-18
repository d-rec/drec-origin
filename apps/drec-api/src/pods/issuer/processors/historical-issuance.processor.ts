import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Queues } from '../../../utils/enums/queues.enum';
import { HistoryDeviceGroupNextIssueCertificate } from '../../device-group/history_next_issuance_date_log.entity';
import { HistoricalIssuanceService } from '../services/historical-issuance.service';

const CONCURRENCY = 50;

@Processor(Queues.HistoricalIssuance)
export class HistoricalIssuanceProcessor {
  private readonly logger = new Logger(HistoricalIssuanceProcessor.name);
  constructor(
    private readonly historicalIssuanceService: HistoricalIssuanceService,
  ) {}

  @Process({ concurrency: CONCURRENCY })
  async processIssuance(
    job: Job<{
      request: HistoryDeviceGroupNextIssueCertificate;
      requestIndex: number;
    }>,
  ): Promise<void> {
    const { request, requestIndex } = job.data;
    this.logger.debug(
      `Processing historical issuance for group: ${request?.groupId}`,
    );
    try {
      await this.historicalIssuanceService.processIssuanceRequest(
        request,
        requestIndex,
      );
    } catch (error) {
      this.logger.error(
        `Error processing group ${request?.groupId}`,
        error.stack,
      );
    }
  }
}
