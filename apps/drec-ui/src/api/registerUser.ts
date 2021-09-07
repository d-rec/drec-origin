import { useUserControllerRegister, CreateUserDTO } from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

type TRegisterUserFormValues = {
    title: string;
    titleInput?: string;
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
};

export const useApiRegisterUser = (showRegisteredModal: () => void) => {
    const { mutate, status, isLoading, isSuccess, isError, error } = useUserControllerRegister();

    const submitHandler = (values: TRegisterUserFormValues) => {
        const data: CreateUserDTO = {
            title: values.title === 'Other' ? values.titleInput : values.title,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            telephone: values.telephone,
            password: values.password
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    showNotification('User registered', NotificationTypeEnum.Success);
                    showRegisteredModal();
                },
                onError: () => {
                    showNotification('Error while registering user', NotificationTypeEnum.Error);
                }
            }
        );
    };

    return {
        status,
        isLoading,
        isSuccess,
        isError,
        error,
        submitHandler
    };
};
