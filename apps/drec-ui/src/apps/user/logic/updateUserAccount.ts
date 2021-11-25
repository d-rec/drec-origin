import { UserDTO } from '@energyweb/origin-drec-api-client';
import { GenericFormProps } from '@energyweb/origin-ui-core';
import * as Yup from 'yup';

type TUpdateUserDataFormValues = {
    firstName: UserDTO['firstName'];
    lastName: UserDTO['lastName'];
    telephone: UserDTO['telephone'];
    status: UserDTO['status'];
    emailConfirmed: string;
};

export const useUpdateUserAccountDataFormConfig = (
    user: UserDTO
): Omit<GenericFormProps<TUpdateUserDataFormValues>, 'submitHandler'> => {
    const { firstName, lastName, telephone, status, emailConfirmed } = user;
    const initialFormData: TUpdateUserDataFormValues = {
        firstName,
        lastName,
        telephone,
        status,
        emailConfirmed: emailConfirmed ? 'Yes' : 'No'
    };
    return {
        buttonText: 'Save',
        fields: [
            {
                label: 'First name',
                name: 'firstName',
                required: true
            },
            {
                label: 'Last name',
                name: 'lastName',
                required: true
            },
            {
                label: 'Telephone',
                name: 'telephone',
                required: true
            },
            {
                label: 'Status',
                name: 'status',
                textFieldProps: { disabled: true }
            },
            {
                label: 'Email confirmed',
                name: 'emailConfirmed',
                textFieldProps: { disabled: true }
            }
        ],
        buttonWrapperProps: { justifyContent: 'flex-start' },
        initialValues: initialFormData,
        twoColumns: true,
        inputsVariant: 'filled' as any,
        validationSchema: Yup.object().shape({
            firstName: Yup.string().label('First name').required(),
            lastName: Yup.string().label('Last name').required(),
            telephone: Yup.string().min(10).label('Telephone').required()
        })
    };
};
