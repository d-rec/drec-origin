import { FC } from 'react';
import { CircularProgress, Paper, Typography, Grid, Button, Box } from '@mui/material';
import { useStyles } from './ReservedPage.styles';
import { useReservedPageEffects } from './ReservedPage.effects';
import { GenericForm, TableComponent } from '@energyweb/origin-ui-core';
import DeleteIcon from '@mui/icons-material/Delete';

export const ReservedPage: FC = () => {
    const classes = useStyles();
    const {
        deviceGroups,
        tableProps,
        formData,
        isLoading,
        noReservedDeviceGroupsTitle,
        onUnreserveHandler,
        disableReserveButton
    } = useReservedPageEffects();

    if (isLoading) {
        return <CircularProgress />;
    }

    return (
        <Paper className={classes.paper}>
            <Typography variant="h5">Reserved Device Groups</Typography>
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
                        {noReservedDeviceGroupsTitle}
                    </Typography>
                </Box>
            ) : (
                <>
                    <Grid container className={classes.devicesWrapper} style={{ width: '100%' }}>
                        <TableComponent {...tableProps} />
                    </Grid>
                    <div className={classes.buttonsWrapper}>
                        <Button
                            startIcon={<DeleteIcon />}
                            disabled={disableReserveButton}
                            onClick={onUnreserveHandler}
                            color="primary"
                            variant="contained"
                        >
                            Unreserve
                        </Button>
                    </div>
                </>
            )}
        </Paper>
    );
};
