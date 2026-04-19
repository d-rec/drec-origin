import { ExtendedBaseEntity } from '@energyweb/origin-backend-utils';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsString,
} from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DeviceDescription, IDevice } from '../../models';
import { DeviceTypeCode, EvidencePathway, FuelCode, OffTaker, OperatingConfiguration, OwnershipStatus, PublicFundingType, RegistrationType, SourceAccessMode, SubsidyType, VolumeEvidenceType, YesNo } from '../../utils/enums';
import { Organization } from '../organization/organization.entity';
import { CheckCertificateIssueDateLogForDeviceEntity } from './check_certificate_issue_date_log_for_device.entity';
import { EvidentRegistrationStatus } from '../../types/evident';
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
  externalId?: string;

  @Column()
  @IsString()
  operatorExternalId?: string;

  // @Column({ nullable: true, default: DeviceStatus.Active })
  // @IsNotEmpty()
  // @IsEnum(DeviceStatus)
  // status: DeviceStatus;

  @Column()
  organizationId: number;

  @ManyToOne(() => Organization, { eager: true }) // Make sure you have the correct type for Organization
  @JoinColumn({ name: 'organizationId' }) // Make sure the column name matches your database schema
  organization: Organization;

  @Column({ nullable: true })
  @IsString()
  siteName: string;

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
  @IsEnum(DeviceTypeCode)
  deviceTypeCode: DeviceTypeCode;

  // @Column()
  // @IsEnum(Installation)
  // installationConfiguration: Installation;

  @Column({ type: 'double precision', nullable: true })
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

  @Column({ type: 'varchar', nullable: true })
  @IsEnum(OperatingConfiguration)
  operatingConfiguration: OperatingConfiguration;

  @Column({ type: 'varchar', nullable: true })
  @IsEnum(SourceAccessMode)
  sourceAccessMode: SourceAccessMode;

  @Column({
    type: 'varchar',
    nullable: true,
    name: 'evidence_pathway',
  })
  @IsEnum(EvidencePathway)
  evidencePathway: EvidencePathway;

  @Column({
    type: 'varchar',
    nullable: true,
    default: OwnershipStatus.Unverified,
    name: 'ownership_status',
  })
  @IsEnum(OwnershipStatus)
  ownershipStatus: OwnershipStatus;

  @Column({ nullable: true })
  @IsEnum(OffTaker)
  offTaker: OffTaker;

  // @Column()
  // @IsEnum(Sector)
  // sector: Sector;

  // @Column()
  // @IsEnum(StandardCompliance)
  // standardCompliance: StandardCompliance;

  //@Column({ default: 1500 })
  @Column({ default: 2000 })
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

  @Column({ type: 'varchar', nullable: true })
  meterReadtype: string;

  @Column({ type: 'varchar', nullable: true })
  timezone: string;

  @Column()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  version: string;

  @Column({ type: 'varchar', nullable: true })
  IREC_Status: string;

  @Column({ type: 'varchar', nullable: true })
  IREC_ID: string;

  @Column({ nullable: true })
  updatedAt: Date;

  // @BeforeUpdate()
  // updateTimestamp() {
  //   this.updatedAt = new Date(); // Set the updatedAt field to the current date and time
  // }

  @Column({ nullable: true })
  api_user_id: string;

  @Column({ nullable: true, name: 'state_province' })
  stateProvince: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'postcode' })
  postcode: string;

  @Column({ type: 'varchar', nullable: true, name: 'fingerprint' })
  fingerprint: string;

  @Column({ type: 'varchar', nullable: true, name: 'evident_device_id' })
  evidentDeviceId: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'evident_status' })
  evidentStatus: EvidentRegistrationStatus | null;

  @Column({ type: 'varchar', nullable: false, name: 'data_source_brand' })
  dataSourceBrand: string;
  @Column({ type: 'varchar', nullable: false, name: 'data_source' })
  dataSource: string;

  @Column({ type: 'varchar', nullable: true, name: 'other_data_source' })
  otherDataSource: string | null;

  @Column({ type: 'varchar', nullable: false, name: 'serial_number' })
  serialNumber: string;

  @Column({ type: 'decimal', nullable: true, name: 'sld_capacity_kw' })
  sldCapacityKw: number | null;

  // General (Evident checklist rows 2, 8)
  @Column({ type: 'varchar', nullable: true, name: 'default_account_code' })
  @IsString()
  defaultAccountCode: string | null;

  @Column({ type: 'date', nullable: true, name: 'requested_effective_reg_date' })
  requestedEffectiveRegDate: string | null;

  // Signature & evidence pathway (Evident checklist rows 55-56, 58-59, 61-62)
  @Column({ type: 'varchar', nullable: true, name: 'signatory_name' })
  @IsString()
  signatoryName: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'is_grid_connected' })
  @IsEnum(YesNo)
  isGridConnected: YesNo | null;

  @Column({ type: 'varchar', nullable: true, name: 'grid_export_type' })
  @IsString()
  gridExportType: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'has_network_meter' })
  @IsEnum(YesNo)
  hasNetworkMeter: YesNo | null;

  @Column({ type: 'varchar', nullable: true, name: 'meter_reads_shareable' })
  @IsEnum(YesNo)
  meterReadsShareable: YesNo | null;

  // Business details (Evident checklist rows 43, 45-48, 54)
  @Column({ type: 'varchar', nullable: true, name: 'has_captive_consumer' })
  @IsEnum(YesNo)
  hasCaptiveConsumer: YesNo | null;

  @Column({ type: 'varchar', nullable: true, name: 'has_auxiliary_energy_sources' })
  @IsEnum(YesNo)
  hasAuxiliaryEnergySources: YesNo | null;

  @Column({ type: 'varchar', nullable: true, name: 'auxiliary_energy_source_details' })
  @IsString()
  auxiliaryEnergySourceDetails: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'non_meter_import_details' })
  @IsString()
  nonMeterImportDetails: string | null;

  @Column({ type: 'text', nullable: true, name: 'other_eac_scheme_registration' })
  @IsString()
  otherEacSchemeRegistration: string | null;

  @Column({ type: 'text', nullable: true, name: 'additional_info' })
  @IsString()
  additionalInfo: string | null;

  // Facility technical (Evident checklist rows 32, 33, 35, 36)
  @Column('simple-array', { nullable: true, name: 'meter_ids' })
  @IsArray()
  meterIds: string[] | null;

  @Column({ type: 'int', nullable: true, name: 'generating_unit_count' })
  @IsNumber()
  generatingUnitCount: number | null;

  @Column({ type: 'varchar', nullable: true, name: 'network_owner' })
  @IsString()
  networkOwner: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'interconnection_voltage' })
  @IsString()
  interconnectionVoltage: string | null;

  // Ownership & off-taker (Evident checklist rows 76, 77, 81)
  @Column({ type: 'varchar', nullable: true, name: 'pv_system_owner' })
  @IsString()
  pvSystemOwner: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'off_taker_name' })
  @IsString()
  offTakerName: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'off_taker_same_company_as_owner' })
  @IsEnum(YesNo)
  offTakerSameCompanyAsOwner: YesNo | null;

  // Subsidies & incentives (rows 78, 79, 80)
  @Column({ type: 'varchar', nullable: true, name: 'has_subsidy' })
  @IsEnum(YesNo)
  hasSubsidy: YesNo | null;

  @Column('simple-array', { nullable: true, name: 'subsidy_types' })
  @IsArray()
  subsidyTypes: SubsidyType[] | null;

  @Column({ type: 'varchar', nullable: true, name: 'subsidy_other_details' })
  @IsString()
  subsidyOtherDetails: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'subsidy_claims_eacs' })
  @IsEnum(YesNo)
  subsidyClaimsEacs: YesNo | null;

  // Public funding (rows 50, 51)
  @Column({ type: 'varchar', nullable: true, name: 'has_public_funding' })
  @IsEnum(YesNo)
  hasPublicFunding: YesNo | null;

  @Column({ type: 'date', nullable: true, name: 'public_funding_end_date' })
  publicFundingEndDate: string | null;

  // SF-02 gaps
  @Column({ type: 'varchar', nullable: true, name: 'registration_type' })
  @IsEnum(RegistrationType)
  registrationType: RegistrationType | null;

  @Column({ type: 'varchar', nullable: true, name: 'volume_evidence_type' })
  @IsEnum(VolumeEvidenceType)
  volumeEvidenceType: VolumeEvidenceType | null;

  @Column({ type: 'varchar', nullable: true, name: 'public_funding_type' })
  @IsEnum(PublicFundingType)
  publicFundingType: PublicFundingType | null;

  @Column({ type: 'varchar', nullable: true, name: 'labelling_scheme_accreditation' })
  @IsString()
  labellingSchemeAccreditation: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'verification_agent_name' })
  @IsString()
  verificationAgentName: string | null;

  @Column({ type: 'text', nullable: true, name: 'off_grid_circumstances' })
  @IsString()
  offGridCircumstances: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'last_screen_status' })
  lastScreenStatus: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_screened_at' })
  lastScreenedAt: Date | null;

  @OneToMany(
    () => CheckCertificateIssueDateLogForDeviceEntity,
    (certificateLog) => certificateLog.device,
  )
  certificateLogs: CheckCertificateIssueDateLogForDeviceEntity[];
}
