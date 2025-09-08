import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsDate } from 'class-validator';
import { IDeviceLateOngoingIssueCertificate } from '../../models';
import { DateTime } from 'luxon';

@Entity('device_lateongoing_certificate_cycle')
export class DeviceLateOngoingIssueCertificateEntity
  extends ExtendedBaseEntity
  implements IDeviceLateOngoingIssueCertificate
{
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

  @Column()
  archived_at: Date | null;

  @Column()
  checked_at: Date | null;

  get lateStartTimestamp(): number {
    return new Date(this.late_start_date).getTime();
  }

  get lateEndTimestamp(): number {
    return new Date(this.late_end_date).getTime();
  }

  get lateStartDate(): Date {
    return new Date(this.late_start_date);
  }

  get lateEndDate(): Date {
    return new Date(this.late_end_date);
  }

  get lateStartDateUTC(): DateTime {
    return DateTime.fromISO(this.late_start_date).toUTC();
  }

  get lateEndDateUTC(): DateTime {
    return DateTime.fromISO(this.late_end_date).toUTC();
  }
}
