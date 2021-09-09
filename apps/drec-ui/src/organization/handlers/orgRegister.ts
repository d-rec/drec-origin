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
        const formattedValues: NewOrganizationDTO = {
            ...values,
            country: values.country[0].value as string,
            signatoryCountry: values.signatoryCountry[0].value as string
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
