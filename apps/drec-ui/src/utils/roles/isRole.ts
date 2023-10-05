import { Role } from '@energyweb/origin-drec-api-client';

export const isRole = (orgRole: Role, ...roles: Role[]): boolean =>
    roles.some((role) => role === orgRole);
