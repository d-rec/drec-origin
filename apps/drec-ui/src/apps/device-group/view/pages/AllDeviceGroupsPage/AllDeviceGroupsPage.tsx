import { FC } from 'react';
import { CircularProgress, Grid } from '@mui/material';
import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useStyles } from './AllDeviceGroupsPage.styles';
import { useAllDeviceGroupsPageEffects } from './AllDeviceGroupsPage.effects';
import { NoDeviceGroupsOwnedCard, PublicDeviceGroupCard } from '../../containers';

export const AllDeviceGroupsPage: FC = () => {
    const { allDeviceGroups, allDeviceTypes, isLoading } = useAllDeviceGroupsPageEffects();
    const classes = useStyles();

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!isLoading && allDeviceGroups?.length === 0) {
        return <NoDeviceGroupsOwnedCard />;
    }

    return (
        <Grid container spacing={3} className={classes.wrapper}>
            {allDeviceGroups?.map((deviceGroup: DeviceGroupDTO) => (
                <Grid key={`device-group-${deviceGroup.id}`} item>
                    <PublicDeviceGroupCard
                        deviceGroup={deviceGroup}
                        allDeviceTypes={allDeviceTypes}
                    />
                </Grid>
            ))}
        </Grid>
    );
};
