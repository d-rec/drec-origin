import { DeviceGroupModalsActionsEnum, useDeviceGroupModalsDispatch } from '../../context';
import {
    UnreservedFormFormValues,
    useSelectableDeviceGroupsTableLogic,
    useDeviceGroupsFilterFormLogic
} from '../../../logic';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useAllDeviceFuelTypes, useUnreservedDeviceGroups } from '../../../data';
import { useEffect, useState } from 'react';
import { SelectableDeviceGroupDTO } from '@energyweb/origin-drec-api-client';

const initialFormValues: UnreservedFormFormValues = {
    country: [],
    fuelCode: [],
    installationConfiguration: '',
    offTaker: '',
    sector: '',
    standardCompliance: '',
    gridInterconnection: '',
    commissioningDateRange: '',
    capacityRange: ''
};

export const useUnreservedPageEffects = () => {
    const [filterUnreserved, setFilterUnreserved] = useState(initialFormValues);
    const { deviceGroups, isLoading: IsDeviceGroupsMutating } =
        useUnreservedDeviceGroups(filterUnreserved);
    const [selectedDeviceGroupList, setSelectedDeviceGroupList] = useState(deviceGroups);
    const dispatchModals = useDeviceGroupModalsDispatch();

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();

    const formLogic = useDeviceGroupsFilterFormLogic(
        filterUnreserved,
        allTypes,
        IsDeviceGroupsMutating
    );

    const handleChecked = (id: SelectableDeviceGroupDTO['id'], checked: boolean) => {
        const groupIndex = deviceGroups.findIndex((selectable) => selectable.id === id);
        const updatedDeviceGroups = [...deviceGroups];
        if (groupIndex !== -1) {
            updatedDeviceGroups[groupIndex].selected = checked;
        }
        setSelectedDeviceGroupList(updatedDeviceGroups);
    };

    const tableProps = useSelectableDeviceGroupsTableLogic(
        deviceGroups,
        handleChecked,
        IsDeviceGroupsMutating,
        allTypes
    );

    useEffect(() => {
        setSelectedDeviceGroupList(deviceGroups);
    }, [deviceGroups]);

    const submitHandler = (values: UnreservedFormFormValues) => {
        setFilterUnreserved(values);
    };
    const isLoading = isDeviceTypesLoading;
    const formData: GenericFormProps<UnreservedFormFormValues> = {
        ...formLogic,
        submitHandler
    };

    const onReserveHandler = () => {
        const autoSelected: SelectableDeviceGroupDTO[] = selectedDeviceGroupList.filter(
            (group: SelectableDeviceGroupDTO) => group.selected === true
        );
        dispatchModals({
            type: DeviceGroupModalsActionsEnum.RESERVE,
            payload: {
                open: true,
                selected: autoSelected
            }
        });
    };

    const noUnreservedDeviceGroupsTitle =
        'Currently there aren`t any unreserved device groups for the selection criteria';

    const disableReserveButton =
        selectedDeviceGroupList?.filter(
            (group: SelectableDeviceGroupDTO) => group.selected === true
        ).length === 0;

    return {
        deviceGroups,
        tableProps,
        formData,
        isLoading,
        noUnreservedDeviceGroupsTitle,
        onReserveHandler,
        disableReserveButton
    };
};
