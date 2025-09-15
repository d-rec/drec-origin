import { IClaimData } from '@energyweb/issuer';

export type UnixTimestamp = number;

export interface IIssueCommandParams<T> {
    toAddress: string;
    userId: string;
    energyValue: string;
    fromTime: Date;
    toTime: Date;
    deviceId: string;
    metadata: T;
}
export interface IIssueCommand<T> {
    toAddress: string;
    userId: string;
    energyValue: string;
    fromTime: UnixTimestamp;
    toTime: UnixTimestamp;
    deviceId: string;
    metadata: T;
}

export interface IClaimCommand {
    certificateId: number;
    claimData: IClaimData;
    forAddress: string;
    energyValue: string;
}

export interface ITransferCommand {
    certificateId: number;
    fromAddress: string;
    toAddress: string;
    energyValue: string;
}

export interface IBatchIssueCommand<T> {
    certificates: IIssueCommand<T>[];
}

export interface IBatchClaimCommand {
    claims: IClaimCommand[];
}

export interface IBatchTransferCommand {
    transfers: ITransferCommand[];
}
