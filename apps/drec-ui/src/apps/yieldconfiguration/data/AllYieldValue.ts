import { useYieldConfigControllerGetAll } from '@energyweb/origin-drec-api-client';

export const useAllYieldValue = () => {
    const { data: yieldvaluedata, isLoading: yieldLoading } = useYieldConfigControllerGetAll();

    return {
        yieldvaluedata,
        yieldLoading
    };
};
