import { UserStatus, OrganizationStatus } from '@energyweb/origin-drec-api-client';

export const USER_STATUS_OPTIONS = Object.keys(UserStatus).map((key) => ({
    value: key,
    label: key
}));

export const ORGANIZATION_STATUS_OPTIONS = Object.keys(OrganizationStatus).map((key) => ({
    value: key,
    label: key
}));
