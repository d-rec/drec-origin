import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import { IsString, IsNumber, IsDate } from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Device } from './device.entity';
import { EvidentIssuanceStatus } from '../../types/evident';

@Entity('check_certificate_issue_date_log_for_device')
export class CheckCertificateIssueDateLogForDeviceEntity extends ExtendedBaseEntity {
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
  externalId: string;

  @Column()
  @IsNumber()
  groupId: number | null;

  @Column()
  @IsString()
  certificateTransactionUID: string;

  @Column()
  @IsDate()
  ongoing_start_date: string;

  @Column()
  @IsDate()
  ongoing_end_date: string;

  @Column({ name: 'evident_synced_at' })
  @IsDate()
  evidentSyncedAt: Date | null;

  @Column({ name: 'evident_issuance_request_id' })
  @IsString()
  evidentIssuanceRequestId: string | null;

  @Column({ name: 'evident_issuance_request_status' })
  @IsString()
  evidentIssuanceRequestStatus: EvidentIssuanceStatus | null;

  @ManyToOne(() => Device, (device) => device.certificateLogs)
  @JoinColumn({ name: 'externalId', referencedColumnName: 'externalId' })
  device: Device;
}
