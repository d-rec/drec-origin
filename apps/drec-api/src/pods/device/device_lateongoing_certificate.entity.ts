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
import { IDeviceLateOngoingIssueCertificate, IFullOrganization } from '../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/enums';
import { Device } from '.';

@Entity('device_lateongoing_certificate_cycle')
export class DeviceLateongoingIssueCertificateEntity extends ExtendedBaseEntity implements IDeviceLateOngoingIssueCertificate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  @IsString()
  device_externalid: string;

  @Column()
  @IsDate()
  late_start_date: string;

  @Column()
  @IsDate()
  late_end_date: string;
  
  @Column()
  certificate_issued: boolean;


  @Column()
  createdAt: Date;
}
