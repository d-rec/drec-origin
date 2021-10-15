import React, { FC } from 'react';

import { CircularProgress, Typography } from '@material-ui/core';

import { useDetailViewGroupPageEffects } from './DetailViewGroupPage.effects';
import { useStyles } from './DetailViewGroupPage.styles';
import { DetailViewCard, DeviceGroupLocationData, DevicesMap } from '../../containers';

export const DetailViewGroupPage: FC = () => {
    const classes = useStyles();
    const { locationProps, cardProps, deviceGroup, isLoading, allTypes } =
        useDetailViewGroupPageEffects();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <div className={classes.wrapper}>
            <DevicesMap
                deviceGroupName={`Facility ${deviceGroup.id}`}
                devices={deviceGroup.devices}
                itemProps={{ className: classes.map }}
            />
            <DeviceGroupLocationData {...locationProps} />

            <DetailViewCard {...cardProps} />
        </div>
    );
};
