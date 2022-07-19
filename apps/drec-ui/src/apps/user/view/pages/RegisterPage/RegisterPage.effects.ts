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
    confirmPassword:string;
    organizationType:string,
    orgName:string,
    secretKey:string
};

const INITIAL_FORM_VALUES: TUserSignInFormValues = {
 
    firstName: '',
    lastName: '',  
    email: '',
    password: '',
    confirmPassword:'',
    organizationType:'',
    orgName:'',
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
    //@ts-ignore
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
                label: 'Confirm Password',
                name: 'confirmPassword',
                required: true
            },
            {
                label: 'Organization Type',
                name: 'organizationType',
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
                name: 'orgName',      
            },
            {
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
            confirmPassword: Yup.string()
            .oneOf(
                [Yup.ref('password'), null],
                `Confirmed password doesn't match with new password`
            )
            .label('Confirm Password')
            .required(),
            organizationType: Yup.string().label('Organization Type'),
            orgName: Yup.string().label('Organization Name'),

            secretKey: Yup.string().max(6).label('Secret Key').matches(/^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{6}$/,{message:"Ex: A34233 , DS2DGF, 33113F 1. Should be of 6 characters length 2. Minimum one upper case(A-Z) and minimum one digit(0-9), and combination should include only A-Z upper case and 0-9 numbers. ",excludeEmptyString:true}),
        })
    };
};
