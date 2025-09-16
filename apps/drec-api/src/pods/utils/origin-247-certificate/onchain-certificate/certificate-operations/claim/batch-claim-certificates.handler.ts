import { CertificateBatchOperations, CertificateSchemaVersion } from '@energyweb/issuer';
import { BigNumber, ContractTransaction } from 'ethers';
import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BlockchainPropertiesService } from '../../blockchain-properties.service';
import { IBatchClaimCommand } from '../../../../../../types/utils/issuer';

@Injectable()
export class BatchClaimCertificatesHandler<T = null> {
    constructor(private readonly blockchainPropertiesService: BlockchainPropertiesService) {}

    async execute({ claims }: IBatchClaimCommand): Promise<ContractTransaction> {
        const blockchainProperties = await this.blockchainPropertiesService.getWrapped();

        if (claims.length === 0) {
            throw new BadRequestException('Cannot process empty claims request');
        }

        try {
            return await CertificateBatchOperations.claimCertificates(
                claims.map((claim) => ({
                    schemaVersion: CertificateSchemaVersion.Latest,
                    id: claim.certificateId,
                    from: claim.forAddress,
                    amount: BigNumber.from(claim.energyValue),
                    claimData: claim.claimData
                })),
                blockchainProperties
            );
        } catch (error) {
            throw new HttpException(JSON.stringify(error), HttpStatus.FAILED_DEPENDENCY);
        }
    }
}
