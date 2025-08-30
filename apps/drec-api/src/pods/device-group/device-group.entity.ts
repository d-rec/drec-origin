import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  isNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IDeviceGroup, IFullOrganization } from '../../models';
import {
  CapacityRange,
  CommissioningDateRange,
  OffTaker,
} from '../../utils/enums';
//import { Device } from '../device';
import { Device } from '../device/device.entity';

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
    type: 'json',
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
    precision: 3,
  })
  reservationStartDate: Date;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3,
  })
  reservationEndDate: Date;

  @Column('int', { array: true })
  deviceIdsInt: number[];

  @Column({ type: 'boolean' })
  @IsOptional()
  reservationActive: boolean;

  // @ManyToMany(() => Device)
  // @JoinTable()
  // device: Device[];

  @Column({ nullable: true, default: null })
  api_user_id: string;

  @CreateDateColumn({
    type: 'timestamp',
    precision: 3,
  })
  reservationExpiryDate: Date;

  isExpired(): boolean {
    return (
      this.reservationExpiryDate != null &&
      this.reservationExpiryDate.getTime() <= new Date().getTime()
    );
  }

  loadLeftOverReadsByCountry(): void {
    if (!isNotEmpty(this.leftoverReadsByCountryCode)) {
      this.leftoverReadsByCountryCode = {};
    }

    if (typeof this.leftoverReadsByCountryCode === 'string') {
      this.leftoverReadsByCountryCode = JSON.parse(
        this.leftoverReadsByCountryCode,
      );
    }
  }
}
