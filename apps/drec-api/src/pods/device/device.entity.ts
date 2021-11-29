import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  DeviceStatus,
  Installation,
  Integrator,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/enums';
import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';
import { IDevice } from '../../models';

@Entity()
export class Device extends ExtendedBaseEntity implements IDevice {
  constructor(device: Partial<Device>) {
    super();
    Object.assign(this, device);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsString()
  externalId: string;

  @Column({ nullable: false, default: DeviceStatus.Active })
  @IsNotEmpty()
  @IsEnum(DeviceStatus)
  status: DeviceStatus;

  @Column()
  organizationId: number;

  @Column()
  @IsString()
  projectName: string;

  @Column({ nullable: true })
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
  countryCode: string;

  @Column({ nullable: true })
  @IsString()
  zipCode: string;

  @Column()
  @IsString()
  fuelCode: string;

  @Column()
  @IsString()
  deviceTypeCode: string;

  @Column()
  @IsEnum(Installation)
  installationConfiguration: Installation;

  @Column()
  @IsNumber()
  capacity: number;

  @Column()
  @IsString()
  commissioningDate: string;

  @Column()
  @IsBoolean()
  gridInterconnection: boolean;

  @Column()
  @IsEnum(OffTaker)
  offTaker: OffTaker;

  @Column()
  @IsEnum(Sector)
  sector: Sector;

  @Column()
  @IsEnum(StandardCompliance)
  standardCompliance: StandardCompliance;

  @Column({ default: 1500 })
  @IsNumber()
  yieldValue: number;

  @Column('int', { nullable: true, array: true })
  generatorsIds: number[];

  @Column({ nullable: true })
  @IsString()
  labels: string;

  @Column({ nullable: true })
  @IsString()
  impactStory: string;

  @Column({ nullable: true })
  data: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'int', nullable: true })
  groupId: number | null;

  @Column({ nullable: true })
  @IsEnum(Integrator)
  integrator: Integrator;
}
