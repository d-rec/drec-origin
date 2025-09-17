import { Certificate as CertificateFacade } from '@energyweb/issuer';
import { BigNumber, ContractTransaction } from 'ethers';
import { BlockchainPropertiesService } from '../../blockchain-properties.service';
import { Injectable } from '@nestjs/common';
import { IIssueCommand } from '../../../../../../types/utils/issuer';

@Injectable()
export class IssueCertificateHandler {
  constructor(
    private readonly blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  async execute({
    toAddress,
    energyValue,
    fromTime,
    toTime,
    deviceId,
    metadata,
  }: IIssueCommand<any>): Promise<ContractTransaction> {
    const blockchainProperties =
      await this.blockchainPropertiesService.getWrapped();

    return await CertificateFacade.create(
      toAddress,
      BigNumber.from(energyValue),
      fromTime,
      toTime,
      deviceId,
      blockchainProperties,
      metadata,
    );
  }
}
