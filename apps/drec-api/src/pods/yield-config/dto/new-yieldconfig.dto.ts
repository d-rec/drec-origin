import { IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { IYieldConfig } from '../../../models';
import { YieldStatus } from '../../../utils/enums';
export class NewYieldConfigDTO implements Omit<IYieldConfig, 'id'> {
  @ApiProperty({ type: String })
  @IsString()
  countryName: string;

  @ApiProperty({ type: String })
  @IsString()
  countryCode: string;

  @ApiProperty({ type: Number })
  @IsNumber()
  yieldValue: number;

  @ApiProperty({ enum: YieldStatus, enumName: 'yieldstatus' })
  @IsEnum(YieldStatus)
  status: YieldStatus;
}
