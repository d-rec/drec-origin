import { useApiRegisterUser } from '../../../api';
import { UserModalsActionsEnum, useUserModalsDispatch } from '../../context';
import * as Yup from 'yup';
import { GenericFormProps } from '@energyweb/origin-ui-core';

export type TUserSignInFormValues = {
    title: string;
    firstName: string;
    lastName: string;
    telephone: string;
    email: string;
    password: string;
};

const INITIAL_FORM_VALUES: TUserSignInFormValues = {
    title: '',
    firstName: '',
    lastName: '',
    telephone: '',
    email: '',
    password: ''
};

const TITLES = ['Dr', 'Mr', 'Mrs', 'Ms', 'Other'];

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
    const TITLE_OPTIONS = TITLES.map((title) => ({
        label: title,
        value: title
    }));
    return {
        buttonText: 'Register',
        fields: [
            {
                label: 'Title',
                name: 'title',
                select: true,
                options: TITLE_OPTIONS,
                required: true,
                additionalInputProps: {
                    valueToOpen: 'Other',
                    name: 'titleInput',
                    label: 'Title',
                    required: true
                }
            },
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
                label: 'Telephone',
                name: 'telephone',
                required: true
            },
            {
                type: 'password',
                label: 'Password',
                name: 'password',
                required: true
            }
        ],
        twoColumns: true,
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: INITIAL_FORM_VALUES,
        submitHandler: formSubmitHandler,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            title: Yup.string().label('Title').required(),
            firstName: Yup.string().label('First Name').required(),
            lastName: Yup.string().label('Last Name').required(),
            email: Yup.string().email().label('Email').required(),
            telephone: Yup.string().min(10).label('Telephone').required(),
            password: Yup.string().min(6).label('Password').required()
        })
    };
};
