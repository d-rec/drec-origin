import { GroupedDevicesDTO, UngroupedDeviceDTO } from '@energyweb/origin-drec-api-client';
import { FormSelectOption, SelectAutocompleteField } from '@energyweb/origin-ui-core';
import { useEffect, useState } from 'react';
import { DeviceOrderBy, prepareGroupByOptions } from '../../../../../utils';
import { useUngroupedDevices } from '../../../data';
import { DeviceGroupModalsActionsEnum, useDeviceGroupModalsDispatch } from '../../context';

const baseFilters = [
    DeviceOrderBy.Country,
    DeviceOrderBy.FuelCode,
    DeviceOrderBy.StandardCompliance
];

export const useUngrouppedDevicesPageEffects = () => {
    const [orderItems, setOrderItems] = useState(baseFilters);
    const [enableFetch, setEnableFetch] = useState(true);
    const { groupedDevicesList, isLoading } = useUngroupedDevices(orderItems, enableFetch);
    const [selectedDevicesList, setSelectedDevicesList] = useState(groupedDevicesList);
    const dispatchModals = useDeviceGroupModalsDispatch();

    const handleChange = (options: FormSelectOption[]) => {
        setEnableFetch(false);

        const filteredFromBaseOptions = options
            .map((option) => option.value as DeviceOrderBy)
            .filter((item: DeviceOrderBy) => !baseFilters.includes(item));
        setOrderItems([...baseFilters, ...filteredFromBaseOptions]);
    };

    useEffect(() => {
        setSelectedDevicesList(groupedDevicesList);
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
        const selectedGroupedDevicesList = groupedDevicesList?.map(
            (groupedDeviceList: GroupedDevicesDTO) => {
                const groupIndex = groupedDeviceList.devices.findIndex(
                    (selectableDevice) => selectableDevice.id === id
                );
                if (groupIndex !== -1) {
                    groupedDeviceList.devices[groupIndex].selected = checked;
                }
                return groupedDeviceList;
            }
        );
        setSelectedDevicesList(selectedGroupedDevicesList);
    };

    const onAutoGroupSelected = () => {
        const autoSelected: GroupedDevicesDTO[] = selectedDevicesList
            ?.map((selectedGroup: GroupedDevicesDTO) => {
                const selectedDevices = selectedGroup?.devices?.filter(
                    (device: UngroupedDeviceDTO) => device.selected === true
                );
                return selectedDevices.length
                    ? {
                          ...selectedGroup,
                          devices: selectedDevices
                      }
                    : null;
            })
            .filter((selectedGroup: GroupedDevicesDTO) => selectedGroup !== null);
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.AUTO_GROUP_SELECTED,
            payload: {
                open: true,
                selected: autoSelected,
                groupRules: orderItems
            }
        });
    };

    const handleCreateNewGroup = (groupedDevices: GroupedDevicesDTO) => {
        const selectedGroupedDevies: GroupedDevicesDTO = {
            name: groupedDevices.name,
            devices: groupedDevices.devices?.filter(
                (device: UngroupedDeviceDTO) => device.selected === true
            )
        };
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.CREATE_NEW_GROUP,
            payload: {
                open: true,
                group: selectedGroupedDevies
            }
        });
    };

    const noUngroupedDevicesTitle = 'Currently there aren`t any ungrouped devices';

    return {
        field,
        orderItems,
        handleChange,
        handleChecked,
        onGroupSelected,
        onAutoGroupSelected,
        groupedDevicesList,
        isLoading,
        handleCreateNewGroup,
        noUngroupedDevicesTitle
    };
};
