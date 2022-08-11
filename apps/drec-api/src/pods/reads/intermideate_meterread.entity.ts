import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsEmail, IsEnum, IsNumber, IsString ,IsDate,IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Unit,ReadType } from '../../utils/enums';
import { Iintermediate } from '../../models';
import { Organization } from '../organization/organization.entity';

@Entity({ name: 'intermediate_meterread' })
export class Intermediate_MeterRead extends ExtendedBaseEntity implements Iintermediate {

  constructor(intermideatevalue?: Partial<Iintermediate>) {
    super();
    Object.assign(this, intermideatevalue);
  }
  @ApiProperty({ type: Number })

  @PrimaryGeneratedColumn('uuid')
  id: number;

  @ApiProperty({ enum: ReadType, enumName: 'type'})
  @Column()
  @IsEnum(ReadType)
  type: ReadType;

  @ApiProperty({ enum: Unit, enumName: 'unit' })
  @Column()
  @IsEnum(Unit)
  unit: Unit;
  
  // @ApiProperty({ type: Date })
  // @IsDate()
  // @IsOptional()
  // startdate: Date;

  // @ApiProperty({ type: Date })
  // @IsDate()
  // @IsOptional()
  // enddate: Date;

  
  @ApiProperty({ type: Date })
  @IsDate()
  createdAt: Date;
 
  // @ApiProperty({ type: Number })
  // @Column()
  // @IsNumber()
  // value: number;
 
  @ApiProperty({ type: String })
  @Column()
  @IsString()
  deviceId: string;

}
