import { CertificateCommandEntity } from './certificate-command.entity';

export interface FindOptions {
    eventId: number;
    createdAt: Date;
}

export enum CertificateCommandColumns {
    Id = 'id',
    CreatedAt = 'createdAt',
    Payload = 'payload'
}

export type NewCertificateCommand = Omit<CertificateCommandEntity, 'id' | 'createdAt'>;

export interface CertificateCommandRepository {
    save(certificateCommand: NewCertificateCommand): Promise<CertificateCommandEntity>;

    saveMany(certificateCommands: NewCertificateCommand[]): Promise<CertificateCommandEntity[]>;

    getById(commandId: number): Promise<CertificateCommandEntity | null>;

    getAll(): Promise<CertificateCommandEntity[]>;
}
