import { DeviceDTO } from '@energyweb/origin-drec-api-client';
import { MapItem } from '@energyweb/origin-ui-core';

export const useDeviceMapEffects = (devices: DeviceDTO[]) => {
    const allItems: MapItem[] = devices.map((device: DeviceDTO, index: number) => {
        return {
            id: device.id.toString(),
            latitude: device.latitude,
            longitude: device.longitude,
            label: (index + 1).toString(),
            externalId: device.externalId,
            projectName: device.projectName,
            status: device.status,
            capacity: device.capacity
        };
    });
    return { allItems };
};
