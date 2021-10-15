import React from 'react';
import { Grid } from '@material-ui/core';
import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { MyDeviceGroupCard } from '../MyDeviceGroupCard';
import { NoDeviceGroupsOwnedCard } from '../NoDeviceGroupsOwnedCard';
import { useMyDeviceGroupCardsListEffects } from './MyDeviceGroupCardsList.effects';
import { useStyles } from './MyDeviceGroupCardsList.styles';

export interface MyDeviceGroupCardsListProps {
    deviceGroups: DeviceGroupDTO[];
    allDeviceTypes: CodeNameDTO[];
}

export const MyDeviceGroupCardsList: React.FC<MyDeviceGroupCardsListProps> = ({
    deviceGroups,
    allDeviceTypes
}) => {
    const { selected, handleSelect } = useMyDeviceGroupCardsListEffects(deviceGroups);

    const classes = useStyles();

    if (deviceGroups.length === 0) {
        return <NoDeviceGroupsOwnedCard />;
    }

    return (
        <Grid container className={classes.wrapper}>
            <div className={classes.content}>
                {deviceGroups.map((deviceGroup) => (
                    <MyDeviceGroupCard
                        key={deviceGroup.id}
                        selected={selected === deviceGroup.id}
                        onClick={() => handleSelect(deviceGroup.id)}
                        allDeviceTypes={allDeviceTypes}
                        deviceGroup={deviceGroup}
                    />
                ))}
            </div>
        </Grid>
    );
};
