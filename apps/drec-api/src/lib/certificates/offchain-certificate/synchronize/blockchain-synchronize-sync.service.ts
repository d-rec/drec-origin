import { Inject, Injectable } from '@nestjs/common';
import {
  SynchronizeStrategy,
  SYNCHRONIZE_STRATEGY,
} from './strategies/synchronize.strategy';
import { CertificateEventRepository } from '../repositories/certificate-event/certificate-event.repository';
import { CERTIFICATE_EVENT_REPOSITORY } from '../../repository.keys';
import { BlockchainSynchronizeService } from './blockchain-synchronize.service';

@Injectable()
export class BlockchainSynchronizeSyncService
  implements BlockchainSynchronizeService
{
  constructor(
    @Inject(SYNCHRONIZE_STRATEGY)
    private readonly synchronizeStrategy: SynchronizeStrategy,
    @Inject(CERTIFICATE_EVENT_REPOSITORY)
    private readonly certEventRepo: CertificateEventRepository,
  ) {}

  public async synchronize() {
    const events = await this.certEventRepo.findAllToProcess({
      limit: null,
    });

    await this.synchronizeStrategy.synchronize(events);
  }
}
