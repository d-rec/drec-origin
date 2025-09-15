import { Injectable } from '@nestjs/common';

import { CertificateCommandEntity } from './certificate-command.entity';
import {
    CertificateCommandRepository,
    NewCertificateCommand
} from './certificate-command.repository';

@Injectable()
export class CertificateCommandInMemoryRepository implements CertificateCommandRepository {
    private db: CertificateCommandEntity[] = [];

    public async save(command: NewCertificateCommand): Promise<CertificateCommandEntity> {
        const entity = {
            ...command,
            createdAt: new Date(),
            id: this.db.length + 1
        };

        this.db.push(entity);

        return entity;
    }

    public async saveMany(commands: NewCertificateCommand[]): Promise<CertificateCommandEntity[]> {
        const savedEntities: CertificateCommandEntity[] = [];

        commands.forEach((command) => {
            const entity = {
                ...command,
                createdAt: new Date(),
                id: this.db.length + 1
            };

            this.db.push(entity);
            savedEntities.push(entity);
        });

        return savedEntities;
    }

    public async getAll(): Promise<CertificateCommandEntity[]> {
        return this.db;
    }

    public async getById(commandId: number): Promise<CertificateCommandEntity | null> {
        const found = this.db.find((e) => e.id === commandId);

        return found ?? null;
    }
}
