import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export const tableName = 'certificate_synchronization_attempt';

@Entity(tableName)
export class CertificateSynchronizationAttemptEntity {
    @PrimaryColumn()
    eventId: number;

    @Column({ name: 'attempts_count' })
    attemptsCount: number;

    @Column({ nullable: true })
    error?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}
