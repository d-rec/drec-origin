import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IYieldConfig } from '../../../models';
import { Role, UserStatus } from '../../../utils/enums';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { OrganizationDTO } from '../../organization/dto';
import {
  YieldStatus,

} from '../../../utils/enums';
export class YieldConfigDTO implements IYieldConfig {
 
  @ApiProperty({ type: Number })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  countryName: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @ApiProperty({ type: Number })
  @IsNotEmpty()
  @IsNumber()
  yieldValue: number;
  
  @ApiProperty({ enum: YieldStatus, enumName: 'yieldstatus' })
  @IsNotEmpty()
  @IsEnum(YieldStatus)
  status: YieldStatus;
 

}
