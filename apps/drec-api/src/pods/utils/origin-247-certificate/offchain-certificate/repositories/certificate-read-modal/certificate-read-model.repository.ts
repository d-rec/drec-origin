import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { CertificateReadModelEntity } from './certificate-read-model.entity';
import { CertificateReadModelRepository, IGetAllCertificatesOptions } from './certificate-read-model-postgres.repository';

const dateToSeconds = (d: Date) => Math.floor(d.getTime() / 1000);
const futureDate = new Date('2038-01-01T00:00:00.000Z'); // used for more elegant query, this is almost max date, that can be converted to postgres int4

@Injectable()
export class CertificateReadModelPostgresRepository<T>
    implements CertificateReadModelRepository<T> {
    constructor(
        @InjectRepository(CertificateReadModelEntity)
        private repository: Repository<CertificateReadModelEntity<T>>
    ) {}

    async save(
        certificateReadModel: CertificateReadModelEntity<T>
    ): Promise<CertificateReadModelEntity<T>> {
        await this.repository.save(certificateReadModel as any); // TypeORM doesn't work well with generic entities

        return certificateReadModel;
    }

    async saveMany(
        certificateReadModels: CertificateReadModelEntity<T>[]
    ): Promise<CertificateReadModelEntity<T>[]> {
        await this.repository.save(certificateReadModels as any[]);

        return certificateReadModels;
    }

    async getAll(
        options: IGetAllCertificatesOptions = {}
    ): Promise<CertificateReadModelEntity<T>[]> {
        const generationEndFrom = dateToSeconds(options.generationEndFrom ?? new Date(0));
        const generationEndTo = dateToSeconds(options.generationEndTo ?? futureDate);
        const generationStartFrom = dateToSeconds(options.generationStartFrom ?? new Date(0));
        const generationStartTo = dateToSeconds(options.generationStartTo ?? futureDate);
        const creationTimeFrom = dateToSeconds(options.creationTimeFrom ?? new Date(0));
        const creationTimeTo = dateToSeconds(options.creationTimeTo ?? futureDate);

        return this.repository.find({
            where: {
                generationEndTime: Between(generationEndFrom, generationEndTo),
                generationStartTime: Between(generationStartFrom, generationStartTo),
                creationTime: Between(creationTimeFrom, creationTimeTo),
                ...(options.deviceId ? { deviceId: options.deviceId } : {})
            },
            order: {
                internalCertificateId: 'ASC'
            }
        });
    }

    async getByInternalCertificateId(
        internalCertificateId: number
    ): Promise<CertificateReadModelEntity<T> | null> {
        const found = await this.repository.findOne({
            where: {
                internalCertificateId: internalCertificateId
            }
        });
        return found ?? null;
    }

    async getManyByInternalCertificateIds(
        internalCertificateIds: number[]
    ): Promise<CertificateReadModelEntity<T>[]> {
        return await this.repository.find({
            where: {
                internalCertificateId: In(internalCertificateIds)
            }
        });
    }
}
