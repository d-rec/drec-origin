import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { IsEmail, IsEnum, IsNumber, IsString ,IsDate,IsOptional} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { ReadType } from '../../utils/enums';
import { Iintermediate } from '../../models';
import { Organization } from '../organization/organization.entity';
import {
  Unit,
} from '@energyweb/energy-api-influxdb';
@Entity({ name: 'history_intermediate_meteread' })
export class HistoryIntermediate_MeterRead extends ExtendedBaseEntity implements Iintermediate {

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
  
  
  @IsDate()
  createdAt: Date;

  @Column()
  externalId: string;


  @Column()
  @IsNumber()
  readsvalue: number;


  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  readsStartDate: Date;
  
  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  readsEndDate: Date;

  @Column()
  @IsNumber()
  groupId_certificate_issued_for: number;

  @Column()
  certificate_issued: boolean;

  @Column()
  @IsNumber()
  issuer_certificate_id: number;

  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  certificate_issuance_startdate:Date;

  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  certificate_issuance_enddate:Date;

  
 

}
