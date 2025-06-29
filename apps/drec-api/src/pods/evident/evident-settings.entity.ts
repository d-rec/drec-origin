import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../organization/organization.entity';

@Entity('evident_settings')
@Unique(['organizationId'])
export class EvidentSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'organization_id' })
  organizationId: number;

  @Column({
    type: 'text',
    name: 'api_key',
  })
  apiKey: string;

  @Column({ type: 'varchar', name: 'default_trading_account' })
  defaultTradingAccount: string;

  @Column({ type: 'varchar', name: 'default_beneficiary_account' })
  defaultBeneficiaryAccount: string;

  @Column({ type: 'varchar', name: 'email' })
  email: string;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.evidentSettings)
  @JoinColumn({ name: 'organization_id', referencedColumnName: 'id' })
  organization: Organization;
}
