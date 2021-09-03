import React from 'react';

import { HorizontalCard } from '@energyweb/origin-ui-core';
import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

import { MyDeviceCardHeader } from '../MyDeviceCardHeader';
import { MyDeviceCardContent } from '../MyDeviceCardContent';

import { useMyDeviceCardEffects } from './MyDeviceCard.effects';
import { useStyles } from './MyDeviceCard.styles';

export interface MyDeviceCardProps {
    selected: boolean;
    onClick: () => void;
    device: DeviceDTO;
    allDeviceTypes: CodeNameDTO[];
}

export const MyDeviceCard: React.FC<MyDeviceCardProps> = ({
    device,
    allDeviceTypes,
    selected,
    onClick
}) => {
    const { imageUrl, fallbackIcon, cardHeaderProps, cardContentProps } = useMyDeviceCardEffects(
        device,
        allDeviceTypes
    );
    const classes = useStyles();

    return (
        <HorizontalCard
            selected={selected}
            onClick={onClick}
            imageUrl={imageUrl}
            fallbackIcon={fallbackIcon}
            fallbackIconProps={{ className: classes.fallbackIcon }}
            fallbackIconWrapperProps={{ className: classes.fallbackIconWrapper }}
            header={<MyDeviceCardHeader {...cardHeaderProps} />}
            content={<MyDeviceCardContent deviceId={device.id} {...cardContentProps} />}
        />
    );
};
