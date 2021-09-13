import {
    CodeNameDTO,
    getDeviceControllerGetFuelTypesQueryKey
} from '@energyweb/origin-drec-api-client';
import { useQueryClient } from 'react-query';

export const useCachedAllFuelTypes = () => {
    const queryClient = useQueryClient();
    const fuelTypesQueryKey = getDeviceControllerGetFuelTypesQueryKey();

    return queryClient.getQueryData<CodeNameDTO[]>(fuelTypesQueryKey);
};
