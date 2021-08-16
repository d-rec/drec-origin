import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { PageWrapper } from '../../../core';

export const MainLayout: FC = () => {
    return (
        <PageWrapper>
            <Outlet />
        </PageWrapper>
    );
};
