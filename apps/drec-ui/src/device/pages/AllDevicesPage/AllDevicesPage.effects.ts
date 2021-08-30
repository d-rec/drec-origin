import { useApiAllDevices } from '../../../api';

export const useAllDevicesPageEffects = () => {
    const { allDevices, isLoading: isAllDevicesLoading } = useApiAllDevices();

    const isLoading = isAllDevicesLoading;

    return { allDevices, isLoading };
};
