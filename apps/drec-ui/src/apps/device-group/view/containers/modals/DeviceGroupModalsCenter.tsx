import { FC } from 'react';
import { AutoGroupSelected } from './AutoGroupSelected';
import { CreateNewGroup } from './CreateNewGroup';
import { DeleteDeviceGroup } from './DeleteDeviceGroup';

export const DeviceGroupModalsCenter: FC = () => {
    return (
        <>
            <DeleteDeviceGroup />
            <CreateNewGroup />
            <AutoGroupSelected />
        </>
    );
};
