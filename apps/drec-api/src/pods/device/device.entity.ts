import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn,BeforeUpdate } from 'typeorm';
import {
  DeviceStatus,
  Installation,
  Integrator,
  OffTaker,
  Sector,
  StandardCompliance,
  FuelCode,
  DevicetypeCode
} from '../../utils/enums';
import {
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray
} from 'class-validator';
import { Exclude } from 'class-transformer';
import { DeviceDescription, IDevice } from '../../models';

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

  @Column()
  @IsString()
  @Exclude()
  developerExternalId?: string;

  // @Column({ nullable: true, default: DeviceStatus.Active })
  // @IsNotEmpty()
  // @IsEnum(DeviceStatus)
  // status: DeviceStatus;

  @Column()
  organizationId: number;

  @Column({ nullable: true })
  @IsString()
  projectName: string;

  @Column({ nullable: true })
  @IsString()
  address: string;

  @Column({ nullable: true })
  @IsString()
  latitude: string;

  @Column({ nullable: true })
  @IsString()
  longitude: string;

  @Column({ nullable: true })
  @IsString()
  countryCode: string;

  // @Column({ nullable: true })
  // @IsString()
  // zipCode: string;

  @Column({ nullable: true })
  @IsEnum(FuelCode)
  fuelCode: FuelCode;


  @Column({ nullable: true })
  @IsEnum(DevicetypeCode)
  deviceTypeCode: DevicetypeCode;

  // @Column()
  // @IsEnum(Installation)
  // installationConfiguration: Installation;

  @Column({ nullable: true })
  @IsNumber()
  capacity: number;

  @Column('simple-array', { nullable: true })
  @IsArray()
  SDGBenefits?: string[];


  @Column({ nullable: true })
  @IsString()
  commissioningDate: string;

  @Column({ nullable: true })
  @IsBoolean()
  gridInterconnection: boolean;

  @Column({ nullable: true })
  @IsEnum(OffTaker)
  offTaker: OffTaker;

  // @Column()
  // @IsEnum(Sector)
  // sector: Sector;

  // @Column()
  // @IsEnum(StandardCompliance)
  // standardCompliance: StandardCompliance;

  @Column({ default: 1500 })
  @IsNumber()
  yieldValue: number;

  // @Column('int', { nullable: true, array: true })
  // generatorsIds: number[];

  // @Column({ nullable: true })
  // @IsString()
  // labels: string;

  @Column({ nullable: true })
  @IsString()
  impactStory: string;

  // @Column({ nullable: true })
  // data: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ type: 'int', nullable: true })
  groupId: number | null;

  // @Column({ nullable: true })
  // @IsEnum(Integrator)
  // integrator: Integrator;

  @Column({ nullable: true })
  @IsEnum(DeviceDescription)
  deviceDescription?: DeviceDescription;

  @Column({ type: 'boolean', nullable: true })
  energyStorage: boolean;

  @Column({ type: 'int', nullable: true })
  energyStorageCapacity: number;

  @Column({ type: 'varchar', nullable: true })
  qualityLabels: string;

  @Column({ type: 'varchar', nullable: true})
  meterReadtype: string;

  @Column({ type: 'varchar', nullable: true})
  timezone: string;

  @Column()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  version: string;

  @Column({ nullable: true })
  updatedAt: Date;

  // @BeforeUpdate()
  // updateTimestamp() {
  //   this.updatedAt = new Date(); // Set the updatedAt field to the current date and time
  // }
}
