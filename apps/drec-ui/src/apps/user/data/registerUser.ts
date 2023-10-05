import { useUserControllerRegister, CreateUserDTO,useUserControllerNewregister,CreateUserORGDTO } from '@energyweb/origin-drec-api-client';
import { NotificationTypeEnum, showNotification } from '@energyweb/origin-ui-core';

type TRegisterUserFormValues = {
  
    // titleInput?: string;
    // firstName: string;
    // lastName: string;
    // email: string;   
    // password: string;
    firstName: string;
  lastName: string;
  email: string;
  organizationType: string;
  password: string;
  confirmPassword: string;
  orgName: string;
  orgAddress: string;
  secretKey: string;
};

export const useApiRegisterUser = (showRegisteredModal: () => void) => {
    const { mutate, status, isLoading, isSuccess, isError, error } = useUserControllerNewregister();//useUserControllerRegister();

    const submitHandler = (values: TRegisterUserFormValues) => {
        // const data: CreateUserDTO = {
          
        //     firstName: values.firstName,
        //     lastName: values.lastName,
        //     email: values.email,
           
        //     password: values.password
        // };
        console.log("values from form",values);
        const data: CreateUserORGDTO = {       
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            organizationType: values.organizationType,
            confirmPassword: values.confirmPassword,
            orgName: values.orgName,
            orgAddress: values.orgAddress,
            secretKey: values.secretKey
        };
        mutate(
            { data },
            {
                onSuccess: () => {
                    showNotification('User registered', NotificationTypeEnum.Success);
                    showRegisteredModal();
                },
                onError: (error:any) => {
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
