import { useApiAllDevices } from '../../../api';
import { useDeviceAppEnv } from '../../context';

export const useMapViewPageEffects = () => {
    const { allDevices, isLoading } = useApiAllDevices();
    const { googleMapsApiKey } = useDeviceAppEnv();

    return { allDevices, isLoading, googleMapsApiKey };
};
