import { FC } from 'react';
import { AutoGroupSelected } from './AutoGroupSelected';
import { CreateNewGroup } from './CreateNewGroup';
import { DeleteDeviceGroup } from './DeleteDeviceGroup';
import { ReserveSelected } from './ReserveSelected';

export const DeviceGroupModalsCenter: FC = () => {
    return (
        <>
            <DeleteDeviceGroup />
            <CreateNewGroup />
            <AutoGroupSelected />
            <ReserveSelected />
        </>
    );
};
