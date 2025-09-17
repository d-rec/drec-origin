import { IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CommonConfiguration {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    public readonly DATABASE_URL?: string;

    @IsString()
    @IsNotEmpty()
    public readonly DB_HOST: string;

    @IsNumber()
    @Min(0)
    public readonly DB_PORT: number;

    @IsString()
    @IsNotEmpty()
    public readonly DB_USERNAME: string;

    @IsString()
    @IsNotEmpty()
    public readonly DB_PASSWORD: string;

    @IsString()
    @IsNotEmpty()
    public readonly DB_DATABASE: string;

    @IsDefined()
    public readonly REDIS_URL: string | { host: string; port: number };
}
