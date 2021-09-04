import React, { FC } from 'react';
import { OrganizationAlreadyExists } from './OrganizationAlreadyExists';
import { RegisterThankYou } from './RegisterThankYou';

export const OrganizationModalsCenter: FC = () => {
    return (
        <>
            <OrganizationAlreadyExists />
            <RegisterThankYou />
        </>
    );
};
