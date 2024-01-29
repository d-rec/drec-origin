import { FC } from 'react';
import { TableComponent } from '@energyweb/origin-ui-core';
import { Skeleton } from '@mui/material';
import { useMembersPageEffects } from './MembersPage.effects';

export const MembersPage: FC = () => {
    const { tableData, isLoading } = useMembersPageEffects();

    if (isLoading) {
        return <Skeleton height={200} width="100%" />;
    }

    return <TableComponent {...tableData} />;
};
