import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { IDevice, IDeviceGroup } from '../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  Installation,
  OffTaker,
  Sector,
  StandardCompliance,
} from '../../utils/enums';

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

  @Column()
  @IsEnum(StandardCompliance)
  standardCompliance: StandardCompliance;

  @Column('text', { array: true })
  deviceTypeCodes: string[];

  @Column({
    type: 'enum',
    enum: OffTaker,
    array: true,
    default: [],
  })
  offTakers: OffTaker[];

  @Column({
    type: 'enum',
    enum: Installation,
    array: true,
    default: [],
  })
  installationConfigurations: Installation[];

  @Column({
    type: 'enum',
    enum: Sector,
    array: true,
    default: [],
  })
  sectors: Sector[];

  @Column({
    type: 'enum',
    enum: CommissioningDateRange,
    array: true,
    default: [],
  })
  commissioningDateRange: CommissioningDateRange[];

  @Column()
  @IsBoolean()
  gridInterconnection: boolean;

  @Column()
  @IsNumber()
  aggregatedCapacity: number;

  @Column()
  @IsEnum(CapacityRange)
  capacityRange: CapacityRange;

  @Column({ default: 1000 })
  @IsNumber()
  yieldValue: number;

  @Column({ nullable: true })
  @IsString()
  labels: string;

  devices?: IDevice[];
}
