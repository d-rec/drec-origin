import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsDate
} from 'class-validator';


@Entity('check_certificate_issue_date_log_for_device_group')
export class CheckCertificateIssueDateLogForDeviceGroupEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  certificate_issuance_startdate:Date;

  @Column({ 
    type: 'timestamp', 
    precision: 3
  })
  certificate_issuance_enddate:Date;a

  @Column()
  @IsNumber()
  readvalue_watthour: number;
  
  @Column()
  @IsString()
  status: string;

  @Column()
  @IsString()
  groupid: string;

  @Column('json')
  certificate_payload: any;

  @Column()
  @IsNumber()
  issuer_certificate_id:number;

  @Column()
  @IsString()
  countryCode: string;
}