import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IRoleConfig } from '../../../models';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { RoleStatus } from '../../../utils/enums';
export class RoleConfigDTO implements IRoleConfig {
  @ApiProperty({ type: Number })
  @IsNumber()
  @Expose()
  id: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: RoleStatus, enumName: 'status' })
  @IsNotEmpty()
  @IsEnum(RoleStatus)
  status: RoleStatus;
}
