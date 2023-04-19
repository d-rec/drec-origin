import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsArray
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
import { Exclude } from 'class-transformer';
@Entity()
export class DeviceGroup extends ExtendedBaseEntity implements IDeviceGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryGeneratedColumn('uuid')
  devicegroup_uid: string;

  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column()
  organizationId: number;

  @Column('text', { array: true })
  fuelCode: string[];

  @Column('text', { array: true })
  countryCode: string[];

  // @Column({ type: 'enum', enum: StandardCompliance })
  // @IsEnum(StandardCompliance)
  // @IsOptional()
  // standardCompliance: StandardCompliance;

  @Column('text', { array: true })
  deviceTypeCodes: string[];

  @Column('text', { array: true })
  offTakers: OffTaker[];

  // @Column('text', { array: true })
  // @IsOptional()
  // installationConfigurations: Installation[];

  // @Column('text', { array: true })
  // @IsOptional()
  // sectors: Sector[];

  @Column('text', { array: true })
  @Exclude()
  commissioningDateRange: CommissioningDateRange[];

  @Column()
  @IsBoolean()
  @Exclude()
  gridInterconnection: boolean;

  @Column()
  @IsNumber()
  aggregatedCapacity: number;

  @Column('text')
  @IsEnum(CapacityRange)
  capacityRange: CapacityRange;

  @Column({ default: 1000 })
  @IsNumber()
  @Exclude()
  yieldValue: number;

  // @Column('simple-array', { nullable: true })
  // @IsOptional()
  // labels: string[];

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

  @Column({
    type: 'json'
  })
  @IsOptional()
  leftoverReadsByCountryCode: any;

  devices?: Device[];
  organization?: Pick<IFullOrganization, 'name' | 'blockchainAccountAddress'>;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  frequency: string | null;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  targetVolumeInMegaWattHour: number;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  targetVolumeCertificateGenerationSucceededInMegaWattHour: number;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  targetVolumeCertificateGenerationRequestedInMegaWattHour: number;

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  targetVolumeCertificateGenerationFailedInMegaWattHour: number;

  @Column({ type: 'boolean', nullable: true })
  @IsNumber()
  @IsOptional()
  authorityToExceed: boolean;

  @Column('simple-array', { nullable: true })
  @IsArray()
  deviceIds?: number[];

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3
  })
  reservationStartDate: Date;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3
  })
  reservationEndDate: Date;

}
