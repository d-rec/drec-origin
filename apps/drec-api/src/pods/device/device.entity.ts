import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/eums';
import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { DeviceStatus } from '@energyweb/origin-backend-core';

export interface IDevice {
  id: number;
  drecID: string;
  status: DeviceStatus;
  registrant_organisation_code: string;
  project_name: string;
  address: string;
  latitude: string;
  longitude: string;
  country_code: string;
  zip_code?: number;
  fuel_code: string;
  device_type_code: string;
  installation_configuration: Installation;
  capacity: number;
  commissioning_date: string;
  grid_interconnection: boolean;
  off_taker: OffTaker;
  sector: Sector;
  standard_compliance: StandardCompliance;
  yield_value: number;
  generators_ids?: number[];
  labels?: string;
  impact_story?: string;
  data?: string;
  images?: string[];
  groupId?: number;
}

@Entity()
export class Device extends ExtendedBaseEntity implements IDevice {
  constructor(device?: Partial<Device>) {
    super();
    Object.assign(this, device);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsString()
  drecID: string;

  @Column({ nullable: false, default: DeviceStatus.Active })
  @IsNotEmpty()
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @Column()
  @IsString()
  registrant_organisation_code: string;

  @Column()
  @IsString()
  project_name: string;

  @Column()
  @IsString()
  address: string;

  @Column()
  @IsString()
  latitude: string;

  @Column()
  @IsString()
  longitude: string;

  @Column()
  @IsString()
  country_code: string;

  @Column({ nullable: true })
  @IsNumber()
  zip_code: number;

  @Column()
  @IsString()
  fuel_code: string;

  @Column()
  @IsString()
  device_type_code: string;

  @Column()
  @IsEnum(Installation)
  installation_configuration: Installation;

  @Column()
  @IsNumber()
  capacity: number;

  @Column()
  @IsString()
  commissioning_date: string;

  @Column()
  @IsBoolean()
  grid_interconnection: boolean;

  @Column()
  @IsEnum(OffTaker)
  off_taker: OffTaker;

  @Column()
  @IsEnum(Sector)
  sector: Sector;

  @Column()
  @IsEnum(StandardCompliance)
  standard_compliance: StandardCompliance;

  @Column({ default: 1000 })
  @IsNumber()
  yield_value: number;

  @Column('int', { nullable: true, array: true })
  generators_ids: number[];

  @Column({ nullable: true })
  @IsString()
  labels: string;

  @Column({ nullable: true })
  @IsString()
  impact_story: string;

  @Column({ nullable: true })
  data: string;

  @Column('text', { nullable: true, array: true })
  images: string[];

  @Column({ nullable: true })
  @IsString()
  groupId: number;
}
