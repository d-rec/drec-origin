import React from 'react';

import { HorizontalCard } from '@energyweb/origin-ui-core';
import { DeviceGroupDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

import { MyDeviceGroupCardHeader } from '../MyDeviceGroupCardHeader';
import { MyDeviceGroupCardContent } from '../MyDeviceGroupCardContent';

import { useMyDeviceGroupCardEffects } from './MyDeviceGroupCard.effects';
import { useStyles } from './MyDeviceGroupCard.styles';

export interface MyDeviceGroupCardProps {
    selected: boolean;
    onClick: () => void;
    deviceGroup: DeviceGroupDTO;
    allDeviceTypes: CodeNameDTO[];
}

export const MyDeviceGroupCard: React.FC<MyDeviceGroupCardProps> = ({
    deviceGroup,
    allDeviceTypes,
    selected,
    onClick
}) => {
    const { fallbackIcon, cardHeaderProps, cardContentProps } = useMyDeviceGroupCardEffects(
        deviceGroup,
        allDeviceTypes
    );
    const classes = useStyles();

    return (
        <HorizontalCard
            selected={selected}
            onClick={onClick}
            fallbackIcon={fallbackIcon}
            fallbackIconProps={{ className: classes.fallbackIcon }}
            fallbackIconWrapperProps={{ className: classes.fallbackIconWrapper }}
            header={<MyDeviceGroupCardHeader {...cardHeaderProps} />}
            content={
                <MyDeviceGroupCardContent deviceGroupId={deviceGroup.id} {...cardContentProps} />
            }
        />
    );
};
