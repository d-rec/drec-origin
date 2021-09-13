import { useDeviceControllerGetFuelTypes } from '@energyweb/origin-drec-api-client';

export const useAllDeviceFuelTypes = () => {
    const { data: allTypes, isLoading } = useDeviceControllerGetFuelTypes({
        staleTime: 1000000
    });

    return { allTypes, isLoading };
};
