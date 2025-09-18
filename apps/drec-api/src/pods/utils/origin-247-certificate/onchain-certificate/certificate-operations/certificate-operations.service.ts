import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { BlockchainAction, BlockchainActionType } from '../types';
import { TransactionPollService } from './transactions-poll.service';
import { BatchClaimCertificatesHandler } from './claim/batch-claim-certificates.handler';
import { IssueCertificateHandler } from './issue/issue-certificate.handler';
import { TransferCertificateHandler } from './transfer/transfer-certificate.handler';
import { ClaimCertificateHandler } from './claim/claim-certificate.handler';
import { BatchTransferCertificatesHandler } from './transfer/batch-transfer-certificates.handler';
import {
  IBatchClaimCommand,
  IBatchIssueCommand,
  IBatchTransferCommand,
  IClaimCommand,
  IIssueCommand,
  ITransferCommand,
} from '../../../../../types/utils/issuer';
import { BatchIssueCertificatesHandler } from './issue/batch-issue-certificates.handler';

@Injectable()
export class CertificateOperationsService {
  private readonly logger = new Logger(CertificateOperationsService.name);

  constructor(
    private readonly transactionPoll: TransactionPollService,
    private readonly batchClaimCertificatesHandler: BatchClaimCertificatesHandler,
    private readonly batchIssueCertificatesHandler: BatchIssueCertificatesHandler,
    private readonly batchTransferCertificatesHandler: BatchTransferCertificatesHandler,
    private readonly claimCertificateHandler: ClaimCertificateHandler,
    private readonly issueCertificateHandler: IssueCertificateHandler,
    private readonly transferCertificateHandler: TransferCertificateHandler,
  ) {}

  async process({
    data,
  }: Job<BlockchainAction>): Promise<
    | BatchIssuanceActionResult
    | BatchTransferActionResult
    | BatchClaimActionResult
    | IssuanceActionResult
    | TransferActionResult
    | ClaimActionResult
  > {
    this.logger.debug(`Processing ${data.type} job`);

    switch (data.type) {
      case BlockchainActionType.Issuance:
        return await this.issue(data.payload);
      case BlockchainActionType.Transfer:
        return await this.transfer(data.payload);
      case BlockchainActionType.Claim:
        return await this.claim(data.payload);
      case BlockchainActionType.BatchIssuance:
        return await this.batchIssue(data.payload);
      case BlockchainActionType.BatchTransfer:
        return await this.batchTransfer(data.payload);
      case BlockchainActionType.BatchClaim:
        return await this.batchClaim(data.payload);
    }
  }

  private async issue(
    params: IIssueCommand<any>,
  ): Promise<IssuanceActionResult> {
    this.logger.debug(`Triggering issuance for: ${JSON.stringify(params)}`);

    const issuanceTx = await this.issueCertificateHandler.execute(params);

    const [certificateId] = await this.transactionPoll.waitForNewCertificates(
      issuanceTx.hash,
    );

    return {
      certificateId,
      transactionHash: issuanceTx.hash,
    };
  }

  private async transfer(
    params: ITransferCommand,
  ): Promise<TransferActionResult> {
    this.logger.debug(`Triggering transfer for: ${JSON.stringify(params)}`);

    const transferTx = await this.transferCertificateHandler.execute(params);

    await this.transactionPoll.waitForTransaction(transferTx.hash);

    return { transactionHash: transferTx.hash };
  }

  private async claim(params: IClaimCommand): Promise<ClaimActionResult> {
    this.logger.debug(`Triggering claim for: ${JSON.stringify(params)}`);

    const claimTx = await this.claimCertificateHandler.execute(params);

    await this.transactionPoll.waitForTransaction(claimTx.hash);

    return { transactionHash: claimTx.hash };
  }

  private async batchIssue(
    params: IBatchIssueCommand<any>,
  ): Promise<BatchIssuanceActionResult> {
    this.logger.debug(
      `Triggering batch issuance for: ${JSON.stringify(params)}`,
    );

    const batchIssuanceTx = await this.batchIssueCertificatesHandler.execute({
      certificates: params.certificates,
    });

    const batchIssuanceCertificateIds =
      await this.transactionPoll.waitForNewCertificates(batchIssuanceTx.hash);

    return {
      certificateIds: batchIssuanceCertificateIds,
      transactionHash: batchIssuanceTx.hash,
    };
  }

  private async batchTransfer(
    params: IBatchTransferCommand,
  ): Promise<BatchTransferActionResult> {
    this.logger.debug(
      `Triggering batch transfer for: ${JSON.stringify(params)}`,
    );

    const batchTransferTx = await this.batchTransferCertificatesHandler.execute(
      {
        transfers: params.transfers,
      },
    );

    await this.transactionPoll.waitForTransaction(batchTransferTx.hash);

    return {
      transactionHash: batchTransferTx.hash,
    };
  }

  private async batchClaim(
    params: IBatchClaimCommand,
  ): Promise<BatchClaimActionResult> {
    this.logger.debug(`Triggering batch claim for: ${JSON.stringify(params)}`);

    const batchClaimTx = await this.batchClaimCertificatesHandler.execute({
      claims: params.claims,
    });

    await this.transactionPoll.waitForTransaction(batchClaimTx.hash);

    return {
      transactionHash: batchClaimTx.hash,
    };
  }
}

type TransactionHashResult = {
  transactionHash: string;
};

export type BatchIssuanceActionResult = {
  certificateIds: number[];
} & TransactionHashResult;

export type BatchTransferActionResult = TransactionHashResult;

export type BatchClaimActionResult = TransactionHashResult;

export type IssuanceActionResult = {
  certificateId: number;
} & TransactionHashResult;

export type TransferActionResult = TransactionHashResult;

export type ClaimActionResult = TransactionHashResult;
