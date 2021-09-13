import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { useState } from 'react';

export const useMyDeviceCardsListEffects = (devices: DeviceDTO[]) => {
    const [selected, setSelected] = useState<DeviceDTO['id']>(null);

    const handleSelect = (id: DeviceDTO['id']) => {
        if (id === selected) {
            setSelected(null);
        } else {
            setSelected(id);
        }
    };

    const selectedDevice = devices.find((device) => device.id === selected);

    return { selected, handleSelect, selectedDevice };
};
