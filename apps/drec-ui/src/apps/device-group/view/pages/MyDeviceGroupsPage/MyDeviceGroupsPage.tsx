import React, { FC } from 'react';
import { Skeleton } from '@material-ui/core';
import { MyDeviceGroupCardsList } from '../../containers';
import { useMyDeviceGroupsPageEffects } from './MyDeviceGroupsPage.effects';

export const MyDeviceGroupsPage: FC = () => {
    const { myDeviceGroups, allDeviceTypes, isLoading } = useMyDeviceGroupsPageEffects();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Skeleton width={1000} height={140} />
                <Skeleton width={1000} height={140} />
                <Skeleton width={1000} height={140} />
            </div>
        );
    }

    return <MyDeviceGroupCardsList allDeviceTypes={allDeviceTypes} deviceGroups={myDeviceGroups} />;
};
