import {useYieldConfigControllerCreate,NewYieldConfigDTO} from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

type TRegisterUserFormValues = {
    countryName: string,
    countryCode: string,
    yieldValue: 0,
    status: "Y"
};

export const useApiAddYieldValue = (showYieldvalueModal: () => void) => {
    const { mutate, status, isLoading, isSuccess, isError, error } = useYieldConfigControllerCreate();

    const submitHandler = (values: TRegisterUserFormValues) => {
        const data: NewYieldConfigDTO = {
          
            countryName: values.countryName,
            countryCode: values.countryCode,
            yieldValue: values.yieldValue,
           
            status: values.status
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    showNotification('User registered', NotificationTypeEnum.Success);
                    showYieldvalueModal();
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
