import React, { FC } from 'react';
import { LoginRegisterOrg } from './LoginRegisterOrg';
import { UserRegistered } from './UserRegistered';

export const UserModalsCenter: FC = () => {
    return (
        <>
            <UserRegistered />
            <LoginRegisterOrg />
        </>
    );
};
