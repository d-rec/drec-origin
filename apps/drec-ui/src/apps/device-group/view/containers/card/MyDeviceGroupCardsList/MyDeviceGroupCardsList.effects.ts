import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { useState } from 'react';

export const useMyDeviceGroupCardsListEffects = (deviceGroups: DeviceGroupDTO[]) => {
    const [selected, setSelected] = useState<DeviceGroupDTO['id']>(null);

    const handleSelect = (id: DeviceGroupDTO['id']) => {
        if (id === selected) {
            setSelected(null);
        } else {
            setSelected(id);
        }
    };

    const selectedDevice = deviceGroups.find((deviceGroup) => deviceGroup.id === selected);

    return { selected, handleSelect, selectedDevice };
};
