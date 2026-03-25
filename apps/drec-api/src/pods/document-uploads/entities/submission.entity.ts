import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SubmissionStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('submissions')
export class SubmissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_subfolder' })
  @IsString()
  @IsNotEmpty()
  projectSubfolder: string;

  @Column({ name: 'submitted_at' })
  @IsDate()
  @IsNotEmpty()
  submittedAt: Date;

  @Column({ name: 'reviewer_name', nullable: true })
  @IsString()
  @IsOptional()
  reviewerName: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  @IsEnum(SubmissionStatus)
  @IsNotEmpty()
  status: SubmissionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
