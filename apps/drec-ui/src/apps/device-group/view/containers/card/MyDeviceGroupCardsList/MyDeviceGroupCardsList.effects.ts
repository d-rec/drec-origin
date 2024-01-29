import { DeviceGroupDTO } from '@energyweb/origin-drec-api-client';

export const useMyDeviceGroupCardsListEffects = (deviceGroups: DeviceGroupDTO[]) => {
    let selected: DeviceGroupDTO['id'] = null;
    const handleSelect = (id: DeviceGroupDTO['id']) => {
        selected = id;
    };
    const selectedDevice = deviceGroups.find((deviceGroup) => deviceGroup.id === selected);

    return { selected, handleSelect, selectedDevice };
};
