import { OnChainCertificateService } from './onchain-certificate.service';
import { BigNumber } from 'ethers';
import { ICertificate } from './types';
import { Injectable } from '@nestjs/common';
import {
  IClaimCommand,
  IIssueCommandParams,
  ITransferCommand,
} from '../../../../types/utils/issuer';

type PublicPart<T> = { [K in keyof T]: T[K] };
@Injectable()
export class CertificateForUnitTestsService<T>
  implements PublicPart<OnChainCertificateService<T>>
{
  protected serial = 0;
  private db: ICertificate<T>[] = [];

  public async issue(params: IIssueCommandParams<T>): Promise<number> {
    this.serial += 1;

    const certificate: ICertificate<T> = {
      claims: [],
      claimers: {},
      creationTransactionHash: '',
      creationTime: Math.floor(Date.now() / 1000),
      deviceId: params.deviceId,
      generationStartTime: Math.floor(params.fromTime.getTime() / 1000),
      generationEndTime: Math.floor(params.toTime.getTime() / 1000),
      id: this.serial,
      issuedPrivately: false,
      metadata: params.metadata,
      owners: {
        [params.toAddress]: params.energyValue,
      },
      latestCommitment: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.db.push(certificate);

    return certificate.id;
  }

  public async claim(command: IClaimCommand): Promise<void> {
    const certificate = this.db.find((c) => c.id === command.certificateId);

    if (!certificate) {
      return;
    }

    const value = command.energyValue;

    certificate.claims.push({
      claimData: command.claimData,
      value: value,
      topic: '0',
      from: command.forAddress,
      id: 0,
      to: command.forAddress,
    });
    const ownedValue = certificate.owners[command.forAddress];

    certificate.owners[command.forAddress] = BigNumber.from(ownedValue)
      .sub(BigNumber.from(value))
      .toString();

    if (!certificate.claimers) {
      certificate.claimers = {};
    }
    certificate.claimers[command.forAddress] = value;
  }

  public async transfer(command: ITransferCommand): Promise<void> {
    const certificate = this.db.find((c) => c.id === command.certificateId);

    if (!certificate) {
      return;
    }

    const value = Number(command.energyValue);

    certificate.owners[command.fromAddress] = (
      Number(certificate.owners[command.fromAddress]) - value
    ).toString();
    certificate.owners[command.toAddress] = (
      Number(certificate.owners[command.toAddress] ?? 0) + value
    ).toString();
  }

  public async batchIssue(
    originalCertificates: IIssueCommandParams<T>[],
  ): Promise<number[]> {
    if (originalCertificates.length === 0) {
      return [];
    }

    const result = await Promise.all(
      originalCertificates.map((certificate) => this.issue(certificate)),
    );

    return result;
  }

  public async batchClaim(command: IClaimCommand[]): Promise<void> {
    if (command.length === 0) {
      return;
    }

    await Promise.all(command.map((claim) => this.claim(claim)));
  }

  public async batchTransfer(command: ITransferCommand[]): Promise<void> {
    if (command.length === 0) {
      return;
    }

    await Promise.all(command.map((transfer) => this.transfer(transfer)));
  }

  public async batchIssueWithTxHash(command: IIssueCommandParams<T>[]) {
    return {
      certificateIds: await this.batchIssue(command),
      transactionHash: 'txHash',
    };
  }

  public async batchTransferWithTxHash(command: ITransferCommand[]) {
    await this.batchTransfer(command);
    return { transactionHash: 'txHash' };
  }

  public async batchClaimWithTxHash(command: IClaimCommand[]) {
    await this.batchClaim(command);
    return { transactionHash: 'txHash' };
  }

  public async issueWithTxHash<T>(command: IIssueCommandParams<T>) {
    await this.issue(command as any);

    return {
      certificateId: this.db.find((c) => c.deviceId === command.deviceId)?.id!,
      transactionHash: 'txHash',
    };
  }

  public async transferWithTxHash(command: ITransferCommand) {
    await this.transfer(command);

    return { transactionHash: 'txHash' };
  }

  public async claimWithTxHash(command: IClaimCommand) {
    await this.claim(command);

    return { transactionHash: 'txHash' };
  }
}
