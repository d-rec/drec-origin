import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class IssuerDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  productionVolume: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  recipientAccount: string;

  @IsString()
  code: string;
}
