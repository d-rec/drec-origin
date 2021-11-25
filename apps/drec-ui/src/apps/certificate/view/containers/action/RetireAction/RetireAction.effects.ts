import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTransactionPendingDispatch } from 'apps/certificate/view/context';
import { CertificateDTO } from '@energyweb/origin-drec-api-client';
import {
    useCachedMyDeviceGroups,
    useCachedAllFuelTypes,
    useCachedBlockchainCertificates,
    useRetireCertificateHandler
} from 'apps/certificate/data';
import { useBeneficiaryFormLogic, useRetireActionLogic } from 'apps/certificate/logic';
import { useMyOrganizationData } from 'apps/organization';
import { Dayjs } from 'dayjs';

export const useRetireActionEffects = (
    selectedIds: CertificateDTO['id'][],
    resetIds: () => void
) => {
    const blockchainCertificates = useCachedBlockchainCertificates();
    const allDeviceGroups = useCachedMyDeviceGroups();
    const allFuelTypes = useCachedAllFuelTypes();
    const setTxPending = useTransactionPendingDispatch();

    const { initialValues, fields, validationSchema } = useBeneficiaryFormLogic();

    const { register, control, watch, formState } = useForm({
        defaultValues: initialValues,
        mode: 'onChange',
        resolver: yupResolver(validationSchema)
    });
    const { isValid, isDirty, errors } = formState;

    const { startDate, endDate, purpose } = watch();

    const { organizationLoading, organization: selectedBeneficiary } = useMyOrganizationData();

    const { retireHandler, isLoading: isHandlerLoading } = useRetireCertificateHandler(
        selectedBeneficiary,
        resetIds,
        startDate as Dayjs,
        endDate as Dayjs,
        purpose,
        setTxPending
    );

    const actionLogic = useRetireActionLogic({
        selectedIds,
        blockchainCertificates,
        allDeviceGroups,
        allFuelTypes
    });

    const isLoading = organizationLoading || isHandlerLoading;
    const buttonDisabled = !isDirty || !isValid;

    return {
        ...actionLogic,
        retireHandler,
        isLoading,
        buttonDisabled,
        fields,
        register,
        control,
        errors
    };
};
