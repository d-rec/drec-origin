import { FC } from 'react';
import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { CircularProgress, Paper, Typography, Grid, Button } from '@mui/material';
import { SelectGroupBy, UngroupedDevicesContainer, NoItems } from '../../containers';
import { useUngrouppedDevicesPageEffects } from './UngroupedDevicesPage.effects';
import { useStyles } from './UngroupedDevicesPage.styles';

export const UngroupedDevicesPage: FC = () => {
    const classes = useStyles();
    const {
        field,
        orderItems,
        handleChange,
        handleChecked,
        onGroupSelected,
        onAutoGroupSelected,
        groupedDevicesList,
        isLoading,
        handleCreateNewGroup,
        noUngroupedDevicesTitle
    } = useUngrouppedDevicesPageEffects();

    if (isLoading) {
        return <CircularProgress />;
    }

    if (!isLoading && groupedDevicesList?.length === 0) {
        return <NoItems title={noUngroupedDevicesTitle} />;
    }

    return (
        <Paper className={classes.paper}>
            <Typography variant="h5">Ungrouped Devices</Typography>
            <Grid container className={classes.dataWrapper}>
                <SelectGroupBy
                    field={field}
                    orderItems={orderItems}
                    handleChange={handleChange}
                    itemProps={{ className: classes.autocomplete }}
                />
                <div className={classes.buttonsWrapper}>
                    <Button onClick={onGroupSelected} color="primary" variant="contained">
                        Group
                    </Button>
                    <Button onClick={onAutoGroupSelected} color="primary" variant="contained">
                        Auto Group Selected
                    </Button>
                </div>
            </Grid>
            <Grid container className={classes.devicesWrapper} style={{ width: '100%' }}>
                {groupedDevicesList?.map((groupedDevices: GroupedDevicesDTO) => (
                    <Grid
                        key={`device-container-${groupedDevices.name}`}
                        item
                        style={{ width: '100%' }}
                    >
                        <UngroupedDevicesContainer
                            itemProps={{ className: classes.devicesWrapper }}
                            groupedDevices={groupedDevices}
                            handleChecked={handleChecked}
                            handleCreateNewGroup={() => handleCreateNewGroup(groupedDevices)}
                        />
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};
