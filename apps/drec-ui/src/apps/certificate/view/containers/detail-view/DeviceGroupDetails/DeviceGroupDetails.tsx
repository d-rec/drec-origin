import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { CircularProgress } from '@material-ui/core';
import { FC } from 'react';
import {
    DeviceGroupLocationData,
    DetailViewCard,
    DeviceGroupName
} from '../../../../../device-group';
import { useDeviceGroupDetailsEffects } from './DeviceGroupDetails.effects';
import { useStyles } from './DeviceGroupDetails.styles';

export interface DeviceGroupDetailsProps {
    deviceGroup: DeviceGroupDTO;
}

export const DeviceGroupDetails: FC<DeviceGroupDetailsProps> = ({ deviceGroup }) => {
    const classes = useStyles();
    const { locationProps, cardProps, isLoading } = useDeviceGroupDetailsEffects(deviceGroup);

    if (isLoading) return <CircularProgress />;

    return (
        <div className={classes.wrapper}>
            <DeviceGroupLocationData {...locationProps} />
            <DeviceGroupName name={deviceGroup.name} />
            <DetailViewCard {...cardProps} fullWidth={true} />
        </div>
    );
};
