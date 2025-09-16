import { memoize } from 'lodash';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { OffchainCertificateConfiguration } from './config.interface';

export const getConfiguration = memoize(
    (): OffchainCertificateConfiguration => ({
        MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT: process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT
            ? Number(process.env.MAX_SYNCHRONIZATION_ATTEMPTS_FOR_EVENT)
            : 3,
        ISSUE_BATCH_SIZE: process.env.ISSUE_BATCH_SIZE
            ? parseInt(process.env.ISSUE_BATCH_SIZE)
            : 10,
        CLAIM_BATCH_SIZE: process.env.CLAIM_BATCH_SIZE
            ? parseInt(process.env.CLAIM_BATCH_SIZE)
            : 20,
        TRANSFER_BATCH_SIZE: process.env.TRANSFER_BATCH_SIZE
            ? parseInt(process.env.TRANSFER_BATCH_SIZE)
            : 20
    })
);

export const validateConfiguration = async () => {
    const configValues = getConfiguration();
    await validateOrReject(plainToClass(OffchainCertificateConfiguration, configValues));
};
