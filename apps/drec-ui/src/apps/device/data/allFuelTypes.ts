import { useDeviceControllerGetFuelTypes } from '@energyweb/origin-drec-api-client';

export const useAllDeviceFuelTypes = () => {
    const { data: allTypes, isLoading } = useDeviceControllerGetFuelTypes({
        query: {
            staleTime: 1000000
        }
    });

    return { allTypes, isLoading };
};
