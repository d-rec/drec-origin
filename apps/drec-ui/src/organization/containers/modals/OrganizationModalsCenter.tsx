import React, { FC } from 'react';
import { ChangeMemberRole } from './ChangeMemberRole';
import { OrganizationAlreadyExists } from './OrganizationAlreadyExists';
import { RegisterThankYou } from './RegisterThankYou';
import { RoleChanged } from './RoleChanged';

export const OrganizationModalsCenter: FC = () => {
    return (
        <>
            <OrganizationAlreadyExists />
            <RegisterThankYou />
            <RoleChanged />
            <ChangeMemberRole />
        </>
    );
};
