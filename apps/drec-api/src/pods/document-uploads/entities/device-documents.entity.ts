import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DocumentTargetType {
  ORGANIZATION = 'organization',
}

export enum DocumentType {
  FORM_SF_02 = 'Form SF-02 - Production Facility Registration',
  SF_02C = "SF-02C Owner's Declaration or Proof of Ownership",
  METERING_EVIDENCE = 'Metering Evidence',
  SINGLE_LINE_DIAGRAM = 'Single Line Diagram',
  PROJECT_PHOTOS = 'Project Photos',
}

@Entity('deviceDocuments')
export class DeviceDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'target_id' })
  targetId: number;

  @Column({
    type: 'enum',
    enum: DocumentTargetType,
    name: 'target_type',
  })
  TargetType: DocumentTargetType;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  type: DocumentType;

  @Column()
  extension: string;

  @Column({ length: 2000 })
  url: string;
}
