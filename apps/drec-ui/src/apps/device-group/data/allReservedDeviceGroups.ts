import {
    DeviceGroupControllerGetUnreservedParams,
    useDeviceGroupControllerGetReserved
} from '@energyweb/origin-drec-api-client';
import { UnreservedFormFormValues } from '../logic';
import cleanDeep from 'clean-deep';

export const useReservedDeviceGroups = (values: UnreservedFormFormValues) => {
    const params = formatFormValuesToFilterParams(values);
    const { data: deviceGroups, isLoading } = useDeviceGroupControllerGetReserved(params);
    return { deviceGroups, isLoading };
};

const formatFormValuesToFilterParams = (values: UnreservedFormFormValues) => {
    return cleanDeep({
        ...values,
        country: values.country && values.country.length ? values.country[0].value : null,
        fuelCode: values.fuelCode && values.fuelCode.length ? values.fuelCode[0].value : null,
        gridInterconnection: values.gridInterconnection
            ? values.gridInterconnection === 'No'
                ? false
                : true
            : null
    } as DeviceGroupControllerGetUnreservedParams);
};
