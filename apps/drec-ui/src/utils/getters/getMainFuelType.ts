import { DeviceDTO, CodeNameDTO } from '@energyweb/origin-drec-api-client';

export const getMainFuelType = (fuelType: string, allTypes: CodeNameDTO[]) => {
    if (!fuelType || !allTypes) {
        return { mainType: '', restType: '' };
    }
    try {
        if(allTypes.find((type) => type.code === fuelType))
        {
        const decodedType = allTypes.find((type) => type.code === fuelType).name;
        const splitValue = decodedType.split(':');

        const mainType = splitValue[0];
        const restType = splitValue.length > 1 ? splitValue.slice(1).join() : '';
        return { mainType: '', restType: '' };
        }
        else
        {
            return { mainType: '', restType: '' };
        }
    } catch (error) {
        console.log(error);
        throw new Error(
            `Provided device fuel type does not match with any known type. Received: ${fuelType}`
        );
    }
};

export const getDeviceDetailedFuelType = (device: DeviceDTO) => {
    if (!device) {
        return;
    }
    const arr = device.deviceTypeCode.split(';');
    arr.shift();
    return arr.length > 1 ? arr.join(' - ') : arr[0];
};
