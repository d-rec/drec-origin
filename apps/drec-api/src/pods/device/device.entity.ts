import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Installation, OffTaker, Sector } from '../../utils/eums';
import { IsEnum, IsBoolean, IsString, IsArray } from 'class-validator';

export interface IDevice {
  id: string;
  project_name: string;
  address: string;
  latitude: string;
  longitude: string;
  fuel_code: string;
  device_type_code: string;
  installation_configuration: Installation;
  capacity: string;
  commissioning_date: string;
  grid_interconnection: boolean;
  off_taker: OffTaker;
  sector: Sector;
  standard_compliance: string;
  generators_ids?: number[];
  labels?: string;
  impact_story?: string;
  data?: string;
  images?: string[];
}

@Entity()
export class Device extends ExtendedBaseEntity implements IDevice {
  @PrimaryColumn()
  id: string;

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
  fuel_code: string;

  @Column()
  @IsString()
  device_type_code: string;

  @Column()
  @IsEnum(Installation)
  installation_configuration: Installation;

  @Column()
  @IsString()
  capacity: string;

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
  @IsString()
  standard_compliance: string;

  @Column('text', { nullable: true, array: true })
  generators_ids: number[];

  @Column({ nullable: true })
  @IsString()
  labels: string;

  @Column({ nullable: true })
  @IsString()
  impact_story: string;

  @Column({ nullable: true })
  data: string;

  @Column('text', { nullable: true, array: true, default: [] })
  images: string[];
}
