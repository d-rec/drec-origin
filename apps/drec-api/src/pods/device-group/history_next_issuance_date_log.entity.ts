import { ExtendedBaseEntity } from '../../lib/backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IsString, IsDate } from 'class-validator';

@Entity('history_next_issueance_log')
export class HistoryDeviceGroupNextIssueCertificate extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  @IsDate()
  reservationStartDate: Date;

  @Column()
  @IsDate()
  reservationEndDate: Date;

  @Column()
  @IsString()
  device_externalid: string;

  @Column()
  @IsDate()
  device_createdAt: Date;

  @Column()
  @IsString()
  status: string;
}
