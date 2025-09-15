import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  IsString,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { EvidentIssuanceStatus } from '../../types/evident';
import { DeviceGroup } from './device-group.entity';

@Entity('check_certificate_issue_date_log_for_device_group')
export class CheckCertificateIssueDateLogForDeviceGroupEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'timestamp',
    precision: 3,
  })
  certificate_issuance_startdate: Date;

  @Column({
    type: 'timestamp',
    precision: 3,
  })
  certificate_issuance_enddate: Date;

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
  issuer_certificate_id: number;

  @Column()
  @IsString()
  countryCode: string;

  @Column()
  @IsString()
  certificateTransactionUID: string;

  @Column({ type: 'timestamp', precision: 3, name: 'evident_synced_at' })
  @IsOptional()
  @IsDate()
  evidentSyncedAt: Date;

  @Column({ name: 'evident_issuance_request_id' })
  @IsOptional()
  @IsString()
  evidentIssuanceRequestId: string;

  @Column({ name: 'evident_issuance_request_status' })
  @IsOptional()
  @IsEnum(EvidentIssuanceStatus)
  evidentIssuanceRequestStatus: EvidentIssuanceStatus;

  @ManyToOne(() => DeviceGroup, { eager: false })
  @JoinColumn({ name: 'groupid', referencedColumnName: 'id' })
  deviceGroup: DeviceGroup;
}
