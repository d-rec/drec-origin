import { CreateDateColumn, Entity, Column, Index, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { IClaim } from '@energyweb/issuer';
import { CertificateEventType, ICertificateReadModel } from '../../../../../../types/utils/certificates';

export const tableName = 'certificate_read_model';

@Entity(tableName)
export class CertificateReadModelEntity<MetadataType>
    implements ICertificateReadModel<MetadataType> {
    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @Index()
    @PrimaryColumn({ nullable: false, unique: true })
    internalCertificateId: number;

    @Column({ nullable: true, type: Number })
    blockchainCertificateId: number | null;

    @Column()
    deviceId: string;

    @Column({})
    generationStartTime: number;

    @Column({})
    generationEndTime: number;

    @Column({})
    creationTime: number;

    @Column({ type: 'simple-json' })
    owners: Record<string, string>;

    @Column({ type: 'simple-json' })
    claimers: Record<string, string> | null;

    @Column('simple-json')
    claims: IClaim[];

    @Column()
    creationBlockHash: string;

    @Column({ type: 'simple-json', nullable: true })
    metadata: MetadataType;

    @Column()
    isSynced: boolean;

    @Column({ type: 'simple-json', default: [] })
    transactions: CertificateTransaction[];

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}

export interface CertificateTransaction {
    transactionHash: string;
    eventType: CertificateEventType;
    timestamp: Date;
}
