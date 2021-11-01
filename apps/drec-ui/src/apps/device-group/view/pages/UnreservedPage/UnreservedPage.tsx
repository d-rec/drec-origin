import { FC } from 'react';
import { CircularProgress, Paper, Typography, Grid, Button, Box } from '@material-ui/core';
import { useStyles } from './UnreservedPage.styles';
import { useUnreservedPageEffects } from './UnreservedPage.effects';
import { GenericForm, TableComponent } from '@energyweb/origin-ui-core';

export const UnreservedPage: FC = () => {
    const classes = useStyles();
    const {
        deviceGroups,
        tableProps,
        formData,
        isLoading,
        noUnreservedDeviceGroupsTitle,
        onReserveHandler,
        disableReserveButton
    } = useUnreservedPageEffects();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Paper className={classes.paper}>
            <Typography variant="h5">Unreserved Device Groups</Typography>
            <GenericForm
                inputsVariant="filled"
                twoColumns={true}
                buttonWrapperProps={{
                    justifyContent: 'flex-end'
                }}
                {...formData}
            />
            {deviceGroups?.length === 0 ? (
                <Box style={{ width: '100%', margin: 20 }}>
                    <Typography textAlign="center" variant="h6">
                        {noUnreservedDeviceGroupsTitle}
                    </Typography>
                </Box>
            ) : (
                <>
                    <Grid container className={classes.devicesWrapper} style={{ width: '100%' }}>
                        <TableComponent {...tableProps} />
                    </Grid>
                    <div className={classes.buttonsWrapper}>
                        <Button
                            disabled={disableReserveButton}
                            onClick={onReserveHandler}
                            color="primary"
                            variant="contained"
                        >
                            Reserve
                        </Button>
                    </div>
                </>
            )}
        </Paper>
    );
};
