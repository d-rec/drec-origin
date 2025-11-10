import { Inject, Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import {
  SYNCHRONIZE_STRATEGY,
  SynchronizeStrategy,
} from './strategies/synchronize.strategy';
import {
  CERTIFICATE_EVENT_REPOSITORY,
  SYNCHRONIZE_QUEUE_NAME,
} from '../../repository.keys';
import { CertificateEventRepository } from '../repositories/certificate-event/certificate-event.repository';

const SYNCHRONIZATION_CONCURRENCY = 1;

@Injectable()
@Processor(SYNCHRONIZE_QUEUE_NAME)
export class BlockchainSynchronizeTask {
  private readonly logger = new Logger(BlockchainSynchronizeTask.name);

  constructor(
    @Inject(CERTIFICATE_EVENT_REPOSITORY)
    private readonly certEventRepo: CertificateEventRepository,

    @Inject(SYNCHRONIZE_STRATEGY)
    private readonly synchronizeStrategy: SynchronizeStrategy,
  ) {}

  @Process({ concurrency: SYNCHRONIZATION_CONCURRENCY })
  async synchronizeWithBlockchain(): Promise<void> {
    try {
      this.logger.debug(
        `Synchronization with blockchain started at ${new Date()}`,
      );

      let i = 0;
      while (i < 50) {
        // This basically limits how many events we want to process in one task execution
        const events = await this.certEventRepo.findAllToProcess({
          limit: 500,
        });
        if (events.length === 0) {
          break;
        }

        await this.synchronizeStrategy.synchronize(events);

        i += 1;
      }

      this.logger.debug(
        `Synchronization with blockchain finished at ${new Date()}`,
      );
    } catch (e) {
      this.logger.error(
        `Error occurred while synchronizing certificates with blockchain: ${e.message}`,
        e.stack,
      );

      throw e;
    }
  }
}
