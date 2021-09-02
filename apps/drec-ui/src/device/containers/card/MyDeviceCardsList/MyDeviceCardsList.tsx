import React from 'react';
import { Grid } from '@material-ui/core';

import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

// import { RequestCertificateForm } from '../../form';
import { MyDeviceCard } from '../MyDeviceCard';

import { useMyDeviceCardsListEffects } from './MyDeviceCardsList.effects';
import { useStyles } from './MyDevicesCardsList.styles';
import { NoDevicesOwnedCard } from '../NoDevicesOwnedCard';

export interface MyDeviceCardsListProps {
    devices: DeviceDTO[];
    allDeviceTypes: CodeNameDTO[];
}

export const MyDeviceCardsList: React.FC<MyDeviceCardsListProps> = ({
    devices,
    allDeviceTypes
}) => {
    const { selected, handleSelect } = useMyDeviceCardsListEffects(devices);

    const classes = useStyles();

    if (devices.length === 0) {
        return <NoDevicesOwnedCard />;
    }

    return (
        <Grid container className={classes.wrapper}>
            <div className={classes.content}>
                {devices.map((device) => (
                    <MyDeviceCard
                        key={device.id}
                        selected={selected === device.id}
                        onClick={() => handleSelect(device.id)}
                        allDeviceTypes={allDeviceTypes}
                        device={device}
                    />
                ))}
            </div>
        </Grid>
    );
};
