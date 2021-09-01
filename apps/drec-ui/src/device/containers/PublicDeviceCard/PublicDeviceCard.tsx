import { CardWithImage } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { PublicDeviceCardContent } from '../PublicDeviceCardContent';
import { usePublicDeviceCardEffects } from './PublicDeviceCard.effects';
import { useStyles } from './PublicDeviceCard.styles';

export interface PublicDeviceCardProps {
    device: DeviceDTO;
    allDeviceTypes: CodeNameDTO[];
}

export const PublicDeviceCard: FC<PublicDeviceCardProps> = ({ device, allDeviceTypes }) => {
    const { specsData, iconsData, cardProps } = usePublicDeviceCardEffects({
        device,
        allDeviceTypes
    });

    const classes = useStyles();

    return (
        <CardWithImage
            {...cardProps}
            fallbackIconProps={{ className: classes.icon }}
            cardProps={{ className: classes.card }}
            overlayTextProps={{ className: classes.imageWrapper }}
            content={
                <PublicDeviceCardContent
                    id={device.id}
                    specsData={specsData}
                    iconsData={iconsData}
                />
            }
        />
    );
};
