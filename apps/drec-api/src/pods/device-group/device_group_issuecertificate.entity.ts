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
import { IDeviceGroupIssueCertificate, IFullOrganization } from '../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/enums';
import { Device } from '../device';

@Entity()
export class DeviceGroupIssueCertificate extends ExtendedBaseEntity implements IDeviceGroupIssueCertificate {
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
