import { OnchainConfiguration } from './config.interface';
import { memoize } from 'lodash';
import { validateOrReject } from 'class-validator';
import { plainToClass } from 'class-transformer';

export const getConfiguration = memoize(
    (): OnchainConfiguration => ({
        CERTIFICATE_QUEUE_DELAY: process.env.CERTIFICATE_QUEUE_DELAY
            ? parseInt(process.env.CERTIFICATE_QUEUE_DELAY, 10)
            : 10000,
        ISSUER_PRIVATE_KEY: process.env.ISSUER_PRIVATE_KEY!,
        WEB3: {
            primaryRPC: process.env.WEB3?.split(';')?.[0]!,
            fallbackRPC: process.env.WEB3?.split(';')?.[1]!
        },
        BLOCKCHAIN_POLLING_INTERVAL: process.env.BLOCKCHAIN_POLLING_INTERVAL
            ? parseInt(process.env.BLOCKCHAIN_POLLING_INTERVAL, 10)
            : undefined,
        CERTIFICATE_QUEUE_LOCK_DURATION: Number(
            process.env.CERTIFICATE_QUEUE_LOCK_DURATION ?? 240 * 1000
        )
    })
);

export const validateConfiguration = async () => {
    const configValues = getConfiguration();
    await validateOrReject(plainToClass(OnchainConfiguration, configValues));
};
