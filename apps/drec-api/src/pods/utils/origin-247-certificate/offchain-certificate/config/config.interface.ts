import { IsNumber, Min } from 'class-validator';

export class OffchainCertificateConfiguration {
    @IsNumber()
    @Min(0)
    public readonly MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT: number;

    @IsNumber()
    @Min(1)
    public readonly ISSUE_BATCH_SIZE: number;

    @IsNumber()
    @Min(1)
    public readonly TRANSFER_BATCH_SIZE: number;

    @IsNumber()
    @Min(1)
    public readonly CLAIM_BATCH_SIZE: number;
}
