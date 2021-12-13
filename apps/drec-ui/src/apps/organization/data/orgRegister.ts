import {
    getUserControllerMeQueryKey,
    NewOrganizationDTO,
    useOrganizationControllerRegister
} from '@energyweb/origin-drec-api-client';
import {
    FormSelectOption,
    NotificationTypeEnum,
    showNotification
} from '@energyweb/origin-ui-core';
import { useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import cleanDeep from 'clean-deep';

interface IUseOrganizationRegisterHandlerProps {
    openRoleChangedModal: () => void;
    openAlreadyExistsModal: () => void;
}

type OrgRegisterFormValues = Omit<NewOrganizationDTO, 'country' | 'signatoryCountry'> & {
    country: FormSelectOption[];
    signatoryCountry: FormSelectOption[];
};

export const useOrganizationRegisterHandler = ({
    openRoleChangedModal,
    openAlreadyExistsModal
}: IUseOrganizationRegisterHandlerProps) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate } = useOrganizationControllerRegister();
    const userKey = getUserControllerMeQueryKey();

    const registerHandler = (values: OrgRegisterFormValues) => {
        const signatoryInformation = cleanDeep({
            signatoryFullName: values.signatoryFullName,
            signatoryAddress: values.signatoryAddress,
            signatoryZipCode: values.signatoryZipCode,
            signatoryCity: values.signatoryCity,
            signatoryCountry:
                (values.signatoryCountry[0]?.value as string) ||
                (values.country[0].value as string),
            signatoryEmail: values.signatoryEmail,
            signatoryPhoneNumber: values.signatoryPhoneNumber
        });
        const formattedValues: NewOrganizationDTO = {
            name: values.name,
            address: values.address,
            zipCode: values.zipCode,
            city: values.city,
            country: values.country[0].value as string,
            businessType: values.businessType,
            tradeRegistryCompanyNumber: values.tradeRegistryCompanyNumber,
            vatNumber: values.vatNumber,
            ...signatoryInformation
        };
        mutate(
            { data: formattedValues },
            {
                onSuccess: () => {
                    navigate('/organization/my');
                    showNotification('Organization registered.', NotificationTypeEnum.Success);
                    queryClient.invalidateQueries(userKey);
                    openRoleChangedModal();
                },
                onError: (error: any) => {
                    if (error?.response?.status === 400) {
                        openAlreadyExistsModal();
                        showNotification(
                            error?.response?.data?.message,
                            NotificationTypeEnum.Error
                        );
                    } else {
                        showNotification(
                            `Organization could not be created.:
              ${error?.response?.data?.message || ''}
              `,
                            NotificationTypeEnum.Error
                        );
                    }
                }
            }
        );
    };

    return registerHandler;
};
