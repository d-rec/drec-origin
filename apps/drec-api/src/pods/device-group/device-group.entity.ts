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
import { IDeviceGroup, IFullOrganization } from '../../models';
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

  @Column('text')
  @IsEnum(CapacityRange)
  capacityRange: CapacityRange;

  @Column({ default: 1000 })
  @IsNumber()
  yieldValue: number;

  @Column('simple-array', { nullable: true })
  @IsOptional()
  labels: string[];

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  buyerId!: number | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  buyerAddress!: string | null;

  @Column({
    type: 'float',
    default: 0.0,
    nullable: true,
  })
  @IsOptional()
  @IsNumber()
  leftoverReads: number;

  devices?: Device[];
  organization?: Pick<IFullOrganization, 'name' | 'blockchainAccountAddress'>;
}
