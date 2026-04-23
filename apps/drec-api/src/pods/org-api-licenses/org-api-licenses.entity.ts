import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../organization/organization.entity';

@Entity('org_api_licenses')
@Unique(['organizationId'])
export class OrgApiLicenses {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'organization_id' })
  organizationId: number;

  @Column({ type: 'text', name: 'roboflow_api_key', nullable: true })
  roboflowApiKey: string | null;

  @Column({ type: 'text', name: 'roboflow_workflow_url', nullable: true })
  roboflowWorkflowUrl: string | null;

  @Column({ type: 'text', name: 'deepl_api_key', nullable: true })
  deeplApiKey: string | null;

  @Column({
    type: 'integer',
    name: 'roboflow_credits_remaining',
    default: 3,
  })
  roboflowCreditsRemaining: number;

  @Column({
    type: 'integer',
    name: 'deepl_credits_remaining',
    default: 3,
  })
  deeplCreditsRemaining: number;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  organization: Organization;
}
