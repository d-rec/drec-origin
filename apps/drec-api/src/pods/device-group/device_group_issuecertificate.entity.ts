import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsDate,
} from 'class-validator';
import {
  IDeviceGroupNextIssueCertificate,
} from '../../models';

@Entity('next_issuance_date_log_for_device_group')
export class DeviceGroupNextIssueCertificate
  extends ExtendedBaseEntity
  implements IDeviceGroupNextIssueCertificate
{
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @Column()
  @IsDate()
  start_date: string;

  @Column()
  @IsDate()
  end_date: string;
}
