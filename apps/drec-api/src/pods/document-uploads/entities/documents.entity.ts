import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum DocumentType {
  INCORPORATION_CERTIFICATE = 'incorporation certificate',
  LEGAL_REPRESENTATIVE_PASSPORT = 'legal representative passport',
  ADDRESS_PROOF = 'address proof',
  OWNERS_DECLARATION = 'owners declaration',
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
