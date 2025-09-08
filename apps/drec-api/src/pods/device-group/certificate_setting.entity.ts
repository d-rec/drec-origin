import { ExtendedBaseEntity } from '../utils/origin-backend-utils/extended-base-entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IsNumber } from 'class-validator';

@Entity('certificate_setting')
export class CertificateSettingEntity extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsNumber()
  no_of_days: number;
}
