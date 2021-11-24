import React, { FC } from 'react';

import { CircularProgress } from '@material-ui/core';

import { useDetailViewGroupPageEffects } from './DetailViewGroupPage.effects';
import { useStyles } from './DetailViewGroupPage.styles';
import {
    DetailViewCard,
    DeviceGroupLocationData,
    DeviceGroupName,
    DevicesMap,
    SmartMeterBlock
} from '../../containers';
import { TableComponent } from '@energyweb/origin-ui-core';

export const DetailViewGroupPage: FC = () => {
    const classes = useStyles();
    const { locationProps, cardProps, deviceGroup, isLoading, tableProps } =
        useDetailViewGroupPageEffects();

    if (isLoading && !deviceGroup) {
        return <CircularProgress />;
    }

    return (
        <div className={classes.wrapper}>
            <DevicesMap devices={deviceGroup.devices} itemProps={{ className: classes.map }} />
            <DeviceGroupLocationData {...locationProps} />
            <DeviceGroupName name={deviceGroup.name} />
            <DetailViewCard {...cardProps} />
            <TableComponent {...tableProps} />
            <SmartMeterBlock deviceGroup={deviceGroup} />
        </div>
    );
};
