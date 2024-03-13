import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsEmail, IsEnum, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { YieldStatus } from '../../utils/enums';
import { IYieldConfig } from '../../models';
import { Organization } from '../organization/organization.entity';

@Entity({ name: 'yieldconfig' })
export class YieldConfig extends ExtendedBaseEntity implements IYieldConfig {
  constructor(yieldvalue?: Partial<YieldConfig>) {
    super();
    Object.assign(this, yieldvalue);
  }
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  countryName: string;

  @ApiProperty({ type: String })
  @Column()
  @IsString()
  countryCode: string;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  yieldValue: number;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  created_By: number;

  @ApiProperty({ type: Number })
  @Column()
  @IsNumber()
  updated_By: number;

  @ApiProperty({ enum: YieldStatus, enumName: 'yieldstatus' })
  @Column({ default: YieldStatus.yes })
  @IsEnum(YieldStatus)
  status: YieldStatus;
}
