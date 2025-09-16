import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class Web3Providers {
    @IsString()
    @IsNotEmpty()
    public readonly primaryRPC: string;
    @IsString()
    @IsNotEmpty()
    public readonly fallbackRPC: string;
}

export class OnchainConfiguration {
    @IsNumber()
    @Min(0)
    public readonly CERTIFICATE_QUEUE_DELAY: number;

    @IsNumber()
    @Min(0)
    public readonly CERTIFICATE_QUEUE_LOCK_DURATION: number;

    @IsNumber()
    @Min(1)
    @IsOptional()
    public readonly BLOCKCHAIN_POLLING_INTERVAL?: number;

    @IsString()
    @IsNotEmpty()
    public readonly ISSUER_PRIVATE_KEY: string;

    @ValidateNested()
    public readonly WEB3: Web3Providers;
}