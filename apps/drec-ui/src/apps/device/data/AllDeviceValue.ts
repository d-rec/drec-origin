import { useDeviceControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useAllDevice = () => {
    const { data: devicedata, isLoading: deviceLoading } = useDeviceControllerGetAll();

    return {
        devicedata,
        deviceLoading
    };
};
