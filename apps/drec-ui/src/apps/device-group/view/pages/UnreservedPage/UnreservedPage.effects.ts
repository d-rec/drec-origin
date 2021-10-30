import { DeviceGroupModalsActionsEnum, useDeviceGroupModalsDispatch } from '../../context';
import {
    UnreservedFormFormValues,
    useUnreservedDeviceGroupsTableLogic,
    useUnreservedFilterFormLogic
} from '../../../logic';
import { useMediaQuery, useTheme } from '@material-ui/core';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useAllDeviceFuelTypes, useUnreservedDeviceGroups } from '../../../data';
import { useEffect, useState } from 'react';
import { UnreservedDeviceGroupDTO } from '@energyweb/origin-drec-api-client';
import { UseFormReset } from 'react-hook-form';
import cleanDeep from 'clean-deep';

export const useUnreservedPageEffects = () => {
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
    const [filterUnreserved, setFilterUnreserved] = useState(initialFormValues);
    const { deviceGroups, isLoading: IsLoadingDeviceGroups } =
        useUnreservedDeviceGroups(filterUnreserved);
    const [selectedDeviceGroupList, setSelectedDeviceGroupList] = useState(deviceGroups);
    const dispatchModals = useDeviceGroupModalsDispatch();

    const { allTypes, isLoading: isDeviceTypesLoading } = useAllDeviceFuelTypes();

    const onResetHandler = () => {
        setFilterUnreserved(initialFormValues);
    };

    const { fields, initialValues, validationSchema, buttonText } = useUnreservedFilterFormLogic(
        filterUnreserved,
        allTypes
    );

    const theme = useTheme();
    const mobileView = useMediaQuery(theme.breakpoints.down('sm'));

    const handleChecked = (id: UnreservedDeviceGroupDTO['id'], checked: boolean) => {
        const groupIndex = deviceGroups.findIndex((selectable) => selectable.id === id);
        const updatedDeviceGroups = [...deviceGroups];
        if (groupIndex !== -1) {
            updatedDeviceGroups[groupIndex].selected = checked;
        }
        setSelectedDeviceGroupList(updatedDeviceGroups);
    };

    const tableProps = useUnreservedDeviceGroupsTableLogic(
        deviceGroups,
        handleChecked,
        IsLoadingDeviceGroups,
        allTypes
    );

    useEffect(() => {
        setSelectedDeviceGroupList(deviceGroups);
    }, [deviceGroups]);

    const submitHandler = (
        values: UnreservedFormFormValues,
        reset: UseFormReset<UnreservedFormFormValues>
    ) => {
        setFilterUnreserved(values);
    };
    const isLoading = IsLoadingDeviceGroups || isDeviceTypesLoading;
    const formData: GenericFormProps<UnreservedFormFormValues> = {
        fields,
        initialValues,
        validationSchema,
        buttonText,
        submitHandler
    };

    const onReserveHandler = () => {
        const autoSelected: UnreservedDeviceGroupDTO[] = selectedDeviceGroupList.filter(
            (group: UnreservedDeviceGroupDTO) => group.selected === true
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
            (group: UnreservedDeviceGroupDTO) => group.selected === true
        ).length === 0;

    return {
        deviceGroups,
        tableProps,
        formData,
        mobileView,
        isLoading,
        noUnreservedDeviceGroupsTitle,
        onReserveHandler,
        onResetHandler,
        disableReserveButton
    };
};
