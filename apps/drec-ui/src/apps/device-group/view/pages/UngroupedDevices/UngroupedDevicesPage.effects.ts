import { FormSelectOption, SelectAutocompleteField } from '@energyweb/origin-ui-core';
import { useState } from 'react';
import { DeviceOrderBy, prepareGroupByOptions } from '../../../../../utils';
import { useUngroupedDevices } from '../../../data';

export const useUngrouppedDevicesPageEffects = () => {
    const [orderItems, setOrderItems] = useState([
        DeviceOrderBy.Country,
        DeviceOrderBy.FuelCode,
        DeviceOrderBy.StandardCompliance
    ]);
    const [enableFetch, setEnableFetch] = useState(true);
    const { groupedDevicesList, isLoading } = useUngroupedDevices(orderItems, enableFetch);

    const handleChange = (options: FormSelectOption[]) => {
        setEnableFetch(false);
        setOrderItems(
            options.map((orderItem: FormSelectOption) => orderItem.value as DeviceOrderBy)
        );
    };
    const field: SelectAutocompleteField<any> = {
        name: 'groupBy',
        label: 'Group Devices By',
        required: true,
        options: prepareGroupByOptions(),
        multiple: true
    };

    const onGroupSelected = () => {
        setEnableFetch(true);
    };

    const onAutoGroupSelected = () => {
        console.log('Auto Group selected');
    };

    return {
        field,
        orderItems,
        handleChange,
        onGroupSelected,
        onAutoGroupSelected,
        groupedDevicesList,
        isLoading
    };
};
