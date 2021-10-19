import React, { FC } from 'react';
import { BlockTintedBottom, GenericMap } from '@energyweb/origin-ui-core';
import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { Typography } from '@material-ui/core';
import { useDeviceGroupAppEnv } from '../../../context';
import { useStyles } from './DevicesMap.styles';
import { ItemHighlightedContent } from '../ItemHighlightedContent';

interface DevicesMapProps {
    deviceGroupName: string;
    devices: DeviceDTO[];
    itemProps: React.HTMLAttributes<HTMLDivElement>;
}

export const DevicesMap: FC<DevicesMapProps> = ({ deviceGroupName, devices, itemProps }) => {
    const classes = useStyles();
    const { googleMapsApiKey } = useDeviceGroupAppEnv();
    return (
        <BlockTintedBottom height={30}>
            <div {...itemProps}>
                <GenericMap
                    apiKey={googleMapsApiKey}
                    allItems={devices}
                    containerClassName={classes.mapContainer}
                    mapProps={{
                        options: {
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: true
                        }
                    }}
                    infoWindowContent={ItemHighlightedContent}
                />
                <Typography className={classes.deviceGroupName}>{deviceGroupName}</Typography>
            </div>
        </BlockTintedBottom>
    );
};
