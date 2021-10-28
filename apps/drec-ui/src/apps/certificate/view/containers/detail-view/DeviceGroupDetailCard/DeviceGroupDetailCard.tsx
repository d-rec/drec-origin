import { IconText, IconTextProps } from '@energyweb/origin-ui-core';
import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { Box, Button, Card } from '@material-ui/core';
import { FC } from 'react';
import { useDeviceGroupDetailCardEffects } from './DeviceGroupDetailCard.effects';
import { useStyles } from './DeviceGroupDetailCard.styles';

export interface DeviceGroupDetailCardProps {
    deviceGroupId: DeviceGroupDTO['id'];
    headingIconProps: IconTextProps;
}

export const DeviceGroupDetailCard: FC<DeviceGroupDetailCardProps> = ({
    deviceGroupId,
    headingIconProps
}) => {
    const { viewDeviceText, handleViewDeviceGroup } =
        useDeviceGroupDetailCardEffects(deviceGroupId);
    const classes = useStyles();

    return (
        <Card className={classes.card}>
            <Box py={1} px={2} className={classes.heading}>
                <IconText
                    gridContainerProps={{
                        direction: 'row-reverse',
                        justifyContent: 'space-between'
                    }}
                    iconProps={{ className: classes.icon }}
                    {...headingIconProps}
                />
            </Box>
            <Box width="50%" mx="auto" mt={2}>
                <Button
                    fullWidth
                    color="inherit"
                    onClick={handleViewDeviceGroup}
                    className={classes.button}
                >
                    {viewDeviceText}
                </Button>
            </Box>
        </Card>
    );
};
