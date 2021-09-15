import { UserStatus } from '@energyweb/origin-drec-api-client';

export const STATUS_OPTIONS = Object.keys(UserStatus).map((key) => ({
    value: key,
    label: key
}));
