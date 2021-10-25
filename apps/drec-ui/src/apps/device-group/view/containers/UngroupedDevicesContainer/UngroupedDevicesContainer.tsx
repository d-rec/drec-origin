import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { TableComponent } from '@energyweb/origin-ui-core';
import { Button, Typography } from '@material-ui/core';
import { FC } from 'react';
import { useUngroupedDevicesContainerEffects } from './UngroupedDevicesContainer.effects';
import { useStyles } from './UngroupedDevicesContainer.styles';

export interface UngroupedDevicesContainerProps {
    itemProps: React.HTMLAttributes<HTMLDivElement>;
    groupedDevices: GroupedDevicesDTO;
    handleChecked: (id: UngroupedDeviceDTO['id'], checked: boolean) => void;
    handleCreateNewGroup: () => void;
}

export const UngroupedDevicesContainer: FC<UngroupedDevicesContainerProps> = ({
    itemProps,
    groupedDevices,
    handleChecked,
    handleCreateNewGroup
}) => {
    const classes = useStyles();
    const { tableProps, isDisabledCreateGroup } = useUngroupedDevicesContainerEffects(
        groupedDevices,
        handleChecked
    );
    return (
        <div {...itemProps}>
            <Typography variant="h6">{groupedDevices.name}</Typography>
            <TableComponent {...tableProps} />
            <div className={classes.buttonContainer}>
                <Button
                    disabled={isDisabledCreateGroup}
                    onClick={handleCreateNewGroup}
                    variant="contained"
                    color="primary"
                >
                    Create New Group
                </Button>
            </div>
        </div>
    );
};
