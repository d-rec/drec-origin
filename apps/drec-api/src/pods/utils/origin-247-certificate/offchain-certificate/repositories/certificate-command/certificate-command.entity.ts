import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const tableName = 'certificate_command';

@Entity(tableName)
export class CertificateCommandEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Column({ type: 'simple-json' })
    payload: unknown; // each command has different type and we save this using generic `persistError` message
}
