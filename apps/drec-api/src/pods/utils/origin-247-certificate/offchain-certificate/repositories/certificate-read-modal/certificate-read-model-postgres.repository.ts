import { ICertificateReadModel } from "../../../../../../types/utils/certificates";
import { CertificateReadModelEntity } from "./certificate-read-model.entity";

export interface FindOptions {}

export enum CertificateReadModelColumns {}

export type NewCertificateReadModel<T> = Omit<
    CertificateReadModelEntity<T>,
    'id' | 'createdAt' | 'updatedAt'
>;

export interface CertificateReadModelRepository<T> {
    save(certificateRM: NewCertificateReadModel<T>): Promise<CertificateReadModelEntity<T>>;

    saveMany(
        certificateRMs: NewCertificateReadModel<T>[]
    ): Promise<CertificateReadModelEntity<T>[]>;

    getByInternalCertificateId(
        internalCertificateId: number
    ): Promise<ICertificateReadModel<T> | null>;

    getManyByInternalCertificateIds(
        internalCertificateIds: number[]
    ): Promise<ICertificateReadModel<T>[]>;

    getAll(options?: IGetAllCertificatesOptions): Promise<ICertificateReadModel<T>[]>;
}

export interface IGetAllCertificatesOptions {
    generationEndFrom?: Date;
    generationEndTo?: Date;
    generationStartFrom?: Date;
    generationStartTo?: Date;
    creationTimeFrom?: Date;
    creationTimeTo?: Date;
    deviceId?: string;
}
