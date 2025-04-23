import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Queues } from '../../../utils/enums/queues.enum';
import { OngoingIssuanceService } from '../services/ongoing-issuance.service';
import { DeviceGroupNextIssueCertificate } from '../../device-group/device_group_issuecertificate.entity';

const CONCURRENCY = 50;

@Processor(Queues.OngoingIssuance)
export class OngoingIssuanceProcessor {
  private readonly logger = new Logger(OngoingIssuanceProcessor.name);
  constructor(
    private readonly ongoingIssuanceService: OngoingIssuanceService,
  ) {}

  @Process({ concurrency: CONCURRENCY })
  async processIssuance(
    job: Job<{ groupRequest: DeviceGroupNextIssueCertificate }>,
  ): Promise<void> {
    const { groupRequest } = job.data;
    this.logger.debug(
      `Processing ongoing issuance for group: ${groupRequest?.groupId}`,
    );
    try {
      await this.ongoingIssuanceService.processIssuanceByGroupRequest(
        groupRequest,
      );
    } catch (error) {
      this.logger.error(
        `Error processing group ${groupRequest?.groupId}`,
        error.stack,
      );
    }
  }
}
