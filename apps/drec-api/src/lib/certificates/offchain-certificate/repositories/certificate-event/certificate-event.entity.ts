import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import {
  CertificateEventType,
  ICertificateEvent,
} from '../../../types/utils/certificates';

export const tableName = 'certificate_event';

@Entity(tableName)
export class CertificateEventEntity implements ICertificateEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ nullable: false })
  internalCertificateId: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ nullable: false })
  commandId: number;

  @Column({ enum: CertificateEventType })
  type: CertificateEventType;

  @Column()
  version: number;

  @Column({ type: 'simple-json' })
  payload: unknown;
}
