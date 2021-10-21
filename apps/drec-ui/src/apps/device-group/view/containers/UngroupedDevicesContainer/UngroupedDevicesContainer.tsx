import { GroupedDevicesDTO } from '@energyweb/origin-drec-api-client';
import { TableComponent } from '@energyweb/origin-ui-core';
import { Typography } from '@material-ui/core';
import { FC } from 'react';
import { useUngroupedDevicesContainerEffects } from './UngroupedDevicesContainer.effects';

interface UngroupedDevicesContainerProps {
    itemProps: React.HTMLAttributes<HTMLDivElement>;
    groupedDevices: GroupedDevicesDTO;
}

export const UngroupedDevicesContainer: FC<UngroupedDevicesContainerProps> = ({
    itemProps,
    groupedDevices
}) => {
    const { tableProps } = useUngroupedDevicesContainerEffects(groupedDevices);
    return (
        <div {...itemProps}>
            <Typography variant="h6">{groupedDevices.name}</Typography>
            <TableComponent {...tableProps} />
        </div>
    );
};
