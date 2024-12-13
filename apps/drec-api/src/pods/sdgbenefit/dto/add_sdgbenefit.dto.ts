import { Entity } from 'typeorm';
import { Expose } from 'class-transformer';

import { IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ISdgBenefit } from '../../../models';

@Entity()
export class SDGBenefitDTO implements Omit<ISdgBenefit, 'id'> {
  @ApiProperty()
  @IsString()
  SdgbenefitName: string;

  @ApiProperty()
  @IsString()
  sdgbenefitdescription: string;

  @ApiProperty()
  @IsNumber()
  sdgbenefitBitposition: number;
}
export class SDGBenefitCodeNameDTO {
  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ type: String })
  @IsString()
  @Expose()
  value: string;
}
