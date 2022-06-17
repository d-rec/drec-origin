import * as Yup from 'yup';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import { useApiRegisterUser } from 'apps/user/data';
import { UserModalsActionsEnum, useUserModalsDispatch } from '../../context';
import { ORGTYPE_OPTIONS } from '../../../../../utils';

export type TUserSignInFormValues = {
  
    firstName: string;
    lastName: string;
  
    email: string;
    password: string;
    Cinfirmpassword:string;
    orgtype:string,
    orgname:string,
    secretKey:string
};

const INITIAL_FORM_VALUES: TUserSignInFormValues = {
 
    firstName: '',
    lastName: '',  
    email: '',
    password: '',
    Cinfirmpassword:'',
    orgtype:'',
    orgname:'',
    secretKey:'',
};

export const useRegisterPageEffects = () => {
    const dispatchModals = useUserModalsDispatch();

    const openUserRegisteredModal = () =>
        dispatchModals({
            type: UserModalsActionsEnum.SHOW_USER_REGISTERED,
            payload: true
        });

    const { submitHandler } = useApiRegisterUser(openUserRegisteredModal);
    const formConfig = useUserSignInFormConfig(submitHandler);

    return { formConfig };
};

export const useUserSignInFormConfig = (
    formSubmitHandler: GenericFormProps<TUserSignInFormValues>['submitHandler']
): GenericFormProps<TUserSignInFormValues> => {
    return {
        buttonText: 'Register',
        fields: [
           
            {
                label: 'First Name',
                name: 'firstName',
                required: true
            },
            {
                label: 'Last Name',
                name: 'lastName',
                required: true
            },
            {
                label: 'Email',
                name: 'email',
                required: true
            },
           
            {
                type: 'password',
                label: 'Password',
                name: 'password',
                required: true
            },
            {
                type: 'password',
                label: 'Cinfirm Password',
                name: 'Cinfirmpassword',
                required: true
            },
            {
                label: 'Organization Type',
                name: 'orgtype',
                select: true,
                options: ORGTYPE_OPTIONS,
                additionalInputProps: {
                    valueToOpen: 'Other',
                    name: 'titleInput',
                    label: 'Type',
                    required: true
                }
            },
            {
                label: 'Organization Name',
                name: 'orgname',
               
            },
            {
                // type: 'password',
                label: 'Secret Key',
                name: 'secretKey',
               
            },

        ],
        twoColumns: true,
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        submitHandler: formSubmitHandler,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            
            firstName: Yup.string().label('First Name').required(),
            lastName: Yup.string().label('Last Name').required(),
            email: Yup.string().email().label('Email').required(),
            password: Yup.string().min(6).label('Password').required(),
            Cinfirmpassword: Yup.string()
            .oneOf(
                [Yup.ref('password'), null],
                `Confirmed password doesn't match with new password`
            )
            .label('Confirm Password')
            .required(),
            orgtype: Yup.string().label('Organization Type'),
            orgname: Yup.string().label('Organization Name'),

            secretKey: Yup.string().max(6).label('Secret Key'),
        })
    };
};
