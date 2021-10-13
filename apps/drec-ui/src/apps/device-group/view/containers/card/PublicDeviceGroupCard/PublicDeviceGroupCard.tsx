import { CardWithImage } from '@energyweb/origin-ui-core';
import { FC } from 'react';
import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';
import { PublicDeviceGroupCardContent } from '../PublicDeviceGroupCardContent';
import { usePublicDeviceGroupCardEffects } from './PublicDeviceGroupCard.effects';
import { useStyles } from './PublicDeviceCard.styles';

export interface PublicDeviceGroupCardProps {
    deviceGroup: DeviceGroupDTO;
    allDeviceTypes: CodeNameDTO[];
}

export const PublicDeviceGroupCard: FC<PublicDeviceGroupCardProps> = ({
    deviceGroup,
    allDeviceTypes
}) => {
    const { specsData, iconsData, cardProps } = usePublicDeviceGroupCardEffects({
        deviceGroup,
        allDeviceTypes
    });

    const classes = useStyles();

    return (
        <CardWithImage
            {...cardProps}
            fallbackIconProps={{ className: classes.icon }}
            cardProps={{ className: classes.card }}
            overlayTextProps={{ className: classes.overlayText }}
            content={
                <PublicDeviceGroupCardContent
                    id={deviceGroup.id}
                    specsData={specsData}
                    iconsData={iconsData}
                />
            }
        />
    );
};
