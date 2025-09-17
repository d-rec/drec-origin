import { CertificateBatchOperations } from '@energyweb/issuer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BigNumber, ContractTransaction } from 'ethers';
import { BlockchainPropertiesService } from '../../blockchain-properties.service';
import { IBatchIssueCommand } from '../../../../../../types/utils/issuer';

@Injectable()
export class BatchIssueCertificatesHandler {
  constructor(
    private readonly blockchainPropertiesService: BlockchainPropertiesService,
  ) {}

  async execute({
    certificates,
  }: IBatchIssueCommand<any>): Promise<ContractTransaction> {
    const blockchainProperties =
      await this.blockchainPropertiesService.getWrapped();

    try {
      return CertificateBatchOperations.issueCertificates(
        certificates.map((info) => ({
          to: info.toAddress,
          deviceId: info.deviceId,
          generationStartTime: info.fromTime,
          generationEndTime: info.toTime,
          amount: BigNumber.from(info.energyValue),
          metadata: JSON.stringify(info.metadata),
        })),
        blockchainProperties,
      );
    } catch (error) {
      throw new HttpException(
        JSON.stringify(error),
        HttpStatus.FAILED_DEPENDENCY,
      );
    }
  }
}
