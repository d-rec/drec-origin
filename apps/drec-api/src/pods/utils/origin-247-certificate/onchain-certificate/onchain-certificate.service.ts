import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BlockchainAction, BlockchainActionType, ICertificate } from './types';
import { blockchainQueueName } from './blockchain-actions.processor';
import {
    BatchClaimActionResult,
    BatchIssuanceActionResult,
    BatchTransferActionResult,
    ClaimActionResult,
    IssuanceActionResult,
    TransferActionResult
} from './certificate-operations/certificate-operations.service';
import { IClaimCommand, IIssueCommand, IIssueCommandParams, ITransferCommand } from '../../../../types/utils/issuer';

const jobOptions = {
    // redis cleanup
    removeOnComplete: true,
    removeOnFail: true
};

@Injectable()
export class OnChainCertificateService<T = null> {
    private logger = new Logger(OnChainCertificateService.name);

    constructor(
        private readonly queryBus: QueryBus,
        @InjectQueue(blockchainQueueName)
        private readonly blockchainActionsQueue: Queue<BlockchainAction>
    ) {}

    public async issueWithTxHash(params: IIssueCommandParams<T>): Promise<IssuanceActionResult<T>> {
        const command = {
            ...params,
            fromTime: Math.round(params.fromTime.getTime() / 1000),
            toTime: Math.round(params.toTime.getTime() / 1000)
        } as IIssueCommand<T>;

        this.logger.debug(`Adding certificate to issue to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: command,
                type: BlockchainActionType.Issuance
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult<IssuanceActionResult<T>>(job);
    }

    public async issue(params: IIssueCommandParams<T>): Promise<number> {
        const { certificateId } = await this.issueWithTxHash(params);

        return certificateId;
    }

    public async claimWithTxHash(command: IClaimCommand): Promise<ClaimActionResult> {
        this.logger.debug(`Adding certificate to claim to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: command,
                type: BlockchainActionType.Claim
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult(job);
    }

    public async claim(command: IClaimCommand): Promise<void> {
        await this.claimWithTxHash(command);
    }

    public async transferWithTxHash(command: ITransferCommand): Promise<TransferActionResult> {
        this.logger.debug(`Adding certificate to transfer to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: command,
                type: BlockchainActionType.Transfer
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult(job);
    }

    public async transfer(command: ITransferCommand): Promise<void> {
        await this.transferWithTxHash(command);
    }

    public async batchIssueWithTxHash(
        originalCertificates: IIssueCommandParams<T>[]
    ): Promise<BatchIssuanceActionResult> {
        const certificates = originalCertificates.map(
            (certificate) =>
                ({
                    ...certificate,
                    fromTime: Math.round(certificate.fromTime.getTime() / 1000),
                    toTime: Math.round(certificate.toTime.getTime() / 1000)
                } as IIssueCommand<T>)
        );

        this.logger.debug(`Adding ${originalCertificates.length} certificates to issue to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: {
                    certificates
                },
                type: BlockchainActionType.BatchIssuance
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult(job);
    }

    public async batchIssue(originalCertificates: IIssueCommandParams<T>[]): Promise<number[]> {
        if (originalCertificates.length === 0) {
            return [];
        }

        const { certificateIds } = await this.batchIssueWithTxHash(originalCertificates);

        return certificateIds;
    }

    public async batchClaimWithTxHash(command: IClaimCommand[]): Promise<BatchClaimActionResult> {
        this.logger.debug(`Adding ${command.length} claim commands to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: {
                    claims: command
                },
                type: BlockchainActionType.BatchClaim
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult(job);
    }

    public async batchClaim(command: IClaimCommand[]): Promise<void> {
        if (command.length === 0) {
            return;
        }

        await this.batchClaimWithTxHash(command);
    }

    public async batchTransferWithTxHash(
        command: ITransferCommand[]
    ): Promise<BatchTransferActionResult> {
        this.logger.debug(`Adding ${command.length} transfer commands to queue`);

        const job = await this.blockchainActionsQueue.add(
            {
                payload: {
                    transfers: command
                },
                type: BlockchainActionType.BatchTransfer
            },
            jobOptions
        );

        return await OnChainCertificateService.waitForJobResult(job);
    }

    public async batchTransfer(command: ITransferCommand[]): Promise<void> {
        if (command.length === 0) {
            return;
        }

        await this.batchTransferWithTxHash(command);
    }

    private mapCertificate(certificate: ICertificate<any>): ICertificate<T> {
        return {
            ...certificate,
            /** @NOTE this may be null, but this will be fixed at some point */
            claims: certificate.claims ?? [],
            metadata: certificate.metadata !== '' ? JSON.parse(certificate.metadata) : null
        };
    }

    private static async waitForJobResult<ActionResult>(
        job: Job<BlockchainAction>
    ): Promise<ActionResult> {
        try {
            return await job.finished();
        } catch (e) {
            const error = new Error(e.message);
            error.stack =
                '[Hidden job error stack trace]. Please refer to logger logs for error stacktrace';

            throw error;
        }
    }
}
