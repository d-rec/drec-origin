import { UserDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import * as Yup from 'yup';
import { TITLE_OPTIONS } from '../../../../utils';
import { USER_STATUS_OPTIONS } from './statusOptions';

export type TAdminUpdateUserFormValues = {
    title: UserDTO['title'];
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    email: UserDTO['email'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
};

export const useAdminUpdateUserFormLogic = (
    user: UserDTO
): Omit<GenericFormProps<TAdminUpdateUserFormValues>, 'submitHandler'> => {
    const initialFormData = {
        title: user?.title || '',
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        telephone: user?.telephone || '',
        status: user?.status
    };

    return {
        formTitle: 'User information',
        formTitleVariant: 'h5',
        buttonText: 'Update',
        fields: [
            {
                label: 'Title',
                name: 'title',
                select: true,
                options: TITLE_OPTIONS,
                additionalInputProps: {
                    valueToOpen: 'Other',
                    name: 'titleInput',
                    label: 'Title',
                    required: true
                }
            },
            {
                label: 'First name',
                name: 'firstName'
            },
            {
                label: 'Last name',
                name: 'lastName'
            },
            {
                label: 'Email',
                name: 'email'
            },
            {
                label: 'Telephone',
                name: 'telephone'
            },
            {
                label: 'Status',
                name: 'status',
                select: true,
                options: USER_STATUS_OPTIONS
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        inputsVariant: 'filled',
        validationSchema: Yup.object().shape({
            firstName: Yup.string().label('First name').required(),
            lastName: Yup.string().label('Last name').required(),
            email: Yup.string().email().label('Email').required(),
            telephone: Yup.string().label('Telephone')
        })
    };
};
