import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { IDeviceGroup } from '../../models';
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
export class DeviceGroup extends ExtendedBaseEntity implements IDeviceGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  organizationId: number;

  @Column()
  @IsString()
  fuelCode: string;

  @Column()
  @IsString()
  countryCode: string;

  @Column({ type: 'enum', enum: StandardCompliance })
  @IsEnum(StandardCompliance)
  standardCompliance: StandardCompliance;

  @Column('text', { array: true })
  deviceTypeCodes: string[];

  @Column('text', { array: true })
  offTakers: OffTaker[];

  @Column('text', { array: true })
  installationConfigurations: Installation[];

  @Column('text', { array: true })
  sectors: Sector[];

  @Column('text', { array: true })
  commissioningDateRange: CommissioningDateRange[];

  @Column()
  @IsBoolean()
  gridInterconnection: boolean;

  @Column()
  @IsNumber()
  aggregatedCapacity: number;

  @Column({ type: 'enum', enum: CapacityRange })
  @IsEnum(CapacityRange)
  capacityRange: CapacityRange;

  @Column({ default: 1000 })
  @IsNumber()
  yieldValue: number;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  labels: string[];

  @Column({ nullable: true })
  @IsNumber()
  buyerId: number;

  @Column({ nullable: true })
  @IsString()
  buyerAddress: string;

  devices?: Device[];
}
