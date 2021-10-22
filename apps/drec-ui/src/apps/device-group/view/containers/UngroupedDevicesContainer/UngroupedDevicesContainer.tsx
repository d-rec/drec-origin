import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableComponent } from '@energyweb/origin-ui-core';
import { Typography } from '@material-ui/core';
import { FC } from 'react';
import { useUngroupedDevicesContainerEffects } from './UngroupedDevicesContainer.effects';

export interface UngroupedDevicesContainerProps {
    itemProps: React.HTMLAttributes<HTMLDivElement>;
    groupedDevices: GroupedDevicesDTO;
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void;
}

export const UngroupedDevicesContainer: FC<UngroupedDevicesContainerProps> = ({
    itemProps,
    groupedDevices,
    handleChecked
}) => {
    const { tableProps } = useUngroupedDevicesContainerEffects(groupedDevices, handleChecked);
    return (
        <div {...itemProps}>
            <Typography variant="h6">{groupedDevices.name}</Typography>
            <TableComponent {...tableProps} />
        </div>
    );
};
