import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum DocumentType {
  INCORPORATION_CERTIFICATE = 'INCORPORATION_CERTIFICATE',
  LEGAL_REPRESENTATIVE_PASSPORT = 'LEGAL_REPRESENTATIVE_PASSPORT',
  ADDRESS_PROOF = 'ADDRESS_PROOF',
  OWNERS_DECLARATION = 'OWNERS_DECLARATION ',
  FORM_SF_02 = 'FORM_SF_02', //Form SF-02 - Production Facility Registration
  SF_02C = 'SF_02C', //SF-02C Owner's Declaration or Proof of Ownership
  METERING_EVIDENCE = 'METERING_EVIDENCE', //Metering Evidence
  SINGLE_LINE_DIAGRAM = 'SINGLE_LINE_DIAGRAM', //Single Line Diagram
  PROJECT_PHOTOS = 'PROJECT_PHOTOS', //Project Photos
  DEVICE_GROUP_CERTIFICATES = 'DEVICE_GROUP_CERTIFICATES',
  COD_PROOF = 'COD_PROOF', //Certificate of Completion / COD Proof
}

export enum DocumentTargetType {
  ORGANIZATION = 'organization',
  DEVICE = 'device',
  USER = 'user',
}

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'target_id' })
  @IsNumber()
  @IsNotEmpty()
  targetId: number;

  @Column({ name: 'target_type' })
  @IsEnum(DocumentTargetType)
  @IsNotEmpty()
  targetType: DocumentTargetType;

  @Column({ name: 'type' })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @Column({ name: 'extension' })
  @IsString()
  @IsNotEmpty()
  extension: string;

  @Column({ name: 'url' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @Column({ name: 'created_at' })
  @IsDate()
  @IsNotEmpty()
  createdAt: Date;

  @Column({ name: 'updated_at' })
  @IsDate()
  @IsNotEmpty()
  updatedAt: Date;
}
