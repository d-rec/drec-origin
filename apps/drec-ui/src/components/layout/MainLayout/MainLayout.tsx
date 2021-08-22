import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { PageWrapper } from '@energyweb/origin-ui-core';

export const MainLayout: FC = () => {
    return (
        <PageWrapper>
            <Outlet />
        </PageWrapper>
    );
};
