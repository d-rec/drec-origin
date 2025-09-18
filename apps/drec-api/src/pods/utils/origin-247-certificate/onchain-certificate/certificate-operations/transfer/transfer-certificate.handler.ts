import {
  Certificate as CertificateFacade,
  CertificateSchemaVersion,
} from '@energyweb/issuer';
import { BigNumber, ContractTransaction } from 'ethers';
import { Injectable } from '@nestjs/common';
import { BlockchainPropertiesService } from '../../blockchain-properties.service';
import { ITransferCommand } from '../../../../../../types/utils/issuer';

@Injectable()
export class TransferCertificateHandler {
  constructor(
    private readonly blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  async execute({
    certificateId,
    fromAddress,
    toAddress,
    energyValue,
  }: ITransferCommand): Promise<ContractTransaction> {
    const blockchainProperties =
      await this.blockchainPropertiesService.getWrapped();

    const onChainCert = await new CertificateFacade(
      certificateId,
      blockchainProperties,
      CertificateSchemaVersion.Latest,
    );

    return await onChainCert.transfer(
      toAddress,
      BigNumber.from(energyValue),
      fromAddress,
    );
  }
}
