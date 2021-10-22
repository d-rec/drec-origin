import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { FormSelectOption, SelectAutocompleteField } from '@energyweb/origin-ui-core';
import { useEffect, useState } from 'react';
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
    const [selectedDevicesList, setSelectedDevicesList] = useState(groupedDevicesList);

    const handleChange = (options: FormSelectOption[]) => {
        setEnableFetch(false);
        setOrderItems(
            options.map((orderItem: FormSelectOption) => orderItem.value as DeviceOrderBy)
        );
    };

    useEffect(() => {
        setSelectedDevicesList(selectedDevicesList);
    }, [groupedDevicesList]);

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

    const handleChecked = (id: UngroupedDeviceDTO['id'], checked: boolean) => {
        const selectedGroupedDevicesList = groupedDevicesList.map(
            (groupedDeviceList: GroupedDevicesDTO) => {
                const updatedProjectIndex = groupedDeviceList.devices.findIndex(
                    (selectableDevice) => selectableDevice.id === id
                );
                if (updatedProjectIndex !== -1) {
                    groupedDeviceList.devices[updatedProjectIndex].selected = checked;
                }
                return groupedDeviceList;
            }
        );
        setSelectedDevicesList(selectedGroupedDevicesList);
    };

    const onAutoGroupSelected = () => {
        console.log('Auto Group selected: ', selectedDevicesList);
    };

    return {
        field,
        orderItems,
        handleChange,
        handleChecked,
        onGroupSelected,
        onAutoGroupSelected,
        groupedDevicesList,
        isLoading
    };
};
