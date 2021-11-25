import { GenericModal } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { useDeviceDetailsEffects } from './DeviceDetails.effects';
import { Divider, Typography, Box } from '@mui/material';

export const DeviceDetails: FC = () => {
    const { open, details, dialogProps, title, buttons } = useDeviceDetailsEffects();

    return (
        <GenericModal
            open={open}
            buttons={buttons}
            dialogProps={dialogProps}
            customContent={
                <>
                    <Typography component="span" variant="h5">
                        {title}
                    </Typography>
                    <Box display="flex" flexDirection="column" mt={3}>
                        {details ? (
                            <>
                                {details.labels ? (
                                    <>
                                        <Typography
                                            component={'span'}
                                            variant="h6"
                                            color="textSecondary"
                                        >
                                            Labels:
                                        </Typography>
                                        <Typography>{details.labels ?? ''}</Typography>
                                        <Divider sx={{ width: '100%', my: '10px' }} />
                                    </>
                                ) : null}
                                {details.impactStory ? (
                                    <>
                                        <Typography
                                            component={'span'}
                                            variant="h6"
                                            color="textSecondary"
                                        >
                                            Impact story:
                                        </Typography>
                                        <Typography>{details.impactStory ?? ''}</Typography>
                                    </>
                                ) : null}
                            </>
                        ) : null}
                    </Box>
                </>
            }
        />
    );
};
