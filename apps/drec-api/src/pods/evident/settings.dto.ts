import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column } from 'typeorm';

export class SettingsDTO {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'api_key' })
  apiKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'default_trading_account' })
  defaultTradingAccount: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Column({ name: 'default_beneficiary_account', nullable: true })
  defaultBeneficiaryAccount?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Column({ name: 'email' })
  email: string;
}
